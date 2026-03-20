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

const ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['status_final', 'nota_spin', 'resumo', 'alertas', 'ponto_atencao', 'maior_dificuldade', 'pontos_fortes'],
  properties: {
    status_final: { type: 'string', enum: ['APROVADO', 'REPROVADO', 'ATENCAO'] },
    nota_spin: { type: 'number', minimum: 0, maximum: 10 },
    resumo: { type: 'string' },
    alertas: { type: 'array', items: { type: 'string' } },
    ponto_atencao: { type: 'string' },
    maior_dificuldade: { type: 'string' },
    pontos_fortes: { type: 'array', items: { type: 'string' } },
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

export interface AnalysisResult {
  status_final: string;
  nota_spin: number;
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string;
  pontos_fortes: string[];
}

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
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentType = String(audioResponse.headers['content-type'] || '');
    const ext = detectAudioExtension(contentType);

    if (!contentType.toLowerCase().includes('audio')) {
      throw new Error(`Conteúdo baixado não é áudio. content-type=${contentType}`);
    }

    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Arquivo de áudio vazio.');
    }

    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${ext}`);
    await writeFile(localFilePath, buffer);

    uploadedFile = await gemini.files.upload({ file: localFilePath, config: { mimeType: contentType } });

    const prompt =
      'Transcreva integralmente este áudio de ligação em português do Brasil. Retorne apenas JSON válido conforme schema. {"transcript":"texto"}';

    const response = await gemini.models.generateContent({
      model: CONFIG.GEMINI_TRANSCRIPTION_MODEL,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
        prompt,
      ]),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: TRANSCRIPTION_RESPONSE_SCHEMA,
        temperature: 0,
      },
    });

    return sanitizeText((safeJsonParse(response?.text)?.transcript as string) || '');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`TRANSCRIPTION_FAILED: ${msg}`);
  } finally {
    if (uploadedFile?.name) await gemini.files.delete({ name: uploadedFile.name }).catch(() => {});
    if (localFilePath) await unlink(localFilePath).catch(() => {});
  }
}

export async function analyzeCallWithGemini(call: CallData, ownerDetails: OwnerDetails): Promise<AnalysisResult> {
  if (!gemini) throw new Error('GEMINI_API_KEY não configurada.');

  const prompt = `
Você é um avaliador sênior de ligações de Vendas (SDR).
Seu papel é analisar a qualidade da conversa com base na metodologia SPIN Selling e melhores práticas de vendas.

Avalie a ligação e retorne ESTRITAMENTE o formato JSON solicitado.
Identifique alertas, a maior dificuldade enfrentada, o ponto principal de atenção e destaque os pontos fortes da abordagem do SDR.

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

  const parsed = safeJsonParse(response?.text);
  if (!parsed) throw new Error('Gemini retornou um formato JSON inválido.');
  return parsed as unknown as AnalysisResult;
}
