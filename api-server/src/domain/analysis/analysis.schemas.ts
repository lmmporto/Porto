import { z } from 'zod';
import {
  type AnalysisResult,
  type TranscriptionResult,
  type TeamStrategyResult,
  type UpdateDailyStatsOptions,
  GapCategory,
} from './analysis.types.js';
import { sanitizeText } from '../../utils.js';

export const StrategicInsightSchema = z.object({
  label: z.string(),
  value: z.string(),
  type: z.enum(['positive', 'negative', 'neutral']),
});

export const PlaybookEntrySchema = z.object({
  timestamp: z.string(),
  fala_lead: z.string(),
  resposta_sdr: z.string(),
  classificacao_sdr: z.string(),
  estado_antes: z.string(),
  estado_depois: z.string(),
  evolucao: z.enum(['avanço', 'regressão', 'estagnação']),
  diagnostico_curto: z.string(),
  diagnostico_expandido: z.string(),
  recomendacao: z.string(),
});

export const ANALYSIS_RESPONSE_SCHEMA = z.object({
  status_final: z.enum(['EXCELENTE', 'BOM', 'ATENCAO', 'CRITICO']).nullable().optional().default(null),
  rota: z.enum(['ROTA_A', 'ROTA_B', 'ROTA_C', 'ROTA_D']).nullable().optional().default(null),
  produto_principal: z.enum([
    'Nibo Obrigações Plus',
    'Nibo WhatsApp',
    'Nibo Conciliador',
    'Nibo Emissor',
    'Ferramenta do Radar e CAC',
    'NAO_IDENTIFICADO',
  ]).nullable().optional().default(null),
  objecoes: z.array(z.string()).optional().default([]),
  insights_estrategicos: z.array(StrategicInsightSchema).optional().default([]),
  nota_spin: z.number().nullable().optional().default(null),
  score_dominio: z.number().min(0).max(4).optional().default(0),
  score_dor: z.number().min(0).max(4).optional().default(0),
  resumo: z.string().optional().default(''),
  playbook_detalhado: z.array(PlaybookEntrySchema).optional().default([]),
  alertas: z.array(z.string()).optional().default([]),
  ponto_atencao: z.string().optional().default(''),
  maior_dificuldade: z.array(
    z.enum([
      'EXPLORACAO_DOR',
      'CONTROLE_CONVERSA',
      'PROXIMO_PASSO',
      'RAPPORT',
      'OBJECOES',
      'QUALIFICACAO',
      'FIT_PRODUTO',
    ])
  ).optional().default([]),
  pontos_fortes: z.array(z.string()).optional().default([]),
  perguntas_sugeridas: z.array(z.string()).optional().default([]),
  analise_escuta: z.string().optional().default(''),
  nome_do_lead: z.string().optional().default(''),
  
  // --- novos campos ---
  score_proximo_passo: z.number().min(0).max(2).optional(),
  mensagem_final_sdr: z.string().optional().default(''),
});

export const ANALYSIS_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    status_final: { type: 'string', enum: ['EXCELENTE', 'BOM', 'ATENCAO', 'CRITICO'] },
    rota: { type: 'string', enum: ['ROTA_A', 'ROTA_B', 'ROTA_C', 'ROTA_D'] },
    produto_principal: { type: 'string', enum: [
      'Nibo Obrigações Plus',
      'Nibo WhatsApp',
      'Nibo Conciliador',
      'Nibo Emissor',
      'Ferramenta do Radar e CAC',
      'NAO_IDENTIFICADO',
    ]},
    objecoes: { type: 'array', items: { type: 'string' } },
    insights_estrategicos: { 
      type: 'array', 
      items: { 
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
          type: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
        },
        required: ['label', 'value', 'type']
      } 
    },
    nota_spin: { type: 'number' },
    score_dominio: { type: 'number' },
    score_dor: { type: 'number' },
    score_proximo_passo: { type: 'number' },
    resumo: { type: 'string' },
    playbook_detalhado: { 
      type: 'array', 
      items: { 
        type: 'object',
        properties: {
          timestamp: { type: 'string' },
          fala_lead: { type: 'string' },
          resposta_sdr: { type: 'string' },
          classificacao_sdr: { type: 'string' },
          estado_antes: { type: 'string' },
          estado_depois: { type: 'string' },
          evolucao: { type: 'string', enum: ['avanço', 'regressão', 'estagnação'] },
          diagnostico_curto: { type: 'string' },
          diagnostico_expandido: { type: 'string' },
          recomendacao: { type: 'string' }
        }
      } 
    },
    alertas: { type: 'array', items: { type: 'string' } },
    ponto_atencao: { type: 'string' },
    maior_dificuldade: { 
      type: 'array', 
      items: { 
        type: 'string', 
        enum: ['EXPLORACAO_DOR', 'CONTROLE_CONVERSA', 'PROXIMO_PASSO', 'RAPPORT', 'OBJECOES', 'QUALIFICACAO', 'FIT_PRODUTO'] 
      } 
    },
    pontos_fortes: { type: 'array', items: { type: 'string' } },
    perguntas_sugeridas: { type: 'array', items: { type: 'string' } },
    analise_escuta: { type: 'string' },
    nome_do_lead: { type: 'string' },
    mensagem_final_sdr: { type: 'string' }
  }
};

