import { Router } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin'; // 🚩 Importação ultra-segura

const router = Router();

router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const today = new Date().toISOString().split('T')[0];
    const start = startDate ? String(startDate).split('T')[0] : today;
    const end = endDate ? String(endDate).split('T')[0] : today;

    console.log(`📊 [STATS] Buscando resumo de ${start} até ${end}`);

    // Usando admin.firestore para garantir que não dê erro de importação
    const snapshot = await db.collection('dashboard_stats')
      .where(admin.firestore.FieldPath.documentId(), '>=', start)
      .where(admin.firestore.FieldPath.documentId(), '<=', end)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        message: "Nenhum dado encontrado para este período", 
        total_calls: 0, valid_calls: 0, sum_notes: 0, media_geral: 0,
        sdr_ranking: {}, empty: true 
      });
    }

    let total_calls = 0; let valid_calls = 0; let sum_notes = 0;
    const sdr_ranking: Record<string, any> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      total_calls += Number(data.total_calls || 0);
      
      // 🚩 Agora ele lê a coluna antiga também, corrigindo a média bizarra!
      valid_calls += Number(data.valid_calls || data.valid_calls_for_media || data.analyzed_calls || 0);
      
      sum_notes += Number(data.sum_notes || 0);

      if (data.sdr_ranking) {
        for (const [sdrName, stats] of Object.entries(data.sdr_ranking)) {
          if (!sdr_ranking[sdrName]) sdr_ranking[sdrName] = { calls: 0, sum_notes: 0, valid_calls: 0, nota_media: 0 };
          const sdrStats = stats as any;
          sdr_ranking[sdrName].calls += Number(sdrStats.calls || sdrStats.total || 0);
          sdr_ranking[sdrName].valid_calls += Number(sdrStats.valid_calls || sdrStats.valid_count || 0);
          sdr_ranking[sdrName].sum_notes += Number(sdrStats.sum_notes || 0);
          if (sdr_ranking[sdrName].valid_calls > 0) {
            sdr_ranking[sdrName].nota_media = Number((sdr_ranking[sdrName].sum_notes / sdr_ranking[sdrName].valid_calls).toFixed(2));
          }
        }
      }
    });

    const mediaGeral = valid_calls > 0 ? (sum_notes / valid_calls) : 0;
    return res.json({ total_calls, valid_calls, sum_notes, media_geral: Number(mediaGeral.toFixed(2)), sdr_ranking });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error);
    return res.status(500).json({ error: "Erro interno", details: error.message });
  }
});

export default router;