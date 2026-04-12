import axios from 'axios';
import { writeFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createUserContent, createPartFromUri } from '@google/genai';
import { gemini } from '../clients.js';
import { CONFIG } from '../config.js';
import { sanitizeText, safeJsonParse, detectAudioExtension } from '../utils.js';
import type { CallData, OwnerDetails } from './hubspot.js';

import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// --- SCHEMAS ---
const ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status_final', 
    'nota_spin',
    'rota', // 🚩 ADICIONADO 
    'resumo', 
    'alertas', 
    'playbook_detalhado', 
    'ponto_atencao', 
    'maior_dificuldade', 
    'pontos_fortes',
    'perguntas_sugeridas', 
    'analise_escuta'
  ],
  properties: {
    status_final: { type: 'string', enum: ['APROVADO', 'REPROVADO', 'ATENCAO', 'NAO_SE_APLICA'] },
    rota: { type: 'string', enum: ['ROTA_A', 'ROTA_B', 'ROTA_C', 'ROTA_D'] },
    nota_spin: { type: ['number', 'null'] }, 
    resumo: { type: 'string' },
    playbook_detalhado: { 
      type: 'array', 
      items: { type: 'string' },
      description: "Lista de insights no formato [MM:SS] Citação do Lead: '...' -> Dica de Ouro: '...'"
    },
    alertas: { type: 'array', items: { type: 'string' } },
    ponto_atencao: { type: 'string' },
    maior_dificuldade: { type: 'string' },
    pontos_fortes: { type: 'array', items: { type: 'string' } },
    perguntas_sugeridas: { type: 'array', items: { type: 'string' } },
    analise_escuta: { type: 'string' },
  },
};

const TRANSCRIPTION_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['transcript'],
  properties: {
    transcript: { type: 'string' },
  },
};

// --- INTERFACES SINCRONIZADAS ---
export interface AnalysisResult {
  status_final: 'APROVADO' | 'REPROVADO' | 'ATENCAO' | 'NAO_SE_APLICA';
  nota_spin: number | null;
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string;
  pontos_fortes: string[];
  perguntas_sugeridas: string[];
  analise_escuta: string;
  playbook_detalhado: string[]; 
}

export interface AnalysisWithDebug {
  analysis: AnalysisResult;
  rawPrompt: string;
  rawResponse: string;
}

// 🚩 VERIFICAÇÃO DE EXISTÊNCIA: Centraliza a validação do cliente Gemini
const getGeminiModel = () => {
  if (!gemini) {
    throw new Error('GEMINI_API_KEY não configurada ou cliente não inicializado.');
  }
  return gemini;
};

// --- FUNÇÃO DE LIMPEZA PARA MODELOS MODERNOS ---
function cleanGeminiResponse(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return cleaned;
}

// --- FUNÇÕES PRINCIPAIS ---

/**
 * 🎙️ TRANSCRIÇÃO DE ÁUDIO BLINDADA
 */
export async function transcribeRecordingFromHubSpot(call: CallData): Promise<string> {
  if (call.hasTranscript && call.transcript && call.transcript.length >= 100) {
    console.log(`⚡ [Short-circuit] Usando transcrição nativa para: ${call.callId || call.id}`);
    return call.transcript;
  }

  if (!call?.recordingUrl) {
    throw new Error(`Nenhum áudio disponível para transcrição na call: ${call.callId || call.id}`);
  }

  console.log(`🎙️ [IA] Iniciando download e transcrição: ${call.callId || call.id}`);
  
  let localFilePath = '';
  let uploadedFile: { name?: string; uri?: string; mimeType?: string } | null = null;

  try {
    const audioResponse = await axios.get(call.recordingUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: { 
        'Authorization': `Bearer ${CONFIG.HUBSPOT_TOKEN}`,
        'User-Agent': 'Nibo-SDR-Analyzer/1.0',
        'Accept': '*/*'
      },
    });

    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);
    console.log(`✅ [DOWNLOAD] Sucesso! Tamanho: ${buffer.byteLength} bytes`);
    
    if (buffer.byteLength === 0) {
      throw new Error('Arquivo de áudio baixado está vazio (0 bytes).');
    }

    const contentType = String(audioResponse.headers['content-type'] || 'audio/mpeg');
    const ext = detectAudioExtension(contentType);
    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${ext}`);
    
    await writeFile(localFilePath, buffer);

    uploadedFile = await getGeminiModel().files.upload({ 
      file: localFilePath, 
      config: { mimeType: contentType } 
    });

    const response = await getGeminiModel().models.generateContent({
      model: CONFIG.GEMINI_TRANSCRIPTION_MODEL,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
        'Transcreva integralmente este áudio de ligação em português do Brasil. Retorne apenas JSON válido.',
      ]),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: TRANSCRIPTION_RESPONSE_SCHEMA,
        temperature: 0,
      },
    });

    const rawText = cleanGeminiResponse(response?.text || '');
    const parsed = safeJsonParse(rawText);
    const aiTranscript = sanitizeText(parsed?.transcript || '');

    if (!aiTranscript || aiTranscript.trim().length < 50) {
      throw new Error('IA retornou transcrição insuficiente.');
    }

    return aiTranscript;

  } catch (error: any) {
    const status = error.response?.status;
    console.error(`❌ [TRANSCRIPTION ERROR] Call ${call.id} | Status: ${status} | Msg: ${error.message}`);
    
    if (status === 403 || status === 401) {
      console.error("⚠️ ERRO DE PERMISSÃO: O HubSpot negou o acesso ao arquivo. Verifique o Token.");
    }
    throw error;
  } finally {
    if (uploadedFile?.name) {
      getGeminiModel().files.delete({ name: uploadedFile.name }).catch(e => console.error("Erro ao deletar arquivo remoto:", e.message));
    }
    if (localFilePath) {
      unlink(localFilePath).catch(e => console.error("Erro ao deletar arquivo local:", e.message));
    }
  }
}

export async function analyzeCallWithGemini(call: CallData, ownerDetails: OwnerDetails): Promise<AnalysisWithDebug> {
  console.log(`\n--- 🧠 INICIANDO ANÁLISE IA (Call: ${call.id}) ---`);
  const wordCount = (call.transcript || '').split(/\s+/).length;

  const prompt = `
