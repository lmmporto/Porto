// src/domain/analysis/analysis.schemas.ts
import {
  type AnalysisStatus,
  type AnalysisRoute,
  type MainProduct,
  type StrategicInsight,
  type PlaybookEntry,
  type AnalysisResult,
  type TranscriptionResult,
  type TeamStrategyResult,
  type UpdateDailyStatsOptions,
} from './analysis.types.js';
import { sanitizeText } from '../../utils.js';

export const ANALYSIS_RESPONSE_SCHEMA = {
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
        required: ['timestamp', 'fala_lead', 'resposta_sdr', 'diagnostico', 'recomendacao'],
        properties: {
          timestamp: { type: 'string' },
          fala_lead: { type: 'string' },
          resposta_sdr: { type: 'string' },
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

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isStrategicInsight(value: unknown): value is StrategicInsight {
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

export function isPlaybookEntry(value: unknown): value is PlaybookEntry {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.timestamp === 'string' &&
    typeof value.fala_lead === 'string' &&
    typeof value.resposta_sdr === 'string' &&
    typeof value.diagnostico === 'string' &&
    typeof value.recomendacao === 'string'
  );
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
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
      resposta_sdr: sanitizeText(entry.resposta_sdr),
      diagnostico: sanitizeText(entry.diagnostico),
      recomendacao: sanitizeText(entry.recomendacao),
    })),
    nome_do_lead: value.nome_do_lead
      ? sanitizeText(value.nome_do_lead)
      : undefined,
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
