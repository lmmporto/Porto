import axios from 'axios';
import { writeFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPartFromUri, createUserContent } from '@google/genai';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import { gemini } from '../clients.js';
import { CONFIG } from '../config.js';
import { db } from '../firebase.js';
import {
  detectAudioExtension,
  safeJsonParse,
  sanitizeText,
} from '../utils.js';

import type { CallData, OwnerDetails } from './hubspot.js';

// 🏛️ Versão atual do motor de análise.
const CURRENT_ANALYSIS_VERSION = 'V10_MESTRE_MENTOR';

// Ajuste conforme a operação.
// Fortaleza e São Paulo hoje têm o mesmo offset, mas manter explícito ajuda.
const BUSINESS_TIMEZONE = 'America/Fortaleza';

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

const ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status_final',
    'nota_spin',
    'rota',
    'produto_principal',
    'objecoes',
    'insights_estrategicos',
    'resumo',
    'alertas',
    'playbook_detalhado',
    'ponto_atencao',
    'maior_dificuldade',
    'pontos_fortes',
    'perguntas_sugeridas',
    'analise_escuta',
    'score_dominio',
    'score_dor',
  ],
  properties: {
    status_final: {
      type: 'string',
      enum: ['APROVADO', 'REPROVADO', 'ATENCAO', 'NAO_SE_APLICA'],
    },
    rota: {
      type: 'string',
      enum: ['ROTA_A', 'ROTA_B', 'ROTA_C', 'ROTA_D'],
    },
    produto_principal: {
      type: 'string',
      enum: [
        'Nibo Obrigações Plus',
        'Nibo WhatsApp',
        'Nibo Conciliador',
        'Nibo Emissor',
        'Ferramenta do Radar e CAC',
        'NAO_IDENTIFICADO',
      ],
    },
    objecoes: {
      type: 'array',
      items: { type: 'string' },
    },
    insights_estrategicos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'value', 'type'],
        properties: {
          label: {
            type: 'string',
            description: 'Nome dinâmico do insight',
          },
          value: {
            type: 'string',
            description: 'Valor percentual ou qualitativo',
          },
          type: {
            type: 'string',
            enum: ['positive', 'negative', 'neutral'],
          },
        },
      },
    },
    nota_spin: { type: ['number', 'null'] },
    score_dominio: {
      type: 'number',
      description:
        'Nota de 0 a 10 para o domínio da condução da chamada pelo SDR.',
    },
    score_dor: {
      type: 'number',
      description:
        'Nota de 0 a 10 para a profundidade na exploração da dor do cliente.',
    },
    resumo: { type: 'string' },
    playbook_detalhado: {
      type: 'array',
      description:
        'Lista estruturada de momentos críticos da call com diagnóstico e recomendação.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['timestamp', 'fala_lead', 'diagnostico', 'recomendacao'],
        properties: {
          timestamp: { type: 'string' },
          fala_lead: { type: 'string' },
          diagnostico: { type: 'string' },
          recomendacao: { type: 'string' },
        },
      },
    },
    alertas: {
      type: 'array',
      items: { type: 'string' },
    },
    ponto_atencao: { type: 'string' },
    maior_dificuldade: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de até 3 pontos específicos de dificuldade do SDR.',
    },
    pontos_fortes: {
      type: 'array',
      items: { type: 'string' },
    },
    perguntas_sugeridas: {
      type: 'array',
      items: { type: 'string' },
    },
    analise_escuta: { type: 'string' },
    nome_do_lead: { type: 'string' },
  },
} as const;

const TRANSCRIPTION_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['transcript'],
  properties: {
    transcript: { type: 'string' },
  },
} as const;

const TEAM_STRATEGY_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['texto_analise', 'principal_risco', 'maior_forca'],
  properties: {
    texto_analise: { type: 'string' },
    principal_risco: { type: 'string' },
    maior_forca: { type: 'string' },
  },
} as const;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type AnalysisStatus =
  | 'APROVADO'
  | 'REPROVADO'
  | 'ATENCAO'
  | 'NAO_SE_APLICA';

type AnalysisRoute = 'ROTA_A' | 'ROTA_B' | 'ROTA_C' | 'ROTA_D';

type MainProduct =
  | 'Nibo Obrigações Plus'
  | 'Nibo WhatsApp'
  | 'Nibo Conciliador'
  | 'Nibo Emissor'
  | 'Ferramenta do Radar e CAC'
  | 'NAO_IDENTIFICADO';

type InsightType = 'positive' | 'negative' | 'neutral';

export interface StrategicInsight {
  label: string;
  value: string;
  type: InsightType;
}

