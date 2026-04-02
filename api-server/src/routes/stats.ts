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
 * Retorna o resumo de performance extraído do Placar Consolidado (sdr_stats).
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    // 🚩 MUDANÇA SÊNIOR: Agora lemos diretamente do placar consolidado por SDR
    const snapshot = await db.collection('sdr_stats')
      .orderBy('averageScore', 'desc')
      .get();

    const sdr_ranking: Record<string, any> = {};
    let total_calls = 0;
    let sum_notes = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.ownerName || "SDR Desconhecido";
      
      // Mapeamento direto do documento consolidado do SDR
      sdr_ranking[name] = {
        calls: data.totalCalls || 0,
        valid_calls: data.totalCalls || 0,
        sum_notes: data.totalScore || 0,
        nota_media: data.averageScore || 0
      };

      total_calls += Number(data.totalCalls || 0);
      sum_notes += Number(data.totalScore || 0);
    });

    return res.json({
      total_calls,
      valid_calls: total_calls,
      sum_notes,
      media_geral: total_calls > 0 ? Number((sum_notes / total_calls).toFixed(2)) : 0,
      sdr_ranking: sdr_ranking,
      version: "V3_SDR_STATS_FIX"
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