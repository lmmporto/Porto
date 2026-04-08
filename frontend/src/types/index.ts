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
 * DONE: Processado com sucesso.
 * SKIPPED_*: Motivos pelos quais a call foi ignorada.
 * FAILED_ANALYSIS: Erro técnico no processamento.
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
 * Adicionado para resolver o erro de importação no Context.
 */
export interface CallFilters {
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  statusFinal?: StatusFinal[];
  ownerIds?: string[];
  teamIds?: string[];
  minScore?: number;
}

/**
 * Entidade principal representativa de uma ligação (SDR Call).
 */
export interface SDRCall {
  id: string;
  callId: string;
  
  // Integração HubSpot - Tipado como string (ISO) ou Date para evitar 'any'
  hubspotCallId?: string; 
  portalId?: string;
  callTimestamp: string; 
  createdAt: string; 
  updatedAt: string;
  analyzedAt: string | null;

  title: string;
  ownerId: string | null;
  ownerName: string;
  ownerUserId: string | null;
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
 * Entrada de dados para o ranking de performance por SDR.
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
  
  // Metadados de controle
  empty?: boolean;
  message?: string;
  _debug_version?: string;
}