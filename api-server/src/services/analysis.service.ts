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
    
    // ⚖️ MEDIDOR DE PESO (RAIO-X)
    const fileSizeKB = (buffer.byteLength / 1024).toFixed(2);
    console.log(`⚖️ [PESO REAL] Call ${call.id}: ${fileSizeKB} KB`);

    // 🚩 TRAVA 1: PESO DO ARQUIVO (Anti-Gasto Real - 4 Megabytes)
    if (buffer.byteLength < 4000000) {
      console.log(`[SKIP] 🛑 Call ${call.id} ignorada. Muito leve (${fileSizeKB} KB). Duração física < 2 min.`);
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
    const wordCount = transcript.split(/\s+/).length;
    if (wordCount < 40) {
      console.log(`[SKIP] 🛑 Conteúdo insuficiente na Call ${call.id}. Palavras: ${wordCount}`);
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

  // Contagem de palavras para a IA ter noção do tamanho da ligação
  const wordCount = (call.transcript || '').split(/\s+/).length;

  const prompt = `
Você é um Coach de Vendas focado em desenvolvimento contínuo. Sua abordagem é ADITIVA: você recompensa o SDR pelo que ele fez de bom, em vez de apenas punir o que faltou. Você entende o contexto de vendas B2B (Radar Ica / Nibo).

--- PASSO 1: CLASSIFICAÇÃO DO CONTEXTO ---
Antes de avaliar, identifique o tipo da ligação lendo o início da transcrição:
- ROTA A (Reagendamento/Follow-up): O lead furou antes ou o SDR está apenas cobrando/remarcando uma agenda. A porta já está "semi-aberta".
- ROTA B (Prospecção/Novo Agendamento): Primeira conexão ou qualificação buscando um novo compromisso. A porta está "fechada".

--- PASSO 2: SISTEMA DE PONTUAÇÃO ADITIVO (Nota de 0 a 10) ---

SE ROTA A (Reagendamento):
Como a porta já estava semi-aberta, o agendamento é obrigação operacional. Não exija SPIN profundo. Use a seguinte matemática exata:
- Conseguiu o novo horário/agendamento? NOTA BASE = 4.0 (Se não agendou, nota entre 0 e 3 dependendo do esforço).
- SOMA +2.0: Controlou a agenda (ofereceu opções fechadas de horários como "15h ou 16h" em vez de deixar solto).
- SOMA +2.0: Demonstrou empatia com o imprevisto do cliente E gerou micro-compromisso firme (ex: combinou envio do convite).
- SOMA +2.0: Reancorou o valor/dor (lembrou rapidamente o cliente do motivo ou problema que iriam discutir).

SE ROTA B (Prospecção/Novo Agendamento):
O esforço de abrir a porta é maior.
- Se conseguiu agendar (procure gatilhos de confirmação de data/hora), GARANTE NOTA BASE = 5.0. Se não agendou, nota de 0 a 4 pelo esforço.
- O resto da nota depende do tempo de ligação (Tamanho atual: ${wordCount} palavras):
  * CALL CURTA (< 400 palavras): Foco em conversão rápida. Dê pontos extras se explicou o produto de forma clara (Pitch), não travou em objeções iniciais e cravou a agenda. Não puna por falta de SPIN longo.
  * CALL LONGA (> 400 palavras): Foco em consultoria. Dê pontos extras se fez perguntas de Situação, entendeu o cenário, contornou objeções reais. Bônus para nota máxima (9-10) apenas se explorou Problema/Implicação.

--- REGRAS DE STATUS FINAL (Obrigatório) ---
- nota_spin 0 a 4: REPROVADO (Não cumpriu o objetivo ou fez apenas o operacional sem técnica).
- nota_spin 5 a 7: ATENCAO (Conseguiu o agendamento de forma básica ou aplicou boas técnicas sem converter).
- nota_spin 8 a 10: APROVADO (Agendou com domínio da técnica, controle da ligação e boa postura).

--- DIRETRIZES PARA O JSON ---
- "resumo": Explique brevemente se foi ROTA A ou ROTA B e o desfecho da call.
- "pontos_fortes": Destaque o que o SDR fez bem (ex: "Ofereceu opções fechadas de horário", "Pitch claro").
- "ponto_atencao": Onde ele pode melhorar, com tom construtivo (não dê broncas).
- "perguntas_sugeridas": Sugira 1 ou 2 perguntas. Se Rota A, sugira como ele poderia ter reancorado o valor da reunião. Se Rota B, sugira perguntas de Problema/Implicação.
- "analise_escuta": Avalie a fluidez. O SDR soube ouvir? Interrompeu? (Desculpas por delay são ponto positivo).
- "alertas": Liste comportamentos que merecem atenção urgente (se houver), ou retorne array vazio se a call foi boa.
- "maior_dificuldade": Aponte a maior resistência do lead ou a maior dificuldade do SDR na ligação.

Metadados:
- SDR/Owner: ${ownerDetails.ownerName}
- Equipe: ${ownerDetails.teamName}
- Duração: ${call.durationMs}ms
- Palavras: ${wordCount}

Transcrição:
${call.transcript || '[SEM TRANSCRIÇÃO]'}
  `.trim();

  const response = await gemini.models.generateContent({
    model: CONFIG.GEMINI_ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
      temperature: 0.3, 
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