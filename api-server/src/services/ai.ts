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

// --- SCHEMAS E INTERFACES ATUALIZADOS ---

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
    'perguntas_sugeridas', // Novo
    'analise_escuta'       // Novo
  ],
  properties: {
    status_final: { type: 'string', enum: ['APROVADO', 'REPROVADO', 'ATENCAO'] },
    nota_spin: { type: 'number', minimum: 0, maximum: 10 },
    resumo: { type: 'string' },
    alertas: { type: 'array', items: { type: 'string' } },
    ponto_atencao: { type: 'string' },
    maior_dificuldade: { type: 'string' },
    pontos_fortes: { type: 'array', items: { type: 'string' } },
    perguntas_sugeridas: { type: 'array', items: { type: 'string' } },
    analise_escuta: { type: 'string' },
  },
};

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

// --- FUNÇÕES ---

export async function transcribeRecordingFromHubSpot(call: CallData): Promise<string> {
  if (!gemini) throw new Error('GEMINI_API_KEY não configurada.');
  if (!call?.recordingUrl) return '';

  let localFilePath = '';
  let uploadedFile: { name?: string; uri?: string; mimeType?: string } | null = null;

  try {
    const audioResponse = await axios.get(call.recordingUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: { Authorization: `Bearer ${CONFIG.HUBSPOT_TOKEN}` },
      maxRedirects: 5,
    });

    const contentType = String(audioResponse.headers['content-type'] || '');
    const ext = detectAudioExtension(contentType);
    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);

    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${ext}`);
    await writeFile(localFilePath, buffer);

    uploadedFile = await gemini.files.upload({ file: localFilePath, config: { mimeType: contentType } });

    const prompt = 'Transcreva integralmente este áudio de ligação em português do Brasil. Retorne apenas JSON válido. {"transcript":"texto"}';

    const response = await gemini.models.generateContent({
      model: CONFIG.GEMINI_TRANSCRIPTION_MODEL,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
        prompt,
      ]),
      config: { responseMimeType: 'application/json', temperature: 0 },
    });

    return sanitizeText((safeJsonParse(response?.text)?.transcript as string) || '');
  } catch (error: any) {
    throw new Error(`TRANSCRIPTION_FAILED: ${error.message}`);
  } finally {
    if (uploadedFile?.name) await gemini.files.delete({ name: uploadedFile.name }).catch(() => {});
    if (localFilePath) await unlink(localFilePath).catch(() => {});
  }
}

export async function analyzeCallWithGemini(call: CallData, ownerDetails: OwnerDetails): Promise<AnalysisWithDebug> {
  if (!gemini) throw new Error('GEMINI_API_KEY não configurada.');

  const prompt = `
Você é um Coach de Vendas de alta performance (Nível Gemini 2.5). Sua análise deve ser rigorosa e focada em transformar o SDR em um consultor de elite.

--- REGRAS DE STATUS (Obrigatório) ---
- nota_spin 0 a 4: REPROVADO (SDR foi apenas um processador de pedidos/cancelamentos).
- nota_spin 5 a 7: ATENCAO (Fez o básico, mas não explorou a dor ou conexão).
- nota_spin 8 a 10: APROVADO (Consultor real, usou escuta ativa e SPIN).

--- FOCO DA ANÁLISE ---
1. OPORTUNIDADES PERDIDAS: Identifique momentos em que o cliente deu uma "deixa" (dor ou informação valiosa) e o SDR não explorou.
2. ANÁLISE DE ESCUTA: Avalie a fluidez. O SDR interrompeu o cliente? Soube ouvir? (Considere desculpas por delay/atraso de rede como ponto positivo de etiqueta).
3. PERGUNTAS SUGERIDAS: Identifique lacunas na descoberta e sugira exatamente quais perguntas de "Problema" ou "Implicação" deveriam ter sido feitas para gerar valor.

--- REGRA DE NOTA (SLA + PERFORMANCE) ---
- SLA (4.0 pts): 1 pergunta de Situação + 1 de Problema. Se não fizer NENHUMA, a nota máxima é 2.
- CONEXÃO (6.0 pts): Capacidade de usar as palavras do cliente para conectar à solução (Radar Ica / Nibo).

Metadados:
- SDR/Owner: ${ownerDetails.ownerName}
- Equipe: ${ownerDetails.teamName}
- Duração: ${call.durationMs}ms

Transcrição:
${call.transcript || '[SEM TRANSCRIÇÃO]'}
  `.trim();

  const response = await gemini.models.generateContent({
    model: CONFIG.GEMINI_ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const rawResponse = response?.text || '';
  const parsed = safeJsonParse(rawResponse);
  
  if (!parsed) {
    throw new Error(`Gemini 2.5 retornou um formato JSON inválido. Resposta bruta: ${rawResponse}`);
  }

  return {
    analysis: parsed as unknown as AnalysisResult,
    rawPrompt: prompt,
    rawResponse: rawResponse
  };
}