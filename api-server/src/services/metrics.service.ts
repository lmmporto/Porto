// api-server/src/services/metrics.service.ts
import admin from 'firebase-admin';
import { SdrRepository } from '../infrastructure/database/sdr.repository.js';
import { updateTeamStrategy } from './analysis.service.js';

/**
 * MetricsService — lógica de cálculo pura.
 * O acesso ao banco foi extraído para SdrRepository.
 *
 * ⚠️ A fórmula Bayesiana aqui (m=5, C=5.0) é DIFERENTE da usada em RankingLogic (m=5, C=7.0).
 * Não unificar sem aprovação explícita. Elas alimentam coleções diferentes do Firestore.
 */
export class MetricsService {
  private static M_THRESHOLD = 5;
  private static GLOBAL_AVERAGE_BASELINE = 5.0;

  static async updateSDRMetrics(email: string): Promise<void> {
    const callsData = await SdrRepository.findDoneCallScoresByEmail(email);

    const scores = callsData
      .map((d: any) => Number(d.nota_spin || 0))
      .filter((score: number) => Number.isFinite(score));

    const domainScores = callsData
      .map((d: any) => Number(d.score_dominio || 0))
      .filter((score: number) => Number.isFinite(score));

    const painScores = callsData
      .map((d: any) => Number(d.score_dor || 0))
      .filter((score: number) => Number.isFinite(score));

    const totalCalls = scores.length;
    const cleanId = email.replace(/\./g, '_');

    const registrySnap = await SdrRepository.findRegistryById(cleanId);
    const registryData = registrySnap.exists ? registrySnap.data() : null;
    const teamName = registryData?.assignedTeam || 'Equipe não definida';
    const ownerName = registryData?.name || email.split('@')[0];

    if (totalCalls === 0) {
      await SdrRepository.upsertSdr(cleanId, {
        real_average: 0,
        ranking_score: 0,
        total_calls: 0,
        media_dominio: 0,
        media_dor: 0,
        media_proximo_passo: null,
        ownerName,
        name: ownerName,
        teamName,
        assignedTeam: teamName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const sumScores = scores.reduce((acc: number, val: number) => acc + val, 0);
    const realAverage = sumScores / totalCalls;

    const v = totalCalls;
    const R = realAverage;
    const m = MetricsService.M_THRESHOLD;
    const C = MetricsService.GLOBAL_AVERAGE_BASELINE;
    const rankingScore = (v * R + m * C) / (v + m);

    const mediaDominio =
      domainScores.length > 0
        ? domainScores.reduce((acc: number, val: number) => acc + val, 0) / domainScores.length
        : 0;

    const mediaDor =
      painScores.length > 0
        ? painScores.reduce((acc: number, val: number) => acc + val, 0) / painScores.length
        : 0;

    const callsComProximoPasso = callsData.filter(
      (call: any) =>
        typeof call.score_proximo_passo === 'number' &&
        !isNaN(call.score_proximo_passo) &&
        call.score_proximo_passo > 0
    );

    const mediaProximoPasso =
      callsComProximoPasso.length > 0
        ? callsComProximoPasso.reduce(
            (acc: number, call: any) => acc + call.score_proximo_passo,
            0
          ) / callsComProximoPasso.length
        : null;

    await SdrRepository.upsertSdr(cleanId, {
      real_average: parseFloat(realAverage.toFixed(2)),
      ranking_score: parseFloat(rankingScore.toFixed(2)),
      total_calls: totalCalls,
      media_dominio: parseFloat(mediaDominio.toFixed(2)),
      media_dor: parseFloat(mediaDor.toFixed(2)),
      media_proximo_passo: mediaProximoPasso !== null ? parseFloat(mediaProximoPasso.toFixed(2)) : null,
      ownerName,
      name: ownerName,
      teamName,
      assignedTeam: teamName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  static async updateGlobalSummary(): Promise<void> {
    const scores = await SdrRepository.findAllDoneScores();
    const totalCalls = scores.length;
    const totalScoreSum = scores.reduce((acc: number, score: number) => acc + score, 0);
    const globalAverage = totalCalls > 0 ? totalScoreSum / totalCalls : 0;

    await SdrRepository.upsertGlobalSummary({
      total_calls: totalCalls,
      media_geral: parseFloat(globalAverage.toFixed(2)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await updateTeamStrategy();
  }

  static async getStatsByTeam(
    teamName: string,
    period?: string,
    route?: string
  ): Promise<any[]> {
    const emails = await SdrRepository.findActiveEmailsByTeam(teamName);
    if (emails.length === 0) return [];

    const calls = await SdrRepository.findCallsByEmails(emails);

    let filtered = calls;

    // Filtro de período
    if (period && period !== 'Tudo') {
      const now = new Date();
      let startDate = new Date();

      if (period === 'Hoje') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === '7D') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === '30D') {
        startDate.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter((c: any) => {
        const ts = c.callTimestamp?.toDate
          ? c.callTimestamp.toDate()
          : new Date(c.callTimestamp || c.createdAt);
        return ts >= startDate;
      });
    }

    // Filtro de rota
    if (route && route !== 'all' && route !== 'ALL') {
      filtered = filtered.filter((c: any) => c.rota === route);
    }

    return filtered;
  }
}