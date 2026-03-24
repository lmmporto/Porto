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
    status_final: { type: 'string', enum: ['APROVADO', 'REPROVADO', 'ATENCAO'] },
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
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const contentType = String(audioResponse.headers['content-type'] || '');
    const ext = detectAudioExtension(contentType);

    if (!contentType.toLowerCase().includes('audio')) {
      throw new Error(`Conteúdo baixado não é áudio. content-type=${contentType}`);
    }

    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);
    
    // 🚩 TRAVA 1: PESO DO ARQUIVO (Anti-Gasto)
    // Se o áudio tiver menos de 100KB (aprox 10-15s em baixa qualidade), ignoramos.
    // Isso evita processar lixo técnico ou cliques acidentais.
    if (buffer.byteLength < 100000) {
      console.log(`[SKIP] Áudio da Call ${call.id} muito pequeno (${(buffer.byteLength / 1024).toFixed(1)}KB). Ignorando.`);
      return '';
    }

    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Arquivo de áudio vazio.');
    }

    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${ext}`);
    await writeFile(localFilePath, buffer);

    uploadedFile = await gemini.files.upload({ file: localFilePath, config: { mimeType: contentType } });

    const prompt = 'Transcreva integralmente este áudio de ligação em português do Brasil. Retorne apenas JSON válido.';

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

    const transcript = sanitizeText((safeJsonParse(response?.text)?.transcript as string) || '');

    // 🚩 TRAVA 2: VOLUME DE CONVERSA (Anti-Gasto)
    // Se a transcrição tiver menos de 25 palavras, não é uma reunião produtiva.
    // Abortamos para não gastar com a análise de coach.
    if (transcript.split(/\s+/).length < 25) {
      console.log(`[SKIP] Conteúdo insuficiente na Call ${call.id}. Palavras: ${transcript.split(/\s+/).length}`);
      return '';
    }

    return transcript;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`TRANSCRIPTION_FAILED: ${msg}`);
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
- nota_spin 0 a 4: REPROVADO (SDR foi apenas um tirador de pedidos).
- nota_spin 5 a 7: ATENCAO (Fez o básico, mas não explorou a dor ou conexão).
- nota_spin 8 a 10: APROVADO (Consultor real, usou escuta ativa e SPIN).

--- FOCO DA ANÁLISE ---
1. OPORTUNIDADES PERDIDAS: Identifique momentos em que o cliente deu uma "deixa" (dor ou informação valiosa) e o SDR não explorou.
2. ANÁLISE DE ESCUTA: Avalie a fluidez. O SDR interrompeu o cliente? Soube ouvir? (Considere desculpas por delay como ponto positivo de etiqueta).
3. PERGUNTAS SUGERIDAS: Identifique lacunas na descoberta e sugira exatamente quais perguntas de "Problema" ou "Implicação" deveriam ter sido feitas para gerar valor.

--- REGRA DE NOTA (SLA + PERFORMANCE) ---
- SLA (4.0 pts): 1 pergunta de Situação + 1 de Problema. Se não fizer NENHUMA, a nota máxima é 2.
- CONEXÃO (6.0 pts): Capacidade de usar o que o cliente disse para conectar à solução (Radar Ica / Nibo).

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
    throw new Error(`Gemini retornou um formato JSON inválido. Resposta bruta: ${rawResponse}`);
  }

  return {
    analysis: parsed as unknown as AnalysisResult,
    rawPrompt: prompt,
    rawResponse: rawResponse
  };
}