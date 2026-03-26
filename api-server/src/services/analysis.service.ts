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

// 🚩 ADICIONADO: Necessário para o Cofre de Saldos
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// --- SCHEMAS ---

const ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status_final', 
    'nota_spin', 
    'resumo', 
    'alertas', 
    'ponto_atencao', 
    'maior_dificuldade', 
    'pontos_fortes',
    'perguntas_sugeridas', 
    'analise_escuta'
  ],
  properties: {
    status_final: { type: 'string', enum: ['APROVADO', 'REPROVADO', 'ATENCAO', 'NAO_SE_APLICA'] },
    nota_spin: { type: 'number' },
    resumo: { type: 'string' },
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

// --- INTERFACES ---

export interface AnalysisResult {
  status_final: string;
  nota_spin: number;
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string;
  pontos_fortes: string[];
  perguntas_sugeridas: string[];
  analise_escuta: string;
}

export interface AnalysisWithDebug {
  analysis: AnalysisResult;
  rawPrompt: string;
  rawResponse: string;
}

// --- FUNÇÃO DE LIMPEZA PARA MODELOS MODERNOS (Gemini 2.5/3) ---

function cleanGeminiResponse(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return cleaned;
}

// --- FUNÇÕES PRINCIPAIS ---

export async function transcribeRecordingFromHubSpot(call: CallData): Promise<string> {
  if (!gemini) throw new Error('GEMINI_API_KEY não configurada no cliente.');
  if (!call?.recordingUrl) {
    console.warn(`[TRANSCRIPTION] Call ${call.id} sem URL de gravação.`);
    return '';
  }

  console.log(`\n--- 🎙️ INICIANDO TRANSCRIÇÃO (Call: ${call.id}) ---`);
  console.log(`[MODELO] Usando: ${CONFIG.GEMINI_TRANSCRIPTION_MODEL}`);

  let localFilePath = '';
  let uploadedFile: { name?: string; uri?: string; mimeType?: string } | null = null;

  try {
    console.log(`[STEP 1] Baixando áudio do HubSpot...`);
    const audioResponse = await axios.get(call.recordingUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: { Authorization: `Bearer ${CONFIG.HUBSPOT_TOKEN}` },
    });

    const contentType = String(audioResponse.headers['content-type'] || 'audio/mpeg');
    const ext = detectAudioExtension(contentType);
    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);
    
    const fileSizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`[STEP 2] Peso do arquivo: ${fileSizeMB} MB`);

    // 🚩 TRAVA DE SEGURANÇA: 3.5MB
    if (buffer.byteLength < 3500000) {
      console.log(`[SKIP] 🛑 Call ${call.id} ignorada: Abaixo do limite de 3.5MB.`);
      return '';
    }

    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${ext}`);
    await writeFile(localFilePath, buffer);
    console.log(`[STEP 3] Arquivo temporário criado: ${localFilePath}`);

    console.log(`[STEP 4] Fazendo upload para Google Media Service...`);
    uploadedFile = await gemini.files.upload({ 
      file: localFilePath, 
      config: { mimeType: contentType } 
    });
    console.log(`[STEP 4 - OK] File URI: ${uploadedFile.uri}`);

    console.log(`[STEP 5] Chamando Gemini para transcrição...`);
    const response = await gemini.models.generateContent({
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
    const transcript = sanitizeText(parsed?.transcript || '');

    console.log(`[STEP 5 - OK] Transcrição concluída. Palavras: ${transcript.split(/\s+/).length}`);
    return transcript;

  } catch (error: any) {
    console.error(`[TRANSCRIPTION ERROR] Falha na Call ${call.id}:`, error.message);
    if (error.message.includes('8 RESOURCE_EXHAUSTED')) {
      console.error('🚨 ALERTA: Cota do Google esgotada nesta etapa (Transcrição)!');
    }
    throw error;
  } finally {
    if (uploadedFile?.name) {
      await gemini.files.delete({ name: uploadedFile.name }).catch(() => {});
      console.log(`[CLEANUP] Arquivo deletado do Google Media.`);
    }
    if (localFilePath) {
      await unlink(localFilePath).catch(() => {});
      console.log(`[CLEANUP] Arquivo temporário local removido.`);
    }
  }
}

export async function analyzeCallWithGemini(call: CallData, ownerDetails: OwnerDetails): Promise<AnalysisWithDebug> {
  if (!gemini) throw new Error('GEMINI_API_KEY não configurada.');

  console.log(`\n--- 🧠 INICIANDO ANÁLISE IA (Call: ${call.id}) ---`);
  console.log(`[MODELO] Usando: ${CONFIG.GEMINI_ANALYSIS_MODEL}`);

  const wordCount = (call.transcript || '').split(/\s+/).length;

  const prompt = `
Você é um Coach de Vendas focado em desenvolvimento contínuo. Sua abordagem é ADITIVA. Você entende o contexto de vendas B2B para contabilidade (Radar ecac / Nibo/Conciliador/).

