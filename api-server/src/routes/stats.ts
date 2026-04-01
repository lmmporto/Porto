import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para consistência entre rotas
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * GET /api/stats/summary
 * Retorna o resumo de performance do Placar Consolidado com logs de fuso horário.
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    // 🚩 LÓGICA DE DATA MANTIDA PARA DEBUG E AUDITORIA
    const nowInBrazil = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const brDate = nowInBrazil.split('/').reverse().join('-');

    console.log(`📊 [STATS] Solicitando resumo. Ref Hoje Brasil: ${brDate}`);

    // 1. Puxa do Placar Consolidado (sdr_stats) - Onde a performance real reside
    const snapshot = await db.collection('sdr_stats').orderBy('averageScore', 'desc').get();

    let valid_calls = 0;
    let sum_notes = 0;
    const sdr_ranking: any = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const nome = data.ownerName || "SDR Desconhecido";

      // 2. Formata para a estrutura que o Frontend espera
      sdr_ranking[nome] = {
        calls: data.totalCalls || 0,
        valid_calls: data.totalCalls || 0,
        sum_notes: data.totalScore || 0,
        nota_media: data.averageScore || 0
      };

      valid_calls += (data.totalCalls || 0);
      sum_notes += (data.totalScore || 0);
    });

    const media_geral = valid_calls > 0 ? Number((sum_notes / valid_calls).toFixed(2)) : 0;

    return res.json({
      total_calls: valid_calls,
      valid_calls: valid_calls,
      sum_notes: sum_notes,
      media_geral: media_geral,
      sdr_ranking: sdr_ranking,
      version: "V1_PLACAR_CONSOLIDADO_BR_TIMEZONE" // 🚩 Versão com Placar + Timezone
    });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message);
    return res.status(500).json({ error: "Erro interno ao processar estatísticas" });
  }
});

/**
 * 🚩 ROTA DE MANUTENÇÃO: Reconstrói as estatísticas do dia do zero
 * Usa o fuso horário de Brasília para identificar as chamadas de hoje.
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