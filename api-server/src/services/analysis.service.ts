// src/services/analysis.service.ts

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
    nota_spin: { type: ['number', 'null'] }, 
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
  nota_spin: number | null;
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

// --- FUNÇÃO DE LIMPEZA PARA MODELOS MODERNOS ---
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

    if (buffer.byteLength < 3500000) {
      console.log(`[SKIP] 🛑 Call ${call.id} ignorada: Abaixo do limite mínimo de 3.5MB.`);
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
Você é um Coach de Vendas focado em desenvolvimento contínuo. Sua abordagem é ADITIVA. Você entende o contexto de vendas B2B para contabilidade.

--- PASSO 1: CLASSIFICAÇÃO DO CONTEXTO ---
Identifique o tipo da ligação:
- ROTA A (Reagendamento/Follow-up)
- ROTA B (Prospecção/Novo Agendamento)
- ROTA C (Conversa Genérica/Não Avaliada)

--- PASSO 2: SISTEMA DE PONTUAÇÃO ADITIVO (0 a 10) ---

SE ROTA A ou B: Baseado em técnica (SPIN).
SE ROTA C: NOTA TÉCNICA = null.

--- REGRAS DE STATUS FINAL (Rigoroso) ---
- ROTA A ou B com nota < 5: REPROVADO
- ROTA A ou B com nota 5 a 7: ATENCAO
- ROTA A ou B com nota 8 a 10: APROVADO
- ROTA C: NAO_SE_APLICA.

SDR: ${ownerDetails.ownerName} | Equipe: ${ownerDetails.teamName}
Duração: ${call.durationMs}ms | Palavras: ${wordCount}

Transcrição:
${call.transcript || '[SEM TRANSCRIÇÃO]'}
  `.trim();

  try {
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

/**
 * 📊 ATUALIZAÇÃO DO COFRE DE SALDOS
 * @param isUpdate - Se for true, não incrementa o total_calls (apenas atualiza notas/status)
 */
export async function updateDailyStats(callData: any, analysis: any, isUpdate: boolean = false) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dashboard_stats').doc(today);

    const isValida = analysis.status_final !== 'NAO_SE_APLICA' && 
                     analysis.status_final !== 'NAO_IDENTIFICADO' && 
                     analysis.nota_spin !== null && 
                     Number(analysis.nota_spin) > 0;
    
    const nota = isValida ? Number(analysis.nota_spin) : 0;
    const sdrName = callData.ownerName || "Desconhecido";

    // 🚩 LÓGICA SÊNIOR: Se for um update (IA terminou), o incremento de TOTAL é ZERO.
    const totalIncrement = isUpdate ? 0 : 1;

    const updatePayload: any = {
      date: today,
      updatedAt: FieldValue.serverTimestamp(),
      total_calls: FieldValue.increment(totalIncrement),
      
      // Só incrementa o divisor da média se a call for útil
      valid_calls: isValida ? FieldValue.increment(1) : FieldValue.increment(0),
      sum_notes: isValida ? FieldValue.increment(nota) : FieldValue.increment(0),
      
      count_aprovado: analysis.status_final === 'APROVADO' ? FieldValue.increment(1) : FieldValue.increment(0),
      count_atencao: analysis.status_final === 'ATENCAO' ? FieldValue.increment(1) : FieldValue.increment(0),
      count_reprovado: analysis.status_final === 'REPROVADO' ? FieldValue.increment(1) : FieldValue.increment(0),
    };

    // Ranking por SDR
    updatePayload[`sdr_ranking.${sdrName}.total`] = FieldValue.increment(totalIncrement);
    updatePayload[`sdr_ranking.${sdrName}.sum_notes`] = isValida ? FieldValue.increment(nota) : FieldValue.increment(0);
    updatePayload[`sdr_ranking.${sdrName}.valid_count`] = isValida ? FieldValue.increment(1) : FieldValue.increment(0);

    await statsRef.set(updatePayload, { merge: true });

    console.log(`📊 [COFRE] ${isUpdate ? 'UPDATE' : 'NOVO'}: ${sdrName} | Válida: ${isValida}`);
  } catch (error) {
    console.error("❌ [COFRE ERROR]:", error);
  }
}