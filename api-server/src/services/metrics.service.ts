
import { db } from "../firebase.js";


export class MetricsService {
  static async updateSDRMetrics(sdrId: string) {
    try {
      const callsSnapshot = await db.collection('calls')
        .where('sdrId', '==', sdrId)
        .get();

      if (callsSnapshot.empty) return;

      const scores = callsSnapshot.docs.map(doc => doc.data().analysis?.spinScore?.overall || 0);
      const v = scores.length;
      const R = scores.reduce((a, b) => a + b, 0) / v;

      const m = 5;
      const C = 7.0;
      const rankingScore = (v * R + m * C) / (v + m);

      await db.collection('sdrs').doc(sdrId).update({
        real_average: Number(R.toFixed(2)),
        ranking_score: Number(rankingScore.toFixed(2)),
        lastUpdate: new Date()
      });

      console.log(`[Metrics] SDR ${sdrId} atualizado: Real ${R.toFixed(2)} | Turbo ${rankingScore.toFixed(2)}`);
    } catch (error) {
      console.error(`[Metrics Error] Falha ao atualizar SDR ${sdrId}:`, error);
      throw error;
    }
  }
}