export interface PlaybookEntry {
  timestamp: string;
  fala_lead: string;
  diagnostico: string;
  recomendacao: string;
}

export interface AnalysisResult {
  status_final: AnalysisStatus;
  rota: AnalysisRoute;
  produto_principal: MainProduct;
  objecoes: string[];
  insights_estrategicos: StrategicInsight[];
  nota_spin: number | null;
  score_dominio: number;
  score_dor: number;
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string[];
  pontos_fortes: string[];
  perguntas_sugeridas: string[];
  analise_escuta: string;
  playbook_detalhado: PlaybookEntry[];
  nome_do_lead?: string;
}

export interface AnalysisWithDebug {
  analysis: AnalysisResult;
  rawPrompt: string;
  rawResponse: string;
}

interface TranscriptionResult {
  transcript: string;
}

interface TeamStrategyResult {
  texto_analise: string;
  principal_risco: string;
  maior_forca: string;
}

interface DashboardStatsSummary {
  recurrent_gaps?: unknown;
  top_strengths?: unknown;
  total_calls?: number;
}

interface SdrDoc {
  name?: string;
  email?: string;
  callCount?: number;
  totalScore?: number;
  real_average?: number;
  ranking_score?: number;
}

interface AggregatedStatsDoc {
  total_calls?: number;
  sum_notes?: number;
  approved_count?: number;
  media_geral?: number;
  taxa_aprovacao?: number;
}

interface DailyStatsCallData {
  ownerEmail?: string | null;
  ownerName?: string | null;
}

interface UpdateDailyStatsOptions {
  isUpdate?: boolean;
  previousNota?: number | null;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getGeminiModel = () => {
  if (!gemini) {
    throw new Error('GEMINI_API_KEY não configurada.');
  }

  return gemini;
};

function cleanGeminiResponse(text: string): string {
  if (!text) {
    return '';
  }

  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

function getBusinessDayId(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isStrategicInsight(value: unknown): value is StrategicInsight {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.label === 'string' &&
    typeof value.value === 'string' &&
    (value.type === 'positive' ||
      value.type === 'negative' ||
      value.type === 'neutral')
  );
}

function isPlaybookEntry(value: unknown): value is PlaybookEntry {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.timestamp === 'string' &&
    typeof value.fala_lead === 'string' &&
    typeof value.diagnostico === 'string' &&
    typeof value.recomendacao === 'string'
  );
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isPlainObject(value)) {
    return false;
  }

  const validStatus: AnalysisStatus[] = [
    'APROVADO',
    'REPROVADO',
    'ATENCAO',
    'NAO_SE_APLICA',
  ];

  const validRoutes: AnalysisRoute[] = [
    'ROTA_A',
    'ROTA_B',
    'ROTA_C',
    'ROTA_D',
  ];

  const validProducts: MainProduct[] = [
    'Nibo Obrigações Plus',
    'Nibo WhatsApp',
    'Nibo Conciliador',
    'Nibo Emissor',
    'Ferramenta do Radar e CAC',
    'NAO_IDENTIFICADO',
  ];

  return (
    validStatus.includes(value.status_final as AnalysisStatus) &&
    validRoutes.includes(value.rota as AnalysisRoute) &&
    validProducts.includes(value.produto_principal as MainProduct) &&
    isStringArray(value.objecoes) &&
    Array.isArray(value.insights_estrategicos) &&
    value.insights_estrategicos.every(isStrategicInsight) &&
    (typeof value.nota_spin === 'number' || value.nota_spin === null) &&
    typeof value.score_dominio === 'number' &&
    typeof value.score_dor === 'number' &&
    typeof value.resumo === 'string' &&
    isStringArray(value.alertas) &&
    typeof value.ponto_atencao === 'string' &&
    isStringArray(value.maior_dificuldade) &&
    isStringArray(value.pontos_fortes) &&
    isStringArray(value.perguntas_sugeridas) &&
    typeof value.analise_escuta === 'string' &&
    Array.isArray(value.playbook_detalhado) &&
    value.playbook_detalhado.every(isPlaybookEntry) &&
    (value.nome_do_lead === undefined || typeof value.nome_do_lead === 'string')
  );
}

function isTranscriptionResult(value: unknown): value is TranscriptionResult {
  return isPlainObject(value) && typeof value.transcript === 'string';
}

function isTeamStrategyResult(value: unknown): value is TeamStrategyResult {
  return (
    isPlainObject(value) &&
    typeof value.texto_analise === 'string' &&
    typeof value.principal_risco === 'string' &&
    typeof value.maior_forca === 'string'
  );
}