--- PASSO 1: CLASSIFICAÇÃO DO CONTEXTO ---
Identifique o tipo da ligação:
- ROTA A (Reagendamento/Follow-up): SDR buscando cobrar ou remarcar uma agenda que já existia.
- ROTA B (Prospecção/Novo Agendamento): Busca de nova qualificação ou primeiro agendamento.
- ROTA C (Conversa Genérica/Não Avaliada): 🚩 Ligações que não possuem intenção de venda ou agendamento (ex: engano, conversa interna, queda de linha após o "alô", ou o lead diz que não pode falar e desliga imediatamente).

--- PASSO 2: SISTEMA DE PONTUAÇÃO ADITIVO (0 a 10) ---

SE ROTA A (Reagendamento):
- Conseguiu novo horário? NOTA BASE = 4.0.
- SOMA +2.0: Controlou a agenda.
- SOMA +2.0: Empatia e micro-compromisso.
- SOMA +2.0: Reancorou valor/dor.

SE ROTA B (Prospecção):
- Agendou? NOTA BASE = 5.0.
- Restante da nota baseado em técnica (SPIN) e tempo (${wordCount} palavras).

SE ROTA C:
- NOTA FIXA = 0.0. 
- Justificativa: Esta ligação será ignorada das métricas de performance técnica.

--- REGRAS DE STATUS FINAL (Rigoroso) ---
- ROTA A ou B com nota < 5: REPROVADO
- ROTA A ou B com nota 5 a 7: ATENCAO
- ROTA A ou B com nota 8 a 10: APROVADO
- ROTA C: 🚩 NAO_SE_APLICA (Sempre use este status para ROTA C).

--- DIRETRIZES PARA O JSON ---
- "resumo": Identifique se foi ROTA A, B ou C.
- "pontos_fortes": Destaque o que houve de bom (se Rota C, retorne array vazio).
- "ponto_atencao": Onde melhorar ou motivo do descarte (Rota C).
- "perguntas_sugeridas": Sugestões pertinentes.
- "analise_escuta": Avaliação da fluidez.
- "alertas": Comportamentos urgentes ou [].
- "maior_dificuldade": Aponte a resistência do lead.

SDR: ${ownerDetails.ownerName} | Equipe: ${ownerDetails.teamName}
Duração: ${call.durationMs}ms | Palavras: ${wordCount}

Transcrição:
${call.transcript || '[SEM TRANSCRIÇÃO]'}
  `.trim();

  try {
    console.log(`[STEP 1] Enviando Prompt para o Gemini (${wordCount} palavras)...`);
    const response = await gemini.models.generateContent({
      model: CONFIG.GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.3, 
      },
    });

    const rawResponse = cleanGeminiResponse(response?.text || '');
    console.log(`[STEP 2] Resposta bruta recebida da IA.`);
    
    const parsed = safeJsonParse(rawResponse);
    if (!parsed) throw new Error(`Falha crítica no parse JSON: ${rawResponse}`);

    console.log(`[STEP 3] Análise finalizada. Status: ${parsed.status_final}`);

    return {
      analysis: parsed as unknown as AnalysisResult,
      rawPrompt: prompt,
      rawResponse: rawResponse
    };

  } catch (error: any) {
    console.error(`[ANALYSIS ERROR] Falha na Call ${call.id}:`, error.message);
    if (error.message.includes('8 RESOURCE_EXHAUSTED')) {
      console.error('🚨 ALERTA: Cota esgotada na etapa de Análise IA!');
    }
    throw error;
  }
}

/**
 * 🚩 FUNÇÃO DO COFRE DE SALDOS
 * Computa as métricas diárias e ranking de SDRs
 */
export async function updateDailyStats(callData: any, analysis: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dashboard_stats').doc(today);

    const isRotaC = analysis.status_final === 'NAO_SE_APLICA';
    const nota = Number(analysis.nota_spin || 0);
    const sdrName = callData.ownerName || "Desconhecido";

    await statsRef.set({
      date: today,
      updatedAt: FieldValue.serverTimestamp(),
      total_calls: FieldValue.increment(1),
      valid_calls: isRotaC ? FieldValue.increment(0) : FieldValue.increment(1),
      sum_notes: isRotaC ? FieldValue.increment(0) : FieldValue.increment(nota),
      count_aprovado: analysis.status_final === 'APROVADO' ? FieldValue.increment(1) : FieldValue.increment(0),
      count_atencao: analysis.status_final === 'ATENCAO' ? FieldValue.increment(1) : FieldValue.increment(0),
      count_reprovado: analysis.status_final === 'REPROVADO' ? FieldValue.increment(1) : FieldValue.increment(0),
      
      // Ranking por SDR
      [`sdr_ranking.${sdrName}.total`]: FieldValue.increment(1),
      [`sdr_ranking.${sdrName}.sum_notes`]: isRotaC ? FieldValue.increment(0) : FieldValue.increment(nota),
      [`sdr_ranking.${sdrName}.valid_count`]: isRotaC ? FieldValue.increment(0) : FieldValue.increment(1),
    }, { merge: true });

    console.log(`📊 [COFRE] Saldo atualizado para ${sdrName}.`);
  } catch (error) {
    console.error("❌ [COFRE ERROR]:", error);
  }
}