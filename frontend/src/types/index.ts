/**
 * Tipos de status final de uma análise.
 */
export type StatusFinal = 
  | "APROVADO" 
  | "ATENCAO" 
  | "REPROVADO" 
  | "NAO_IDENTIFICADO" 
  | "NAO_SE_APLICA";

export type CallSource = "HUBSPOT" | "MANUAL";

/**
 * Status de processamento no Backend.
 */
export type ProcessingStatus = 
  | 'DONE' 
  | 'PROCESSING'
  | 'SKIPPED_FOR_AUDIT' 
  | 'NOT_CONNECTED' 
  | 'SHORT_CALL' 
  | 'SKIPPED_SHORT_CALL'
  | 'SKIPPED_TEAM_BLOCKED'
  | 'SKIPPED_TEAM_NOT_MONITORED'
  | 'SKIPPED_NO_AUDIO'
  | 'SKIPPED_EMPTY_TRANSCRIPT'
  | 'FAILED_ANALYSIS';

/**
 * Filtros globais para listagem de ligações e dashboards.
 * 🚩 ALINHADO COM BACKEND (ownerName)
 */
export interface CallFilters {
  ownerName?: string;     // Identificador do SDR no Firestore
  startDate?: string;
  endDate?: string;
  minScore?: number;
  sort?: string;
  [key: string]: any;     // Flexibilidade controlada
}

/**
 * Entidade principal representativa de uma ligação.
 */
export interface SDRCall {
  id: string;
  callId: string;
  
  hubspotCallId?: string; 
  portalId?: string;
  callTimestamp: string; 
  createdAt: string; 
  updatedAt: string;
  analyzedAt: string | null;

  title: string;
  ownerId: string | null;
  ownerName: string;
  ownerEmail: string; // E-mail usado para a trava de segurança
  teamId: string | null;
  teamName: string;
  durationMs: number;
  recordingUrl: string | null;
  
  status_final: StatusFinal;
  nota_spin: number;
  source?: CallSource; 
  processingStatus?: ProcessingStatus;
  
  // Conteúdo da análise
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string;
  pontos_fortes: string | string[];

  analise_escuta?: string;
  perguntas_sugeridas?: string[];
}

/**
 * Entrada de dados para o ranking de performance.
 */
export interface SDRRankingEntry {
  calls: number;         
  valid_calls: number;  
  sum_notes: number;    
  nota_media: number;   
}

/**
 * Resumo estatístico do Dashboard.
 */
export interface DashboardSummary {
  total_calls: number;
  valid_calls: number;
  sum_notes: number;
  media_geral: number;
  sdr_ranking: Record<string, SDRRankingEntry>;
  empty?: boolean;
}