export type StatusFinal = "APROVADO" | "ATENCAO" | "REPROVADO" | "NAO_IDENTIFICADO" | "NAO_SE_APLICA";
export type CallSource = "HUBSPOT" | "MANUAL";
export type ProcessingStatus = 'DONE' | 'SKIPPED_FOR_AUDIT' | 'NOT_CONNECTED' | 'SHORT_CALL' | 'FAILED_ANALYSIS' | 'NO_AUDIO' | 'SKIPPED_SHORT_CALL';

// --- INTERFACE PARA AS LIGAÇÕES INDIVIDUAIS (Mantida) ---
export interface SDRCall {
  id: string;
  callId: string;
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
  source: CallSource;
  processingStatus?: ProcessingStatus;
  
  resumo: string;
  alertas: string[];
  ponto_atencao: string;
  maior_dificuldade: string;
  pontos_fortes: string | string[];

  analise_escuta?: string;
  perguntas_sugeridas?: string[];
}

// --- 🚩 NOVOS TIPOS: ESTRUTURA DO COFRE DE SALDOS ---


export interface SDRRankingEntry {
  calls: number;        
  valid_calls: number;  
  sum_notes: number;    
  nota_media: number;   
}
export interface DashboardSummary {
  date: string;         // Data do resumo (AAAA-MM-DD)
  updatedAt: any;       // Timestamp da última atualização
  
  // Totais Globais
  total_calls: number;           // Volume bruto de ligações
  connected_calls: number;       // Ligações que tiveram conexão/áudio
  analyzed_calls: number;        // Ligações processadas com sucesso pela IA
  
  // Métricas de Qualidade
  sum_notes: number;             // Soma de todas as notas válidas
  valid_calls_for_media: number; // Quantidade de chamadas usadas na média (evita Rota C)
  
  // Contadores de Status
  count_aprovado: number;
  count_atencao: number;
  count_reprovado: number;

  // Ranking Mastigado (Chave é o nome do SDR)
  sdr_ranking: Record<string, SDRRankingEntry>;
}