function normalizeAnalysisResult(value: AnalysisResult): AnalysisResult {
  return {
    ...value,
    resumo: sanitizeText(value.resumo),
    ponto_atencao: sanitizeText(value.ponto_atencao),
    analise_escuta: sanitizeText(value.analise_escuta),
    objecoes: value.objecoes.map((item) => sanitizeText(item)),
    alertas: value.alertas.map((item) => sanitizeText(item)),
    maior_dificuldade: value.maior_dificuldade.map((item) => sanitizeText(item)),
    pontos_fortes: value.pontos_fortes.map((item) => sanitizeText(item)),
    perguntas_sugeridas: value.perguntas_sugeridas.map((item) => sanitizeText(item)),
    insights_estrategicos: value.insights_estrategicos.map((insight) => ({
      ...insight,
      label: sanitizeText(insight.label),
      value: sanitizeText(insight.value),
    })),
    playbook_detalhado: value.playbook_detalhado.map((entry) => ({
      ...entry,
      timestamp: sanitizeText(entry.timestamp),
      fala_lead: sanitizeText(entry.fala_lead),
      diagnostico: sanitizeText(entry.diagnostico),
      recomendacao: sanitizeText(entry.recomendacao),
    })),
    nome_do_lead: value.nome_do_lead
      ? sanitizeText(value.nome_do_lead)
      : undefined,
  };
}

function getValidNote(analysis: Pick<AnalysisResult, 'status_final' | 'nota_spin'>): number {
  const isValid =
    analysis.status_final !== 'NAO_SE_APLICA' &&
    analysis.nota_spin !== null &&
    Number.isFinite(analysis.nota_spin);

  return isValid ? Number(analysis.nota_spin) : 0;
}

function getNoteDelta(
  currentNote: number,
  options?: UpdateDailyStatsOptions,
): number {
  if (!options?.isUpdate) {
    return currentNote;
  }

  const previousNote =
    typeof options.previousNota === 'number' && Number.isFinite(options.previousNota)
      ? options.previousNota
      : 0;

  return currentNote - previousNote;
}

// -----------------------------------------------------------------------------
// Main functions
// -----------------------------------------------------------------------------

