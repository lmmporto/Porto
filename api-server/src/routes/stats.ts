import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para reuso e clareza
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

router.get('/stats/summary', async (req: Request, res: Response) => {
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
    
    const sdr_ranking: Record<string, { calls: number; sum_notes: number; valid_calls: number; nota_media: number }> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[DEBUG - STATS_SUMMARY - RAW DATA] Document ID: ${doc.id}, Data:`, JSON.stringify(data, null, 2));

      total_calls += Number(data.total_calls || 0);
      valid_calls += Number(data.valid_calls || data.valid_calls_for_media || data.analyzed_calls || 0);
      sum_notes += Number(data.sum_notes || 0);

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

    const processedRanking: any = {};

    Object.entries(sdr_ranking).forEach(([name, stats]) => {
      if (stats.valid_calls > 0) {
        const media = Number((stats.sum_notes / stats.valid_calls).toFixed(1));
        processedRanking[name] = {
          ...stats,
          nota_media: media
        };
      }
    });

    const sortedRanking = Object.entries(processedRanking)
      .sort(([, a]: any, [, b]: any) => b.nota_media - a.nota_media);

    const finalRanking = Object.fromEntries(sortedRanking);
    const mediaGeralCalculada = valid_calls > 0 ? Number((sum_notes / valid_calls).toFixed(2)) : 0;

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

// 🚩 ROTA SÊNIOR: Reconstrói as estatísticas do dia do zero
router.post("/rebuild-today-stats", async (req: Request, res: Response) => {
  try {
    const nowInBrazil = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const todayStr = nowInBrazil.split('/').reverse().join('-');

    console.log(`\n[REBUILD] 🔨 Iniciando reconstrução do dia: ${todayStr}`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); 

    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, message: "Nenhuma chamada encontrada para hoje." });
    }

    console.log(`[REBUILD] 📚 Processando ${snapshot.size} chamadas encontradas...`);

    let count = 0;
    for (const doc of snapshot.docs) {
      const callData = doc.data();
      
      // Primeiro registra como VOLUME (isUpdate: false)
      const mockInitial = { status_final: 'NAO_IDENTIFICADO', nota_spin: null };
      await updateDailyStats(callData, mockInitial, false);

      // Se a chamada já estiver concluída, registra a PERFORMANCE (isUpdate: true)
      if (callData.processingStatus === "DONE") {
        await updateDailyStats(callData, callData, true);
      }
      
      count++;
    }

    res.json({ 
      success: true, 
      message: `Cofre reconstruído com sucesso para o dia ${todayStr}.`,
      processedCalls: count 
    });

  } catch (error: any) {
    console.error("❌ [REBUILD ERROR]:", error);
    res.status(500).json({ error: "Falha na reconstrução", details: error.message });
  }
});

export default router;