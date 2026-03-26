import { Router } from 'express';
import { db } from '../firebase.js';

const router = Router();

/**
 * ROTA: GET /api/stats/summary
 * OBJETIVO: Buscar o consolidado de performance (Cofre) do dia.
 */
router.get('/api/stats/summary', async (req, res) => {
  try {
    // 1. Define a data de hoje no formato AAAA-MM-DD (ex: 2026-03-26)
    const today = new Date().toISOString().split('T')[0];
    
    // 2. Busca o documento na coleção 'dashboard_stats' conforme seu Firestore
    const statsRef = db.collection('dashboard_stats').doc(today);
    const doc = await statsRef.get();

    // 3. Se o documento ainda não existir hoje, retorna estrutura zerada para não quebrar o site
    if (!doc.exists) {
      return res.json({ 
        message: "Aguardando processamento de dados para hoje", 
        total_calls: 0,
        valid_calls: 0,
        sum_notes: 0,
        media_geral: 0,
        sdr_ranking: {}, // Essencial para o ranking não sumir da tela no Dashboard
        empty: true 
      });
    }

    const data = doc.data() || {};
    
    // 4. Cálculos de segurança (Evita divisão por zero)
    const sumNotes = Number(data.sum_notes || 0);
    const validCalls = Number(data.valid_calls || 0);
    const mediaGeral = validCalls > 0 ? (sumNotes / validCalls) : 0;

    // 5. Retorna o JSON completo com os campos que o Frontend espera
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