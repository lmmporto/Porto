export type StatusFinal = "APROVADO" | "ATENCAO" | "REPROVADO" | "NAO_IDENTIFICADO";
export type ProcessingStatus = 'DONE' | 'SKIPPED_FOR_AUDIT' | 'NOT_CONNECTED' | 'SHORT_CALL' | 'FAILED_ANALYSIS' | 'NO_AUDIO';

export interface SDRCall {
  id: string;               // ID único no Firestore (Geralmente o mesmo que o callId)
  callId: string;           // ID original do HubSpot
  title: string;
  ownerId: string | null;
  ownerName: string;
  teamName: string;
  durationMs: number;
  wasConnected: boolean;
  nota_spin: number;
  status_final: StatusFinal;
  processingStatus?: ProcessingStatus; // O campo que usamos para limpar o painel
  updatedAt: any;            // Timestamp do Firebase
  analyzedAt?: any;          // Quando a IA terminou
  
  // Campos da Análise Gemini
  resumo?: string;
  alertas?: string[];
  ponto_atencao?: string;
  maior_dificuldade?: string;
  pontos_fortes?: string | string[];
  transcript?: string;
  perguntas_sugeridas?: string[];
  analise_escuta?: string;
  rawPrompt?: string;
  rawResponse?: string;
}