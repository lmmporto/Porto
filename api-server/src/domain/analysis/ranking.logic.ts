// src/domain/analysis/ranking.logic.ts
import type { SdrDoc, AggregatedStatsDoc } from './analysis.types.js';

/**
 * 🏛️ DOMÍNIO: Lógica Estatística Pura para Rankings e Regras de Aprovação.
 * Toda inteligência de cálculo reside aqui. Infraestrutura não deve saber o que é uma "nota 7".
 */
export class RankingLogic {
  /**
   * Centraliza a regra de aprovação. Único ponto de verdade para "o que é uma nota boa".
   */
  static isApproved(nota: number): boolean {
    return nota >= 7;
  }

  /**
   * Calcula o estado atualizado de um documento de SDR individual.
   * Aplica suavização Bayesiana (C=5, m=7.0) para evitar que SDRs com poucas
   * ligações dominem o ranking.
   */
  static calculateSdrUpdate(
    currentData: SdrDoc,
    name: string,
    email: string,
    nota: number
  ): SdrDoc {
    const newCount = (currentData.callCount || 0) + 1;
    const newTotal = (currentData.totalScore || 0) + nota;
    const realAverage = Number((newTotal / newCount).toFixed(2));
    const bayesianScore = Number(((newTotal + 5 * 7.0) / (newCount + 5)).toFixed(2));

    return {
      name,
      email,
      callCount: newCount,
      totalScore: newTotal,
      real_average: realAverage,
      ranking_score: bayesianScore,
    };
  }

  /**
   * Calcula o estado atualizado de um documento de estatísticas agregadas
   * (pode ser diário ou global).
   */
  static calculateAggregatedUpdate(
    currentData: AggregatedStatsDoc,
    nota: number
  ): AggregatedStatsDoc {
    const totalCalls = (currentData.total_calls || 0) + 1;
    const sumNotes = (currentData.sum_notes || 0) + nota;
    const approvedCount =
      (currentData.approved_count || 0) + (this.isApproved(nota) ? 1 : 0);

    return {
      total_calls: totalCalls,
      sum_notes: sumNotes,
      media_geral: Number((sumNotes / totalCalls).toFixed(2)),
      taxa_aprovacao: Math.round((approvedCount / totalCalls) * 100),
      approved_count: approvedCount,
    };
  }

  /**
   * Calcula o ranking bayesiano para uma lista de documentos de SDR.
   * Considera o volume de chamadas (tração) e a nota média (qualidade).
   */
  static calculateBayesianRanking(docs: any[]) {
    const sdr_ranking: Record<string, any> = {};
    let total_global_calls = 0;
    let total_global_notes = 0;

    docs.forEach((data) => {
      const name = data.ownerName || 'SDR';
      sdr_ranking[name] = {
        ownerName: name,
        ownerEmail: data.ownerEmail,
        calls: data.totalCalls || 0,
        sum_notes: data.totalScore || 0,
        nota_media: 0,
      };
      total_global_calls += data.totalCalls || 0;
      total_global_notes += data.totalScore || 0;
    });

    const sdrNames = Object.keys(sdr_ranking);
    const totalSDRs = sdrNames.length;
    const v_bar = total_global_calls / (totalSDRs || 1);
    const m_bar =
      total_global_calls > 0 ? total_global_notes / total_global_calls : 0;

    sdrNames.forEach((name) => {
      const s = sdr_ranking[name];
      if (s.calls > 0) {
        const qualidade =
          (s.calls * (s.sum_notes / s.calls) + v_bar * m_bar) / (s.calls + v_bar);
        const tracao = Math.sqrt(s.calls / (v_bar || 1));
        s.nota_media = Number((qualidade * tracao).toFixed(2));
      }
    });

    return {
      ranking: sdr_ranking,
      total_calls: total_global_calls,
      media_geral: m_bar,
    };
  }
}
