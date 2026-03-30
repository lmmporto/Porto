import { Router } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para reuso e clareza
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

router.get('/stats/summary', async (req, res) => {
  // 🚩 ADICIONAR ESTE LOG NO INÍCIO DO HANDLER
  console.log('!!!!!!!!!!!! INICIANDO HANDLER /api/stats/summary (VERSÃO COM AGREGACAO)! !!!!!!!!!!!!'); 
  
  try {
    const { startDate, endDate } = req.query;

    const nowInBrazil = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const brDate = nowInBrazil.split('/').reverse().join('-');

    console.log(`[DEBUG - STATS_SUMMARY] brDate calculado: ${brDate}`);

    const start = startDate ? String(startDate).split('T')[0] : brDate;
    const end = endDate ? String(endDate).split('T')[0] : brDate;

    console.log(`📊 [STATS] Buscando resumo de ${start} até ${end} (Hoje Ref: ${brDate})`);

    const snapshot = await db.collection('dashboard_stats')
      .where(admin.firestore.FieldPath.documentId(), '>=', start)
      .where(admin.firestore.FieldPath.documentId(), '<=', end)
      .get();

    if (snapshot.empty) {
      console.log(`📊 [STATS] Nenhum dado encontrado para ${start} até ${end}.`);
      return res.json({ 
        message: "Nenhum dado encontrado para este período", 
        total_calls: 0, valid_calls: 0, sum_notes: 0, media_geral: 0,
        sdr_ranking: {}, empty: true,
        _debug_version: "FINAL_V1_BR_TIMEZONE_AGREGATED_04042024_EMPTY_SNAPSHOT"
      });
    }

    let total_calls = 0; 
    let valid_calls = 0; 
    let sum_notes = 0;
    
    // Objeto temporário para acumular os dados brutos
    const sdr_ranking: Record<string, { calls: number; sum_notes: number; valid_calls: number; nota_media: number }> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[DEBUG - STATS_SUMMARY - RAW DATA] Document ID: ${doc.id}, Data:`, JSON.stringify(data, null, 2));

      total_calls += Number(data.total_calls || 0);
      valid_calls += Number(data.valid_calls || data.valid_calls_for_media || data.analyzed_calls || 0);
      sum_notes += Number(data.sum_notes || 0);

      // Lógica para reconstruir sdr_ranking de campos planos do Firestore
      for (const key in data) {
        if (key.startsWith('sdr_ranking.')) {
          const parts = key.split('.'); 
          if (parts.length === 3) {
            const sdrName = parts[1];
            const statType = parts[2]; 

            if (!sdr_ranking[sdrName]) {
              sdr_ranking[sdrName] = { calls: 0, sum_notes: 0, valid_calls: 0, nota_media: 0 };
            }

            const value = Number(data[key] || 0);
            if (statType === 'total') {
              sdr_ranking[sdrName].calls += value;
            } else if (statType === 'sum_notes') {
              sdr_ranking[sdrName].sum_notes += value;
            } else if (statType === 'valid_count') {
              sdr_ranking[sdrName].valid_calls += value;
            }
          }
        }
      }
    });

    // 🚩 PARTE FINAL: PROCESSAMENTO, FILTRAGEM E ORDENAÇÃO
    const processedRanking: any = {};

    Object.entries(sdr_ranking).forEach(([name, stats]) => {
      // Só entra no ranking se tiver pelo menos UMA chamada avaliada (evita divisões por zero e lixo)
      if (stats.valid_calls > 0) {
        const media = Number((stats.sum_notes / stats.valid_calls).toFixed(1));
        processedRanking[name] = {
          ...stats,
          nota_media: media
        };
      }
    });

    // Ordenação decrescente por nota_media
    const sortedRanking = Object.entries(processedRanking)
      .sort(([, a]: any, [, b]: any) => b.nota_media - a.nota_media);

    const finalRanking = Object.fromEntries(sortedRanking);

    const mediaGeralCalculada = valid_calls > 0 ? Number((sum_notes / valid_calls).toFixed(2)) : 0;
    
    console.log(`📊 [STATS] Resumo - Total: ${total_calls}, Válidas: ${valid_calls}, Média Geral: ${mediaGeralCalculada}`);
    console.log(`📊 [STATS] Ranking Final Ordenado:`, JSON.stringify(finalRanking, null, 2));

    return res.json({ 
      total_calls, 
      valid_calls, 
      sum_notes, 
      media_geral: mediaGeralCalculada, 
      sdr_ranking: finalRanking,
      _debug_version: "RANKING_FIX_V4"
    });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message, error);
    return res.status(500).json({ 
      error: "Erro interno", 
      details: error.message, 
      _debug_version: "FINAL_ERROR_V4"
    });
  }
});

export default router;