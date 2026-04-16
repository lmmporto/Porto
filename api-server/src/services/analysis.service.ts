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
import type { Transaction } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// 🏛️ ARQUITETO: Versão atual do motor de análise.
const CURRENT_ANALYSIS_VERSION = "V10_MESTRE_MENTOR";

// --- SCHEMAS ---
const ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status_final', 'nota_spin', 'rota', 'produto_principal', 'objecoes',
    'insights_estrategicos', 'resumo', 'alertas', 'playbook_detalhado',
    'ponto_atencao', 'maior_dificuldade', 'pontos_fortes', 'perguntas_sugeridas', 'analise_escuta'
  ],
  properties: {
    status_final: { type: 'string', enum: ['APROVADO', 'REPROVADO', 'ATENCAO', 'NAO_SE_APLICA'] },
    rota: { type: 'string', enum: ['ROTA_A', 'ROTA_B', 'ROTA_C', 'ROTA_D'] },
    produto_principal: { type: 'string', enum: ['Nibo Obrigações Plus', 'Nibo WhatsApp', 'Nibo Conciliador', 'Nibo Emissor', 'Ferramenta do Radar e CAC', 'NAO_IDENTIFICADO'] },
    objecoes: { type: 'array', items: { type: 'string' } },
    insights_estrategicos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Nome dinâmico do insight' },
          value: { type: 'string', description: 'Valor percentual ou qualitativo' },
          type: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
        },
        required: ['label', 'value', 'type']
      }
    },
    nota_spin: { type: ['number', 'null'] },
    resumo: { type: 'string' },
    playbook_detalhado: {
      type: 'array',
      items: { type: 'string' },
      description: "Lista de insights no formato [MM:SS] Lead disse: '...' | Mentor: '[DIAGNÓSTICO]: [FRASE CORRETIVA TAXATIVA]'"
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
  properties: { transcript: { type: 'string' } },
};

