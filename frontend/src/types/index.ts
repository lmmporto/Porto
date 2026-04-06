export type StatusFinal = "APROVADO" | "ATENCAO" | "REPROVADO" | "NAO_IDENTIFICADO" | "NAO_SE_APLICA";
export type CallSource = "HUBSPOT" | "MANUAL";

// 🚩 ATUALIZADO: Todos os status possíveis que o seu backend pode cuspir agora
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

// --- INTERFACE PARA AS LIGAÇÕES INDIVIDUAIS ---
export interface SDRCall {
  id: string;
  callId: string;
  
  // 🚩 ADICIONADO: Pra ler direto do hubspot sem choradeira do TypeScript
  hubspotCallId?: string; 
  portalId?: string;
  callTimestamp?: any;
  createdAt?: any; 
  title: string;
  ownerId: string | null;
  ownerName: string;
  ownerUserId: string | null;
  teamId: string | null;
  teamName: string;
  durationMs: number;
  recordingUrl: string | null;
  updatedAt: any;
  analyzedAt: any;
  status_final: StatusFinal;
  nota_spin: number;
  source?: CallSource; 
  processingStatus?: ProcessingStatus;
  
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string;
  pontos_fortes: string | string[];

  analise_escuta?: string;
  perguntas_sugeridas?: string[];
}

// --- NOVOS TIPOS: ESTRUTURA DO COFRE DE SALDOS ---

export interface SDRRankingEntry {
  calls: number;        
  valid_calls: number;  
  sum_notes: number;    
  nota_media: number;   
}

// 🚩 ATUALIZADO: Reflete EXATAMENTE o que o /api/stats/summary devolve hoje
export interface DashboardSummary {
  total_calls: number;
  valid_calls: number;
  sum_notes: number;
  media_geral: number;
  sdr_ranking: Record<string, SDRRankingEntry>;
  
  // Opcionais para tratamento de erro/vazio e debug
  empty?: boolean;
  message?: string;
  _debug_version?: string;
}