export const TRANSCRIPTION_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['transcript'],
  properties: {
    transcript: { type: 'string' },
  },
} as const;

export const TEAM_STRATEGY_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['texto_analise', 'principal_risco', 'maior_forca'],
  properties: {
    texto_analise: { type: 'string' },
    principal_risco: { type: 'string' },
    maior_forca: { type: 'string' },
  },
} as const;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStrategicInsight(data: unknown): data is StrategicInsight {
  return StrategicInsightSchema.safeParse(data).success;
}

export function isAnalysisResult(data: unknown): data is AnalysisResult {
  const result = ANALYSIS_RESPONSE_SCHEMA.safeParse(data);

  if (!result.success) {
    console.warn('[isAnalysisResult] Falha na validação:', result.error.flatten());
    return false;
  }

  return true;
}

export function isTranscriptionResult(value: unknown): value is TranscriptionResult {
  return isPlainObject(value) && typeof value.transcript === 'string';
}

export function isTeamStrategyResult(value: unknown): value is TeamStrategyResult {
  return (
    isPlainObject(value) &&
    typeof value.texto_analise === 'string' &&
    typeof value.principal_risco === 'string' &&
    typeof value.maior_forca === 'string'
  );
}

export function normalizeAnalysisResult(value: AnalysisResult): AnalysisResult {
  // Passa pelo Zod parse de forma síncrona para aplicar os defaults (.default([]))
  // que resolvem o problema de `undefined.map`
  const normalized = ANALYSIS_RESPONSE_SCHEMA.parse(value);

  return {
    ...normalized,
    resumo: normalized.resumo ? sanitizeText(normalized.resumo) : '',
    ponto_atencao: normalized.ponto_atencao ? sanitizeText(normalized.ponto_atencao) : '',
    analise_escuta: normalized.analise_escuta ? sanitizeText(normalized.analise_escuta) : '',
    objecoes: (normalized.objecoes || []).map((item) => sanitizeText(item)),
    alertas: (normalized.alertas || []).map((item) => sanitizeText(item)),
    maior_dificuldade: (normalized.maior_dificuldade || []).map((item) => sanitizeText(item) as GapCategory),
    pontos_fortes: (normalized.pontos_fortes || []).map((item) => sanitizeText(item)),
    perguntas_sugeridas: (normalized.perguntas_sugeridas || []).map((item) => sanitizeText(item)),
    insights_estrategicos: (normalized.insights_estrategicos || []).map((insight) => ({
      ...insight,
      label: sanitizeText(insight.label),
      value: sanitizeText(insight.value),
    })),
    playbook_detalhado: (normalized.playbook_detalhado || []).map((entry) => ({
      ...entry,
      timestamp: sanitizeText(entry.timestamp),
      fala_lead: sanitizeText(entry.fala_lead),
      resposta_sdr: sanitizeText(entry.resposta_sdr),
      classificacao_sdr: sanitizeText(entry.classificacao_sdr),
      estado_antes: sanitizeText(entry.estado_antes),
      estado_depois: sanitizeText(entry.estado_depois),
      diagnostico_curto: sanitizeText(entry.diagnostico_curto),
      diagnostico_expandido: sanitizeText(entry.diagnostico_expandido),
      recomendacao: sanitizeText(entry.recomendacao),
    })),
    nome_do_lead: sanitizeText(normalized.nome_do_lead || ''),
    status_final: normalized.status_final ?? null,
    rota: normalized.rota ?? null,
    produto_principal: normalized.produto_principal ?? null,
    nota_spin: normalized.nota_spin ?? null,
    score_proximo_passo: normalized.score_proximo_passo,
  };
}

export function getValidNote(analysis: Pick<AnalysisResult, 'status_final' | 'nota_spin'>): number {
  const isValid =
    analysis.status_final !== 'NAO_SE_APLICA' &&
    analysis.nota_spin !== null &&
    Number.isFinite(analysis.nota_spin);

  return isValid ? Number(analysis.nota_spin) : 0;
}

export function getNoteDelta(
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