OBJETIVO: Especialista Sênior em SDR. Avaliação ADITIVA (0 a 10).
FOCO: Ser construtivo, mas rigoroso. Identificar passividade e falta de "aperto" no cliente.
 
PASSO 1: CLASSIFICAÇÃO DA ROTA (OBRIGATÓRIO)
- ROTA A:Prospecção / Novo Agendamento (Primeiro contato/Filtro com Decisor).
- ROTA B: Reagendamento / Follow-up (Lead que não apareceu ou pediu retorno).
- ROTA C: Gatekeeper / Navegação (Falou com secretária/assistente para chegar no decisor).
- ROTA D: Outros / Descarte (Número errado, spam, ligação caiu). Nota técnica = null.

PASSO 2: CRITÉRIOS DE PONTUAÇÃO (TOTAL 10 PONTOS)

--- SE ROTA A (Novo Agendamento) ---
1. Rapport e Quebra de Gelo (+3,0 pts): Conexão real e abertura personalizada?
2. Diagnóstico e Implicação (+4,0 pts): Mapeou dor, insatisfação ou ponto cego? "Apertou" o cliente?
3. Agendamento e Decisores (+3,0 pts): Marcou data/hora e confirmou presença de sócios/decisores?

--- SE ROTA B (Reagendamento) ---
1. Conexão e Contexto (+3,0 pts): Retomou sem parecer cobrador e validou o motivo do reagendamento?
2. Re-ancoragem da Dor (+4,0 pts): Relembrou os problemas que motivaram o interesse original?
3. Fechamento e Compromisso (+3,0 pts): Garantiu novo horário e próximo passo claro?

--- SE ROTA C (Gatekeeper) ---
1. Posicionamento e Autoridade (+3,0 pts): Falou de igual para igual? Evitou parecer telemarketing?
2. Coleta de Inteligência (+4,0 pts): Conseguiu nome do decisor, e-mail direto ou processo de decisão?
3. Próximo Passo (+3,0 pts): Conseguiu transferência, agenda com o decisor ou prometeu retorno específico?

PASSO 3: PLAYBOOK DO OURO (OBRIGATÓRIO) (FEEDBACK DO COACH)
Para cada falha ou oportunidade, você deve gerar um item no campo 'playbook_detalhado' seguindo RIGOROSAMENTE este formato:
 "Aos[MM:SS] -, o cliente disse [Citação]. Oportunidade desperdiçada: [Explicação de como abordar]."
 Exemplo:
"Falta de aprofundamento na dor | [05:00] - O lead disse [Estou corrido] -> Dica de Ouro: O SDR aceitou a objeção passivamente. Deveria ter perguntado: 'Entendo, mas se pudéssemos ganhar 30min/dia, valeria 5min agora?'"

PASSO 4: STATUS FINAL (RIGOROSO)
- 0 a 4.9: REPROVADO | 5.0 a 7.9: ATENCAO | 8.0 a 10: APROVADO | ROTA D: NAO_SE_APLICA

INSTRUÇÕES TÉCNICAS (BLOQUEIO LÓGICO):
1. ADITIVIDADE: A nota DEVE começar em 0. Some os pontos apenas se o critério for explicitamente atendido.
2. EXCLUSIVIDADE: Use APENAS os critérios da rota identificada. Se for Rota C, ignore os critérios de Rota A e B.
3. RIGOR: Se o SDR foi passivo em um momento crucial de dor, penalize a pontuação do critério correspondente, mas o feedback se mantem construtivo.

SDR: ${ownerDetails.ownerName} | Equipe: ${ownerDetails.teamName}
Duração: ${call.durationMs}ms | Palavras: ${wordCount}

