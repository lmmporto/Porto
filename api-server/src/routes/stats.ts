import { Router } from 'express';
import { db } from '../firebase.js';
import { firestore } from 'firebase-admin'; // <-- Adicionado aqui

const router = Router();

/**
 * ROTA: /stats/summary
 * OBJETIVO: Buscar e agregar o consolidado de performance com base no filtro de datas
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Define as datas. Se o Front não enviar nada, o padrão é "hoje".
    // Extraímos apenas a parte "YYYY-MM-DD" para bater com o ID do seu Firestore
    const today = new Date().toISOString().split('T')[0];
    const start = startDate ? String(startDate).split('T')[0] : today;
    const end = endDate ? String(endDate).split('T')[0] : today;

    // 2. Busca no banco TODOS os documentos (dias) que estão dentro do período escolhido
    // Utilizando o FieldPath.documentId() de forma segura para o Firebase Admin
    const snapshot = await db.collection('dashboard_stats')
      .where(firestore.FieldPath.documentId(), '>=', start) // <-- Alterado aqui
      .where(firestore.FieldPath.documentId(), '<=', end)   // <-- Alterado aqui
      .get();

    // 3. Se não houver nenhum dado no período, retorna zerado para não quebrar a tela
    if (snapshot.empty) {
      return res.json({ 
        message: "Nenhum dado encontrado para este período", 
        total_calls: 0,
        valid_calls: 0,
        sum_notes: 0,
        media_geral: 0,
        sdr_ranking: {}, 
        empty: true 
      });
    }

    // 4. Variáveis para ir somando os dados de todos os dias encontrados
    let total_calls = 0;
    let valid_calls = 0;
    let sum_notes = 0;
    const sdr_ranking: Record<string, any> = {};

    // 5. Agregação: Passa dia por dia somando o volume e as notas
    snapshot.forEach(doc => {
      const data = doc.data();
      
      total_calls += Number(data.total_calls || 0);
      valid_calls += Number(data.valid_calls || 0);
      sum_notes += Number(data.sum_notes || 0);

      // Agrega os dados do Ranking de SDRs (Soma os resultados de cada um)
      if (data.sdr_ranking) {
        for (const [sdrName, stats] of Object.entries(data.sdr_ranking)) {
          if (!sdr_ranking[sdrName]) {
            sdr_ranking[sdrName] = { calls: 0, sum_notes: 0, valid_calls: 0, nota_media: 0 };
          }
          
          const sdrStats = stats as any;
          sdr_ranking[sdrName].calls += Number(sdrStats.calls || 0);
          sdr_ranking[sdrName].valid_calls += Number(sdrStats.valid_calls || 0);
          sdr_ranking[sdrName].sum_notes += Number(sdrStats.sum_notes || 0);
          
          // Recalcula a nota média desse SDR para o período
          if (sdr_ranking[sdrName].valid_calls > 0) {
            sdr_ranking[sdrName].nota_media = Number(
              (sdr_ranking[sdrName].sum_notes / sdr_ranking[sdrName].valid_calls).toFixed(2)
            );
          }
        }
      }
    });

    // 6. Calcula a média geral da operação para o período
    const mediaGeral = valid_calls > 0 ? (sum_notes / valid_calls) : 0;

    // 7. Retorna o resumão final pronto para o Dashboard
    return res.json({
      total_calls,
      valid_calls,
      sum_notes,
      media_geral: Number(mediaGeral.toFixed(2)),
      sdr_ranking
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