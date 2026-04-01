import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para consistência na manutenção
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * GET /api/stats/summary
 * Agrega estatísticas de performance. Se startDate/endDate não forem enviados,
 * traz o consolidado de todo o histórico.
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Começamos com a busca aberta (Traz tudo)
    let query: FirebaseFirestore.Query = db.collection('dashboard_stats');

    // 2. Se o site enviou datas, a gente aplica o filtro por ID de documento (__name__)
    if (startDate && endDate) {
      const start = String(startDate).split('T')[0];
      const end = String(endDate).split('T')[0];
      console.log(`📊 [STATS] Filtrando período: ${start} até ${end}`);
      query = query.where('__name__', '>=', start).where('__name__', '<=', end);
    } else {
      console.log(`📊 [STATS] Sem datas informadas. Trazendo todo o histórico.`);
    }

    const snapshot = await query.get();

    let total_calls = 0;
    let valid_calls = 0;
    let sum_notes = 0;
    const sdr_ranking: Record<string, any> = {};

    // 3. Soma os dados de cada dia na memória
    snapshot.forEach(doc => {
      const data = doc.data();
      const rankings = data.sdr_ranking || {};
      
      for (const [name, stats] of Object.entries(rankings) as any) {
        if (!sdr_ranking[name]) {
          sdr_ranking[name] = { calls: 0, valid_calls: 0, sum_notes: 0, nota_media: 0 };
        }

        const sdrTotal = Number(stats.total || 0);
        const sdrValid = Number(stats.valid_count || 0);
        const sdrSum = Number(stats.sum_notes || 0);

        sdr_ranking[name].calls += sdrTotal;
        sdr_ranking[name].valid_calls += sdrValid;
        sdr_ranking[name].sum_notes += sdrSum;
        
        // Totais globais acumulados
        total_calls += sdrTotal;
        valid_calls += sdrValid;
        sum_notes += sdrSum;
      }
    });

    // 4. Calcula a média final de cada SDR para o período processado
    Object.keys(sdr_ranking).forEach(name => {
      const s = sdr_ranking[name];
      s.nota_media = s.valid_calls > 0 ? Number((s.sum_notes / s.valid_calls).toFixed(1)) : 0;
    });

    // 5. Ordena por quem teve a melhor média e reconstrói o objeto
    const sortedRanking = Object.fromEntries(
      Object.entries(sdr_ranking).sort(([, a]: any, [, b]: any) => b.nota_media - a.nota_media)
    );

    return res.json({
      total_calls,
      valid_calls,
      sum_notes,
      media_geral: valid_calls > 0 ? Number((sum_notes / valid_calls).toFixed(2)) : 0,
      sdr_ranking: sortedRanking,
      version: "V3_FIXED_ALL_PERIOD"
    });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message);
    return res.status(500).json({ error: "Erro interno no processamento de estatísticas" });
  }
});

/**
 * 🚩 ROTA DE MANUTENÇÃO: Reconstrói as estatísticas do dia do zero
 */
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

    let count = 0;
    for (const doc of snapshot.docs) {
      const callData = doc.data();
      const mockInitial = { status_final: 'NAO_IDENTIFICADO', nota_spin: null };
      await updateDailyStats(callData, mockInitial, false);

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