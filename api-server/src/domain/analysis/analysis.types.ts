// src/domain/analysis/analysis.types.ts

/**
 * Abstração de transação de banco de dados.
 * Alias que isola o domínio e a fachada de serviço da dependência direta do Firebase SDK.
 * A camada de infraestrutura faz o cast para o tipo concreto do Firestore internamente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbTransaction = any;

/**
 * 🏛️ Versão atual do motor de análise.
 */
export const CURRENT_ANALYSIS_VERSION = 'V10_MESTRE_MENTOR';

/**
 * Ajuste conforme a operação.
 * Fortaleza e São Paulo hoje têm o mesmo offset, mas manter explícito ajuda.
 */
export const BUSINESS_TIMEZONE = 'America/Fortaleza';

export type AnalysisStatus =
  | 'APROVADO'
  | 'REPROVADO'
  | 'ATENCAO'
  | 'NAO_SE_APLICA';

export type AnalysisRoute = 'ROTA_A' | 'ROTA_B' | 'ROTA_C' | 'ROTA_D';

export type MainProduct =
  | 'Nibo Obrigações Plus'
  | 'Nibo WhatsApp'
  | 'Nibo Conciliador'
  | 'Nibo Emissor'
  | 'Ferramenta do Radar e CAC'
  | 'NAO_IDENTIFICADO';

export type InsightType = 'positive' | 'negative' | 'neutral';

export interface StrategicInsight {
  label: string;
  value: string;
  type: InsightType;
}

export interface PlaybookEntry {
  timestamp: string;
  fala_lead: string;
  resposta_sdr: string;
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

export interface TranscriptionResult {
  transcript: string;
}

export interface TeamStrategyResult {
  texto_analise: string;
  principal_risco: string;
  maior_forca: string;
}

export interface DailyStatsCallData {
  ownerEmail?: string | null;
  ownerName?: string | null;
}

export interface UpdateDailyStatsOptions {
  isUpdate?: boolean;
  previousNota?: number | null;
}

export interface OwnerDetails {
  ownerId: string | null;
  ownerName: string;
  ownerEmail: string | null;
  teamId: string | null;
  teamName: string;
  userId: string | null;
}

export interface DashboardStatsSummary {
  recurrent_gaps?: unknown;
  top_strengths?: unknown;
  total_calls?: number;
}

/**
 * Representação do documento de estatísticas de um SDR individual no Firestore.
 */
export interface SdrDoc {
  name?: string;
  email?: string;
  callCount?: number;
  totalScore?: number;
  real_average?: number;
  ranking_score?: number;
}

/**
 * Representação de estatísticas agregadas (diário ou global) no Firestore.
 */
export interface AggregatedStatsDoc {
  total_calls?: number;
  sum_notes?: number;
  approved_count?: number;
  media_geral?: number;
  taxa_aprovacao?: number;
}

// -----------------------------------------------------------------------------
// 🏛️ Máquina de Estados — Processamento de Chamadas
// Fonte da verdade para todos os status, motivos de skip e falha.
// -----------------------------------------------------------------------------

export enum CallStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  PENDING_AUDIO = 'PENDING_AUDIO',
  RETRY_ANALYSIS = 'RETRY_ANALYSIS',
  DONE = 'DONE',
  FAILED = 'FAILED',
  FAILED_NO_AUDIO = 'FAILED_NO_AUDIO',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR',
}

export enum SkipReason {
  TEAM_BLOCKED = 'TEAM_BLOCKED',
  TEAM_NOT_MONITORED = 'TEAM_NOT_MONITORED',
  CALL_TOO_SHORT = 'CALL_TOO_SHORT',
  UNAUTHORIZED_TEAM_OR_OWNER = 'UNAUTHORIZED_TEAM_OR_OWNER',
  SDR_INACTIVE_OR_UNREGISTERED = 'SDR_INACTIVE_OR_UNREGISTERED',
}

export enum FailureReason {
  TRANSCRIPT_EMPTY = 'TRANSCRIPT_EMPTY',
  TRANSCRIPT_TOO_SHORT = 'TRANSCRIPT_TOO_SHORT',
  PROCESSING_EXCEPTION = 'PROCESSING_EXCEPTION',
  NO_AUDIO_AFTER_RETRIES = 'NO_AUDIO_AFTER_RETRIES',
}
