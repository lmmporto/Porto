import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { updateTeamStrategy } from './analysis.service.js';

export class MetricsService {
  private static M_THRESHOLD = 5;
  private static GLOBAL_AVERAGE_BASELINE = 5.0;

  static async updateSDRMetrics(email: string): Promise<void> {
    const callsSnapshot = await db
      .collection('calls_analysis')
      .where('ownerEmail', '==', email)
      .select('nota_spin', 'score_dominio', 'score_dor')
      .get();

    const callsData = callsSnapshot.docs.map(doc => doc.data());
    const scores = callsData.map(d => d.nota_spin || 0);
    const domainScores = callsData.map(d => d.score_dominio || 0);
    const painScores = callsData.map(d => d.score_dor || 0);

    const totalCalls = scores.length;

    if (totalCalls === 0) return;

    const sumScores = scores.reduce((acc, val) => acc + val, 0);
    const realAverage = sumScores / totalCalls;

    const v = totalCalls;
    const R = realAverage;
    const m = MetricsService.M_THRESHOLD;
    const C = MetricsService.GLOBAL_AVERAGE_BASELINE;

    const rankingScore = (v * R + m * C) / (v + m);
    const cleanId = email.replace(/\./g, '_');

    const mediaDominio =
      domainScores.reduce((acc, val) => acc + val, 0) / totalCalls;

    const mediaDor =
      painScores.reduce((acc, val) => acc + val, 0) / totalCalls;

    await db.collection('sdrs').doc(cleanId).set(
      {
        real_average: parseFloat(realAverage.toFixed(2)),
        ranking_score: parseFloat(rankingScore.toFixed(2)),
        total_calls: totalCalls,
        media_dominio: parseFloat(mediaDominio.toFixed(2)),
        media_dor: parseFloat(mediaDor.toFixed(2)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  static async updateGlobalSummary(): Promise<void> {
    const sdrsSnapshot = await db.collection('sdrs').get();
    const allSdrs = sdrsSnapshot.docs.map(doc => doc.data());

    const totalCalls = allSdrs.reduce(
      (acc, sdr) => acc + (sdr.total_calls || 0),
      0
    );

    const totalScoreSum = allSdrs.reduce(
      (acc, sdr) => acc + (sdr.real_average || 0) * (sdr.total_calls || 0),
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
}