import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para consistência na manutenção
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// 🚩 ESTADOS DE CACHE EM MEMÓRIA (1 MINUTO)
let cachedStats: any = null;
let lastCacheTime = 0;

/**
 * GET /summary (Relativo ao prefixo /api/stats)
 * Retorna o resumo de performance extraído do Placar Consolidado (sdr_stats).
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    
    // 🚩 LÓGICA DE CACHE: Retorna o cache se tiver menos de 1 minuto
    if (cachedStats && (now - lastCacheTime < 60000)) {
      console.log(`📊 [STATS] Retornando resumo de performance do CACHE.`);
      return res.json(cachedStats);
    }

    console.log(`📊 [STATS] Buscando resumo de performance do FIRESTORE...`);

    // Agora lemos diretamente do placar consolidado por SDR
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

    // 🚩 NOVA MATEMÁTICA: SCORE TURBO DINÂMICO
    const sdrNames = Object.keys(sdr_ranking);
    const totalSDRs = sdrNames.length || 1;

    // Âncoras Dinâmicas (Médias do Time)
    const v_bar = total_calls / totalSDRs; // Média de volume do time (V-barra)
    const m_bar = total_calls > 0 ? (sum_notes / total_calls) : 0; // Média de nota do time (M-barra)

    sdrNames.forEach(name => {
      const s = sdr_ranking[name];
      const V = s.calls;
      const M = s.valid_calls > 0 ? (s.sum_notes / s.valid_calls) : 0;

      if (V > 0) {
        // 1. Qualidade Bayesiana (Puxa para a média se tiver pouco volume)
        const qualidade = (V * M + v_bar * m_bar) / (V + v_bar);

        // 2. Fator de Tração (Premia quem tem mais volume que a média do time)
        const tracao = Math.sqrt(V / (v_bar || 1));

        // Resultado Final: Qualidade x Tração
        s.nota_media = Number((qualidade * tracao).toFixed(1));
      } else {
        s.nota_media = 0;
      }
    });

    // 🚩 EMPACOTANDO O RESULTADO PARA SALVAR NO CACHE
    const resultado = {
      total_calls,
      valid_calls: total_calls,
      sum_notes,
      media_geral: total_calls > 0 ? Number((sum_notes / total_calls).toFixed(2)) : 0,
      sdr_ranking: sdr_ranking,
      version: "V6_TURBO_SCORE_DYNAMIC"
    };

    // Atualiza as variáveis globais de cache
    cachedStats = resultado;
    lastCacheTime = now;

    return res.json(resultado);

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