// --- INTERFACES ---
export interface AnalysisResult {
  status_final: string;
  rota: string;
  produto_principal: string;
  objecoes: string[];
  insights_estrategicos: { label: string; value: string; type: 'positive' | 'negative' | 'neutral' }[];
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

const getGeminiModel = () => {
  if (!gemini) throw new Error('GEMINI_API_KEY não configurada.');
  return gemini;
};

function cleanGeminiResponse(text: string): string {
  if (!text) return '';
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// --- FUNÇÕES PRINCIPAIS ---

export async function transcribeRecordingFromHubSpot(call: CallData): Promise<string> {
  if (call.hasTranscript && call.transcript && call.transcript.length >= 100) {
    return call.transcript;
  }

  if (!call?.recordingUrl) {
    throw new Error(`Nenhum áudio disponível para: ${call.callId || call.id}`);
  }

  let localFilePath = '';
  let uploadedFile: { name?: string; uri?: string; mimeType?: string } | null = null;

  try {
    const audioResponse = await axios.get(call.recordingUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: { 'Authorization': `Bearer ${CONFIG.HUBSPOT_TOKEN}` },
    });

    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);
    const contentType = String(audioResponse.headers['content-type'] || 'audio/mpeg');
    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${detectAudioExtension(contentType)}`);

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

    const parsed = safeJsonParse(cleanGeminiResponse(response?.text || ''));
    return sanitizeText(parsed?.transcript || '');

  } finally {
    if (uploadedFile?.name) getGeminiModel().files.delete({ name: uploadedFile.name }).catch(() => { });
    if (localFilePath) unlink(localFilePath).catch(() => { });
  }
}

export async function analyzeCallWithGemini(call: CallData, ownerDetails: OwnerDetails): Promise<AnalysisWithDebug> {
  // 1. Validação de Cache e Integridade
  if (call.lastAnalysisVersion === CURRENT_ANALYSIS_VERSION && call.analysisResult) {
    console.log(`✅ [Short-circuit] Análise recuperada do cache: ${CURRENT_ANALYSIS_VERSION}`);
    return {
      analysis: call.analysisResult as AnalysisResult,
      rawPrompt: "Cache",
      rawResponse: "Cache"
    };
  }

  if (!call.transcript || call.transcript.trim().length < 10) {
    throw new Error("Transcrição insuficiente ou ausente para análise.");
  }

  console.log(`🧠 [IA] Processando análise rigorosa (Mestre Mentor) para: ${call.id}`);

  const prompt = `
Você é o "Mestre Mentor de Vendas", um analista sênior focado em transformar SDRs em máquinas de alta performance através de feedback taxonômico e construtivo.

--- OBJETIVO ---
Analisar a transcrição e fornecer um diagnóstico técnico. Você deve ser justo: elogie o que foi bem feito, mas seja CIRÚRGICO e TAXATIVO onde houve passividade ou perda de controle da call.

--- CATÁLOGO DE PRODUTOS NIBO ---
1. Nibo Obrigações Plus
2. Nibo WhatsApp
3. Nibo Conciliador
4. Nibo Emissor
5. Ferramenta do Radar e CAC

--- REGRAS DE OURO DE ESTRUTURA ---
1. TIMESTAMPS OBRIGATÓRIOS: No campo 'playbook_detalhado', cada entrada DEVE iniciar rigorosamente com [MM:SS].
2. LINGUAGEM HUMANA: Use "Nesta abordagem" ou "Nesta interação" nos campos de texto. Proibido escrever "Rota A/B/C" para o usuário.
3. PADRÃO DE FEEDBACK: 
   - Identifique o erro -> Explique o impacto negativo -> Dê a frase EXATA que deveria ter sido dita.
4. CLASSIFICAÇÃO TÉCNICA: No campo JSON 'rota', você DEVE classificar obrigatoriamente como 'ROTA_A', 'ROTA_B', 'ROTA_C' ou 'ROTA_D' para fins de banco de dados.
5. INSIGHTS ESTRATÉGICOS: No campo 'insights_estrategicos', gere labels dinâmicos baseados no que for mais relevante na call (ex: 'Exploração de Dor', 'Aderência ao Nibo Plus').
6. METADADOS GESTÃO: Rota, produto_principal e objecoes são campos técnicos para o gestor e NÃO devem aparecer no feedback textual do SDR.

--- CRITÉRIOS DE PONTUAÇÃO (MERITOCRACIA CONSTRUTIVA) ---
A nota é de 0 a 10, baseada em:
- Domínio e Direcionamento (Até 4.0 pts): O SDR liderou a conversa ou foi levado pelo lead?
- Exploração de Dor/Desafio (Até 4.0 pts): O SDR aprofundou no problema ou aceitou respostas superficiais?
- Firmeza no Próximo Passo (Até 2.0 pts): O agendamento foi cravado com dia e hora? 

--- FORMATO DO PLAYBOOK DETALHADO (O PONTO DE OURO) ---
Para cada falha ou oportunidade de melhoria, use EXATAMENTE este modelo:
"[MM:SS] Lead disse: '...' | Mentor: '[DIAGNÓSTICO]: [FRASE CORRETIVA TAXATIVA]'"

Exemplo de Rigor:
"[02:15] Lead disse: 'Pode me mandar por e-mail?' | Mentor: 'PASSIVIDADE DETECTADA: Você aceitou o descarte imediato. Deveria ter dito: "Fulano, o e-mail não explica como resolvemos [DOR]. Na terça às 14h ou quarta às 10h, o que fica melhor para uma demonstração rápida?"'"

--- DADOS PARA ANÁLISE ---
SDR: ${ownerDetails.ownerName}
TRANSCRIÇÃO:
${call.transcript}
  `.trim();

  try {
    const response = await getGeminiModel().models.generateContent({
      model: CONFIG.GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    const rawResponse = cleanGeminiResponse(response?.text || '');
    const parsed = safeJsonParse(rawResponse);

    if (!parsed || typeof parsed !== 'object' || !parsed.playbook_detalhado) {
      throw new Error("Falha na validação da estrutura de resposta da IA.");
    }

    return {
      analysis: parsed as unknown as AnalysisResult,
      rawPrompt: prompt,
      rawResponse: rawResponse
    };
  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    throw error;
  }
}

export async function updateDailyStats(callData: any, analysis: any, isUpdate: boolean = false) {
  try {
    const dayId = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dashboard_stats').doc(dayId);
    const sdrKey = callData.ownerEmail || "Desconhecido";

    const isValida = analysis.status_final !== 'NAO_SE_APLICA' && analysis.nota_spin !== null;
    const nota = isValida ? Number(analysis.nota_spin || 0) : 0;

    await statsRef.set({
      [`sdr_ranking.${sdrKey}.total`]: FieldValue.increment(isUpdate ? 0 : 1),
      [`sdr_ranking.${sdrKey}.sum_notes`]: FieldValue.increment(isUpdate && isValida ? nota : 0),
      [`sdr_ranking.${sdrKey}.ownerName`]: callData.ownerName || "SDR",
      [`sdr_ranking.${sdrKey}.ownerEmail`]: sdrKey,
    }, { merge: true });
  } catch (error) {
    console.error("❌ [STATS ERROR]:", error);
  }
}

export async function updateSdrGlobalStats(
  email: string, 
  name: string, 
  nota: number, 
  transaction?: admin.firestore.Transaction
) {
  const sdrId = email.replace(/[.$#[\]]/g, '_');
  const dayId = new Date().toISOString().split('T')[0];
  
  const sdrRef = db.collection('sdrs').doc(sdrId);
  const dailyRef = db.collection('dashboard_stats').doc(dayId);
  const globalRef = db.collection('dashboard_stats').doc('global_summary');

  const logic = async (t: admin.firestore.Transaction) => {
    const sdrDoc = await t.get(sdrRef);
    const dailyDoc = await t.get(dailyRef);
    const globalDoc = await t.get(globalRef);

    const sdrData = (sdrDoc.exists ? sdrDoc.data() : {}) as any;
    const newSdrCount = (sdrData.callCount || 0) + 1;
    const newSdrTotal = (sdrData.totalScore || 0) + nota;

    const updateStats = (docSnap: admin.firestore.DocumentSnapshot) => {
      const data = (docSnap.exists ? docSnap.data() : {}) as any;
      const total_calls = (data.total_calls || 0) + 1;
      const sum_notes = (data.sum_notes || 0) + nota;
      return {
        total_calls,
        sum_notes,
        media_geral: Number((sum_notes / total_calls).toFixed(2)),
        taxa_aprovacao: Math.round(((data.approved_count || 0) + (nota >= 7 ? 1 : 0)) / total_calls * 100),
        approved_count: (data.approved_count || 0) + (nota >= 7 ? 1 : 0),
        last_update: admin.firestore.FieldValue.serverTimestamp()
      };
    };

    t.set(sdrRef, {
      ...sdrData,
      name,
      email,
      callCount: newSdrCount,
      totalScore: newSdrTotal,
      real_average: Number((newSdrTotal / newSdrCount).toFixed(2)),
      ranking_score: Number(((newSdrTotal + (5 * 7.0)) / (newSdrCount + 5)).toFixed(2))
    }, { merge: true });

    t.set(dailyRef, updateStats(dailyDoc), { merge: true });
    t.set(globalRef, updateStats(globalDoc), { merge: true });
  };

  if (transaction) {
    await logic(transaction);
  } else {
    await db.runTransaction(logic);
  }
}

export async function listAnalyses(filters: any, limitCount: number = 10) {
  let query: FirebaseFirestore.Query = db.collection('calls_analysis').orderBy('callTimestamp', 'desc');
  if (filters.ownerEmail) query = query.where('ownerEmail', '==', filters.ownerEmail);
  const snapshot = await query.limit(limitCount).get();
  return {
    calls: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastVisible: snapshot.docs[snapshot.docs.length - 1]?.id
  };
}