export async function transcribeRecordingFromHubSpot(
  call: CallData,
): Promise<string> {
  if (call.hasTranscript && call.transcript && call.transcript.length >= 100) {
    return call.transcript;
  }

  if (!call.recordingUrl) {
    throw new Error(`Nenhum áudio disponível para: ${call.callId || call.id}`);
  }

  let localFilePath = '';
  let uploadedFile: { name?: string; uri?: string; mimeType?: string } | null = null;

  try {
    const audioResponse = await axios.get(call.recordingUrl, {
      responseType: 'arraybuffer',
      timeout: 120_000,
      headers: {
        Authorization: `Bearer ${CONFIG.HUBSPOT_TOKEN}`,
      },
    });

    const buffer = Buffer.from(audioResponse.data as ArrayBuffer);
    const contentType = String(audioResponse.headers['content-type'] || 'audio/mpeg');
    localFilePath = path.join(os.tmpdir(), `call-${randomUUID()}.${detectAudioExtension(contentType)}`);

    await writeFile(localFilePath, buffer);

    // 2. Upload para o Google
    console.log(`📤 [IA] Uploading file to Gemini: ${call.id} (${buffer.byteLength} bytes)`);
    uploadedFile = await getGeminiModel().files.upload({
      file: localFilePath,
      config: {
        mimeType: contentType,
      },
    });

    if (!uploadedFile?.uri || !uploadedFile?.mimeType) {
      throw new Error('Falha no upload do arquivo para o Gemini.');
    }

    // 🚩 3. ESPERA ATIVA (POLLING): O Segredo da Estabilidade
    // Vamos verificar o status do arquivo até que ele esteja 'ACTIVE'
    let fileStatus = await getGeminiModel().files.get({ name: uploadedFile.name });
    let attempts = 0;

    while (fileStatus.state === 'PROCESSING' && attempts < 15) {
      console.log(`⏳ [IA] Arquivo em processamento... aguardando 2s (Tentativa ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos
      fileStatus = await getGeminiModel().files.get({ name: uploadedFile.name });
      attempts++;
    }

    if (fileStatus.state !== 'ACTIVE') {
      throw new Error(`O arquivo não ficou pronto a tempo. Estado atual: ${fileStatus.state}`);
    }

    console.log(`✅ [IA] Arquivo pronto! Iniciando transcrição...`);

    // 4. Transcrição Real
    const response = await getGeminiModel().models.generateContent({
      model: CONFIG.GEMINI_TRANSCRIPTION_MODEL,
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
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
    throw new Error('Transcrição insuficiente ou ausente para análise.');
  }

  console.log(
    `🧠 [IA] Processando análise rigorosa (Mestre Mentor) para: ${call.id}`,
  );

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
1. PLAYBOOK ESTRUTURADO: No campo 'playbook_detalhado', cada entrada DEVE ser um objeto JSON com os campos: timestamp (MM:SS), fala_lead (o que o lead disse), diagnostico (resumo do erro em até 5 palavras) e recomendacao (orientação detalhada com frase sugerida).
2. LINGUAGEM HUMANA: Use "Nesta abordagem" ou "Nesta interação" nos campos de texto. Proibido escrever "Rota A/B/C" para o usuário.
3. PADRÃO DE FEEDBACK:
   - Identifique o erro -> Explique o impacto negativo -> Dê a frase EXATA que deveria ter sido dita.
4. CLASSIFICAÇÃO TÉCNICA: No campo JSON 'rota', você DEVE classificar obrigatoriamente como 'ROTA_A', 'ROTA_B', 'ROTA_C' ou 'ROTA_D' para fins de banco de dados.
5. INSIGHTS ESTRATÉGICOS: No campo 'insights_estrategicos', gere labels dinâmicos baseados no que for mais relevante na call (ex: 'Exploração de Dor', 'Aderência ao Nibo Plus').
6. METADADOS GESTÃO: Rota, produto_principal e objecoes são campos técnicos para o gestor e NÃO devem aparecer no feedback textual do SDR.
7. MAIOR DIFICULDADE: No campo 'maior_dificuldade', forneça uma lista de até 3 pontos específicos onde o SDR teve mais dificuldade na call.
8. NOME DO LEAD: No campo 'nome_do_lead', extraia o nome completo do cliente/lead da conversa.

--- CRITÉRIOS DE PONTUAÇÃO (MERITOCRACIA CONSTRUTIVA) ---
A nota é de 0 a 10, baseada em:
- Domínio e Direcionamento (Até 4.0 pts): O SDR liderou a conversa ou foi levado pelo lead?
- Exploração de Dor/Desafio (Até 4.0 pts): O SDR aprofundou no problema ou aceitou respostas superficiais?
- Firmeza no Próximo Passo (Até 2.0 pts): O agendamento foi cravado com dia e hora?

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

    if (!isAnalysisResult(parsed)) {
      throw new Error('Falha na validação da estrutura de resposta da IA.');
    }

    return {
      analysis: normalizeAnalysisResult(parsed),
      rawPrompt: prompt,
      rawResponse,
    };
  } catch (error) {
    console.error('Erro na análise Gemini:', error);
    throw error;
  }
}

export async function updateDailyStats(
  callData: DailyStatsCallData,
  analysis: Pick<AnalysisResult, 'status_final' | 'nota_spin'>,
  options: UpdateDailyStatsOptions = {},
): Promise<void> {
  try {
    const dayId = getBusinessDayId();
    const statsRef = db.collection('dashboard_stats').doc(dayId);
    const sdrKey = callData.ownerEmail || 'Desconhecido';

    const currentNote = getValidNote(analysis);
    const noteDelta = getNoteDelta(currentNote, options);

    await statsRef.set(
      {
        [`sdr_ranking.${sdrKey}.total`]: FieldValue.increment(
          options.isUpdate ? 0 : 1,
        ),
        [`sdr_ranking.${sdrKey}.sum_notes`]: FieldValue.increment(noteDelta),
        [`sdr_ranking.${sdrKey}.ownerName`]: callData.ownerName || 'SDR',
        [`sdr_ranking.${sdrKey}.ownerEmail`]: sdrKey,
      },
      { merge: true },
    );
  } catch (error) {
    console.error('❌ [STATS ERROR]:', error);
  }
}

export async function updateSdrGlobalStats(
  email: string,
  name: string,
  nota: number,
  transaction?: admin.firestore.Transaction,
): Promise<void> {
  const sdrId = email.replace(/[.$#[\]/]/g, '_');
  const dayId = getBusinessDayId();

  const sdrRef = db.collection('sdrs').doc(sdrId);
  const dailyRef = db.collection('dashboard_stats').doc(dayId);
  const globalRef = db.collection('dashboard_stats').doc('global_summary');

  const logic = async (t: admin.firestore.Transaction) => {
    const [sdrDoc, dailyDoc, globalDoc] = await Promise.all([
      t.get(sdrRef),
      t.get(dailyRef),
      t.get(globalRef),
    ]);

    const sdrData = (sdrDoc.exists ? sdrDoc.data() : {}) as SdrDoc;

    const newSdrCount = (sdrData.callCount || 0) + 1;
    const newSdrTotal = (sdrData.totalScore || 0) + nota;

    const updateStats = (
      docSnap: admin.firestore.DocumentSnapshot,
    ): AggregatedStatsDoc & {
      last_update: admin.firestore.FieldValue;
    } => {
      const data = (docSnap.exists ? docSnap.data() : {}) as AggregatedStatsDoc;

      const totalCalls = (data.total_calls || 0) + 1;
      const sumNotes = (data.sum_notes || 0) + nota;
      const approvedCount = (data.approved_count || 0) + (nota >= 7 ? 1 : 0);

      return {
        total_calls: totalCalls,
        sum_notes: sumNotes,
        media_geral: Number((sumNotes / totalCalls).toFixed(2)),
        taxa_aprovacao: Math.round((approvedCount / totalCalls) * 100),
        approved_count: approvedCount,
        last_update: admin.firestore.FieldValue.serverTimestamp(),
      };
    };

    t.set(
      sdrRef,
      {
        ...sdrData,
        name,
        email,
        callCount: newSdrCount,
        totalScore: newSdrTotal,
        real_average: Number((newSdrTotal / newSdrCount).toFixed(2)),
        ranking_score: Number(
          ((newSdrTotal + 5 * 7.0) / (newSdrCount + 5)).toFixed(2),
        ),
      },
      { merge: true },
    );

    t.set(dailyRef, updateStats(dailyDoc), { merge: true });
    t.set(globalRef, updateStats(globalDoc), { merge: true });
  };

  if (transaction) {
    await logic(transaction);
    return;
  }

  await db.runTransaction(logic);
}

export async function listAnalyses(
  filters: { ownerEmail?: string },
  limitCount = 10,
): Promise<{
  calls: Array<Record<string, unknown>>;
  lastVisible?: string;
}> {
  let query: FirebaseFirestore.Query = db
    .collection('calls_analysis')
    .orderBy('callTimestamp', 'desc');

  if (filters.ownerEmail) {
    query = query.where('ownerEmail', '==', filters.ownerEmail);
  }

  const snapshot = await query.limit(limitCount).get();

  return {
    calls: snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
    lastVisible: snapshot.docs.at(-1)?.id,
  };
}

export async function updateTeamStrategy(): Promise<void> {
  const summaryRef = db.collection('dashboard_stats').doc('global_summary');

  try {
    console.log('[STRATEGY] Iniciando geração de leitura consolidada...');

    const summaryDoc = await summaryRef.get();

    if (!summaryDoc.exists) {
      console.log('[STRATEGY] Documento de resumo não encontrado. Abortando.');
      return;
    }

    const data = summaryDoc.data() as DashboardStatsSummary | undefined;

    const recurrentGaps = data?.recurrent_gaps;
    const topStrengths = data?.top_strengths;
    const totalCalls = data?.total_calls ?? 0;

    if (!recurrentGaps || !topStrengths || totalCalls < 5) {
      console.log('[STRATEGY] Dados insuficientes para análise. Abortando.');
      return;
    }

    const prompt = `
Você é um analista de operações de vendas sênior. Com base nos dados agregados de uma equipe de SDRs, gere uma análise estratégica.

Dados de Gaps (erros mais comuns): ${JSON.stringify(recurrentGaps)}
Dados de Strengths (acertos mais comuns): ${JSON.stringify(topStrengths)}

Sua resposta DEVE ser um único e válido objeto JSON, com a seguinte estrutura:
{
  "texto_analise": "Uma análise concisa em 2 ou 3 parágrafos sobre o estado atual da operação, conectando os gaps e os pontos fortes.",
  "principal_risco": "Uma frase curta identificando o maior risco ou ponto de melhoria.",
  "maior_forca": "Uma frase curta identificando a maior força ou ponto positivo da equipe."
}
    `.trim();

    const response = await getGeminiModel().models.generateContent({
      model: CONFIG.GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: TEAM_STRATEGY_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });

    const rawResponse = cleanGeminiResponse(response?.text || '');
    const parsed = safeJsonParse(rawResponse);

    if (!isTeamStrategyResult(parsed)) {
      throw new Error('Resposta da IA inválida ou incompleta.');
    }

    await summaryRef.update({
      leitura_consolidada: {
        ...parsed,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      },
    });

    console.log('[STRATEGY] Leitura consolidada atualizada com sucesso.');
  } catch (error) {
    console.error('[STRATEGY] Erro ao gerar leitura consolidada:', error);

    await summaryRef.update({
      'leitura_consolidada.status': 'failed',
      'leitura_consolidada.updatedAt': new Date().toISOString(),
    });
  }
}