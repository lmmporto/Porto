import { Router } from 'express';
import { db } from '../firebase.js';

const router = Router();

/**
 * ROTA: /stats/summary (O app principal já injeta o /api antes)
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dashboard_stats').doc(today);
    const doc = await statsRef.get();

    if (!doc.exists) {
      return res.json({ 
        message: "Aguardando processamento de dados para hoje", 
        total_calls: 0,
        valid_calls: 0,
        sum_notes: 0,
        media_geral: 0,
        sdr_ranking: {}, 
        empty: true 
      });
    }

    const data = doc.data() || {};
    
    const sumNotes = Number(data.sum_notes || 0);
    const validCalls = Number(data.valid_calls || 0);
    const mediaGeral = validCalls > 0 ? (sumNotes / validCalls) : 0;

    return res.json({
      ...data,
      media_geral: Number(mediaGeral.toFixed(2))
    });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message);
    return res.status(500).json({ 
      error: "Erro interno ao buscar resumo das métricas",
      details: error.message 
    });
  }
});

export default router;