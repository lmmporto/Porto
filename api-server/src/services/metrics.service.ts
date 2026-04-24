import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { updateTeamStrategy } from './analysis.service.js';
import { CallStatus } from '../constants/call-processing.js';

export class MetricsService {
  private static M_THRESHOLD = 5;
  private static GLOBAL_AVERAGE_BASELINE = 5.0;

  static async updateSDRMetrics(email: string): Promise<void> {
    const callsSnapshot = await db
      .collection('calls_analysis')
      .where('ownerEmail', '==', email)
      .where('processingStatus', '==', CallStatus.DONE)
      .select('nota_spin', 'score_dominio', 'score_dor')
      .get();

    const callsData = callsSnapshot.docs.map((doc: any) => doc.data());

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

    const registrySnap = await db.collection('sdr_registry').doc(cleanId).get();
    const registryData = registrySnap.exists ? registrySnap.data() : null;
    const teamName = registryData?.assignedTeam || 'Equipe não definida';
    const ownerName = registryData?.name || email.split('@')[0];

    if (totalCalls === 0) {
      await db.collection('sdrs').doc(cleanId).set(
        {
          real_average: 0,
          ranking_score: 0,
          total_calls: 0,
          media_dominio: 0,
          media_dor: 0,
          ownerName,
          name: ownerName,
          teamName,
          assignedTeam: teamName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

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
        ? domainScores.reduce((acc: number, val: number) => acc + val, 0) /
        domainScores.length
        : 0;

    const mediaDor =
      painScores.length > 0
        ? painScores.reduce((acc: number, val: number) => acc + val, 0) /
        painScores.length
        : 0;

    await db.collection('sdrs').doc(cleanId).set(
      {
        real_average: parseFloat(realAverage.toFixed(2)),
        ranking_score: parseFloat(rankingScore.toFixed(2)),
        total_calls: totalCalls,
        media_dominio: parseFloat(mediaDominio.toFixed(2)),
        media_dor: parseFloat(mediaDor.toFixed(2)),
        ownerName,
        name: ownerName,
        teamName,
        assignedTeam: teamName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  static async updateGlobalSummary(): Promise<void> {
    const callsSnapshot = await db
      .collection('calls_analysis')
      .where('processingStatus', '==', CallStatus.DONE)
      .select('nota_spin')
      .get();

    const scores = callsSnapshot.docs
      .map((doc: any) => Number(doc.data().nota_spin || 0))
      .filter((score: number) => Number.isFinite(score));

    const totalCalls = scores.length;

    const totalScoreSum = scores.reduce(
      (acc: number, score: number) => acc + score,
      0
    );

    const globalAverage = totalCalls > 0 ? totalScoreSum / totalCalls : 0;

    await db.collection('dashboard_stats').doc('global_summary').set(
      {
        total_calls: totalCalls,
        media_geral: parseFloat(globalAverage.toFixed(2)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await updateTeamStrategy();
  }

  static async getStatsByTeam(teamName: string): Promise<any[]> {
    const teamMembersSnapshot = await db
      .collection('sdr_registry')
      .where('assignedTeam', '==', teamName)
      .where('isActive', '==', true)
      .get();

    const sdrEmails = teamMembersSnapshot.docs
      .map((doc: any) => doc.data().email)
      .filter((email: any) => !!email);

    if (sdrEmails.length === 0) return [];

    const chunks: string[][] = [];

    for (let i = 0; i < sdrEmails.length; i += 30) {
      chunks.push(sdrEmails.slice(i, i + 30));
    }

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const callsSnapshot = await db
          .collection('calls_analysis')
          .where('ownerEmail', 'in', chunk)
          .where('processingStatus', '==', CallStatus.DONE)
          .get();

        return callsSnapshot.docs.map((doc: any) => doc.data());
      })
    );

    return results.flat();
  }
}