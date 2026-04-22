# types.ts

## Visão geral
- Caminho original: `api-server/src/types.ts`
- Domínio: **backend**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **50**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **99**
- Imports detectados: **0**
- Exports detectados: **7**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 03-SUPPORTING. Exports detectados: CallFilters, CallSource, DashboardSummary, ProcessingStatus, SDRCall, SDRRankingEntry, StatusFinal. Temas relevantes detectados: analysis, calls, dashboard, email, hubspot, queue, ranking, sdr, summary, team.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallFilters`
- `CallSource`
- `DashboardSummary`
- `ProcessingStatus`
- `SDRCall`
- `SDRRankingEntry`
- `StatusFinal`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `calls`
- `dashboard`
- `email`
- `hubspot`
- `queue`
- `ranking`
- `sdr`
- `summary`
- `team`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
// --- ENUMS ---
export type StatusFinal = "APROVADO" | "ATENCAO" | "REPROVADO" | "NAO_IDENTIFICADO" | "NAO_SE_APLICA";
export type CallSource = "HUBSPOT" | "MANUAL" | "API4COM";

export type ProcessingStatus = 
  | 'RECEIVED' 
  | 'PENDING_AUDIO' 
  | 'QUEUED' 
  | 'PROCESSING' 
  | 'DONE' 
  | 'ERROR' 
  | 'SKIPPED' 
  | 'FAILED_NO_AUDIO'
  | 'SKIPPED_FOR_AUDIT' 
  | 'NOT_CONNECTED' 
  | 'SHORT_CALL' 
  | 'SKIPPED_SHORT_CALL'
  | 'SKIPPED_TEAM_BLOCKED'
  | 'SKIPPED_TEAM_NOT_MONITORED'
  | 'SKIPPED_NO_AUDIO'
  | 'SKIPPED_EMPTY_TRANSCRIPT'
  | 'FAILED_ANALYSIS';

// --- FILTROS ---
export interface CallFilters {
  ownerEmail?: string;
  ownerName?: string;
  startDate?: string;
  endDate?: string;
  rota?: string;      // 🏛️ Adicionado
  minScore?: number;  // 🏛️ Adicionado
  mode?: 'ranking' | 'feed';
  limit?: number;
  [key: string]: any; // Mantém a flexibilidade que você já tinha
}

// --- ENTIDADE PRINCIPAL ---
export interface SDRCall {
  id: string;
  callId: string;
  hubspotCallId?: string; 
  portalId?: string;
  title: string;
  contactName?: string; // 🏛️ Preservado (Vital para a UI)
  
  ownerId: string | null;
  ownerName: string;
  ownerEmail: string; 
  teamId?: string | null;
  teamName?: string;
  
  durationMs: number;
  recordingUrl: string | null;
  
  // 🚩 AJUSTE SÊNIOR: nota_spin deve aceitar null para não quebrar o front em chamadas novas
  nota_spin: number | null; 
  status_final: StatusFinal;
  rota?: string; // 🏛️ Adicionado para o filtro de Rota A/B/C
  
  source?: CallSource; 
  processingStatus?: ProcessingStatus;
  
  callTimestamp: any; 
  createdAt: any; 
  updatedAt: any;
  analyzedAt?: string | null;

  // Conteúdo da análise Gemini
  resumo?: string;
  alertas?: string[];
  playbook_detalhado?: string[]; // 🏛️ Adicionado para o formato "[MM:SS] | Mentor:"
  ponto_atencao?: string;
  maior_dificuldade?: string;
  pontos_fortes?: string[];
  perguntas_sugeridas?: string[];
  analise_escuta?: string;
  rawPrompt?: string;
  rawResponse?: string;
}

// --- RANKING E RESUMO ---
export interface SDRRankingEntry {
  ownerName: string;
  ownerEmail: string;
  calls: number;         
  valid_calls: number;  
  sum_notes: number;    
  nota_media: number;   
}

export interface DashboardSummary {
  total_calls: number;
  valid_calls: number;
  sum_notes: number;
  media_geral: number;
  sdr_ranking: Record<string, SDRRankingEntry>;
  version?: string;
  empty?: boolean;
}
```