Transcrição:
${call.transcript || '[SEM TRANSCRIÇÃO]'}
  `.trim();

  try {
    const response = await getGeminiModel().models.generateContent({
      model: CONFIG.GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.3, 
      },
    });

    const rawResponse = cleanGeminiResponse(response?.text || '');
    const parsed = safeJsonParse(rawResponse);
    if (!parsed) throw new Error(`Falha crítica no parse JSON: ${rawResponse}`);

    return {
      analysis: parsed as unknown as AnalysisResult,
      rawPrompt: prompt,
      rawResponse: rawResponse
    };

  } catch (error: any) {
    console.error(`[ANALYSIS ERROR] Falha na Call ${call.id}:`, error.message);
    throw error;
  }
}

export async function updateDailyStats(callData: any, analysis: any, isUpdate: boolean = false) {
  try {
    const callDate = callData.callTimestamp ? callData.callTimestamp.toDate() : new Date();
    const nowInBrazil = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(callDate);
    const dayId = nowInBrazil.split('/').reverse().join('-'); 
    const statsRef = db.collection('dashboard_stats').doc(dayId);
    const sdrKey = callData.ownerEmail || callData.ownerName || "Desconhecido";
    const sdrName = callData.ownerName || "Desconhecido";

    const isValidaParaRanking = analysis.status_final !== 'NAO_SE_APLICA' && 
                                analysis.status_final !== 'NAO_IDENTIFICADO' &&
                                analysis.nota_spin !== null;

    const nota = isValidaParaRanking ? Number(analysis.nota_spin || 0) : 0;
    const totalIncrement = isUpdate ? 0 : 1;

    const updatePayload: any = {
      date: dayId,
      updatedAt: FieldValue.serverTimestamp(),
      total_calls: FieldValue.increment(totalIncrement),
      valid_calls: isValidaParaRanking && isUpdate ? FieldValue.increment(1) : FieldValue.increment(0),
      sum_notes: isValidaParaRanking && isUpdate ? FieldValue.increment(nota) : FieldValue.increment(0),
    };

    updatePayload[`sdr_ranking.${sdrKey}.total`] = FieldValue.increment(totalIncrement);
    updatePayload[`sdr_ranking.${sdrKey}.ownerName`] = sdrName;
    updatePayload[`sdr_ranking.${sdrKey}.ownerEmail`] = sdrKey;
    
    if (isUpdate && isValidaParaRanking) {
      updatePayload[`sdr_ranking.${sdrKey}.sum_notes`] = FieldValue.increment(nota);
      updatePayload[`sdr_ranking.${sdrKey}.valid_count`] = FieldValue.increment(1);
    }

    await statsRef.set(updatePayload, { merge: true });
  } catch (error) {
    console.error("❌ [COFRE ERROR]:", error);
  }
}

/**
 * 🏆 ATUALIZAÇÃO DO PLACAR GLOBAL POR SDR (MENSAL)
 */
export async function updateSdrGlobalStats(ownerEmail: string, ownerName: string, nota: number) {
  if (!ownerEmail) return;
  
  // 🚩 SAFRA MENSAL: Gera a chave do mês atual (Ex: 2024_04)
  const now = new Date();
  const monthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // 🚩 ID ÚNICO: Composto por e-mail sanitizado + mês
  const safeId = `${ownerEmail.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${monthKey}`;
  const sdrRef = db.collection('sdr_stats').doc(safeId);
  
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(sdrRef);
      
      if (!doc.exists) {
        transaction.set(sdrRef, {
          ownerName: ownerName,
          ownerEmail: ownerEmail,
          monthKey: monthKey, // Auditoria de safra
          totalCalls: 1,
          totalScore: nota,
          averageScore: nota,
          lastUpdated: FieldValue.serverTimestamp()
        });
      } else {
        const data = doc.data()!;
        const newTotalCalls = (data.totalCalls || 0) + 1;
        const newTotalScore = (data.totalScore || 0) + nota;
        const newAverage = newTotalScore / newTotalCalls;

        transaction.update(sdrRef, {
          totalCalls: newTotalCalls,
          totalScore: newTotalScore,
          averageScore: Number(newAverage.toFixed(2)),
          lastUpdated: FieldValue.serverTimestamp()
        });
      }
    });
    console.log(`🏆 [PLACAR MENSAL] SDR ${ownerEmail} atualizado para ${monthKey}.`);
  } catch (error) {
    console.error(`❌ [ERRO NO PLACAR] Falha ao atualizar ${ownerEmail}:`, error);
  }
}

export async function listAnalyses(filters: any, limitCount: number = 10) {
  try {
    let query: FirebaseFirestore.Query = db.collection('calls_analysis')
      .orderBy('callTimestamp', 'desc')
      .orderBy('__name__', 'asc');

    if (filters.ownerEmail) query = query.where('ownerEmail', '==', filters.ownerEmail);
    if (filters.status_final) query = query.where('status_final', '==', filters.status_final);

    if (filters.lastVisible) {
      const lastDoc = await db.collection('calls_analysis').doc(filters.lastVisible).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(limitCount).get();
    if (snapshot.empty) return { calls: [], lastVisible: null };

    const calls = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        callTimestamp: data.callTimestamp?.toDate?.()?.toISOString() || data.callTimestamp,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    return { calls, lastVisible: snapshot.docs[snapshot.docs.length - 1].id };
  } catch (error: any) {
    throw new Error(`Erro ao listar análises: ${error.message}`);
  }
}