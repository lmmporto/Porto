import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';
import { checkIfAdmin } from '../utils/auth.js';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para consistência na manutenção
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// 🚩 ESTADOS DE CACHE EM MEMÓRIA (1 MINUTO)
let cachedStats: any = null;
let lastCacheTime = 0;

/**
 * GET /summary (Relativo ao prefixo /api/stats)
 * Retorna o resumo de performance extraído do Placar Consolidado (sdr_stats) com lógica Bayesiana.
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);
    const now = Date.now();

    // 🚩 PERMITE SIMULAÇÃO NO RANKING
    const requestedEmail = req.query.ownerEmail as string;
    const targetEmail = (isAdmin && requestedEmail) ? requestedEmail.toLowerCase().trim() : userEmail.toLowerCase().trim();
    
    // 🚩 PROTEÇÃO DE MEMÓRIA: Verifica cache global apenas se for a busca geral (sem filtro de e-mail)
    if (!requestedEmail && isAdmin && cachedStats && (now - lastCacheTime < 60000)) {
      console.log(`📊 [STATS] Retornando resumo de performance do CACHE.`);
      return res.json(cachedStats);
    }

    // 1. Busca os dados limpos do Firestore (sdr_stats)
    let query: FirebaseFirestore.Query = db.collection('sdr_stats');
    
    if (!isAdmin || requestedEmail) {
      query = query.where("ownerEmail", "==", targetEmail);
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.json({ total_calls: 0, media_geral: 0, sdr_ranking: {}, version: "V7_SANATIZED_BAYESIAN_EMPTY" });
    }

    const sdr_ranking: Record<string, any> = {};
    let total_calls_time = 0;
    let sum_notes_time = 0;

    // 2. Agregação Inicial
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.ownerName || "SDR Desconhecido";
      
      sdr_ranking[name] = {
        ownerName: name,
        ownerEmail: data.ownerEmail,
        calls: data.totalCalls || 0,
        sum_notes: data.totalScore || 0,
        nota_media: 0 // Será calculado pela lógica Bayesiana abaixo
      };

      total_calls_time += (data.totalCalls || 0);
      sum_notes_time += (data.totalScore || 0);
    });

    const sdrNames = Object.keys(sdr_ranking);
    const totalSDRs = sdrNames.length;

    // 🚩 3. MATEMÁTICA BAYESIANA (O "Turbo Score")
    const v_bar = total_calls_time / totalSDRs; // Média de volume do time
    const m_bar = total_calls_time > 0 ? (sum_notes_time / total_calls_time) : 0; // Média de nota do time

    sdrNames.forEach(name => {
      const s = sdr_ranking[name];
      const V = s.calls;
      const M = V > 0 ? (s.sum_notes / V) : 0;

      if (V > 0) {
        // Qualidade Bayesiana: Suaviza notas de quem tem pouco volume
        const qualidade = (V * M + v_bar * m_bar) / (V + v_bar);
        // Fator de Tração: Premia quem tem volume acima da média
        const tracao = Math.sqrt(V / (v_bar || 1));
        
        s.nota_media = Number((qualidade * tracao).toFixed(2));
      }
    });

    const resultado = {
      total_calls: total_calls_time,
      media_geral: Number(m_bar.toFixed(2)),
      sdr_ranking: sdr_ranking,
      version: "V7_SANATIZED_BAYESIAN"
    };

    // 🚩 ATUALIZAÇÃO DO CACHE: Apenas se for a query global de Admin
    if (isAdmin && !requestedEmail) {
      cachedStats = resultado;
      lastCacheTime = now;
    }

    return res.json(resultado);

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /personal-summary
 * Retorna insights qualitativos baseados nas últimas chamadas.
 */
router.get('/personal-summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email;
    const rawEmail = (req.query.ownerEmail as string) || userEmail || "";
    const targetEmail = rawEmail.toLowerCase().trim();

    console.log(`⚠️ [DEBUG] Buscando insights para: ${targetEmail}`);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    if (targetEmail.includes('@')) {
      query = query.where("ownerEmail", "==", targetEmail);
    } else {
      query = query.where("ownerName", "==", rawEmail);
    }

    const snapshot = await query.orderBy("callTimestamp", "desc").limit(15).get();

    if (snapshot.empty) {
      console.log(`⚠️ [DEBUG DASHBOARD] Nenhum documento encontrado para: ${targetEmail}`);
      return res.json({ gaps: [], insights: [], totalAnalisadas: 0 });
    }

    const gapMap: Record<string, { text: string, count: number }> = {};
    const insightMap: Record<string, { text: string, count: number }> = {};

    snapshot.docs.forEach((doc) => {
      const c = doc.data();
      const rawGaps = (Array.isArray(c.alertas) && c.alertas.length > 0)
        ? c.alertas
        : (c.ponto_atencao ? [c.ponto_atencao] : []);

      rawGaps.forEach((g: string) => {
        if (!g || g.length < 5) return;
        const key = g.split(' ').slice(0, 5).join(' ').toLowerCase().replace(/[^\w\s]/gi, '');
        if (!gapMap[key]) gapMap[key] = { text: g, count: 0 };
        gapMap[key].count++;
      });

      if (Array.isArray(c.pontos_fortes)) {
        c.pontos_fortes.forEach((i: string) => {
          if (!i || i.length < 5) return;
          const key = i.split(' ').slice(0, 5).join(' ').toLowerCase().replace(/[^\w\s]/gi, '');
          if (!insightMap[key]) insightMap[key] = { text: i, count: 0 };
          insightMap[key].count++;
        });
      }
    });

    const sortedGaps = Object.values(gapMap).sort((a, b) => b.count - a.count).map(e => e.text).slice(0, 3);
    const sortedInsights = Object.values(insightMap).sort((a, b) => b.count - a.count).map(e => e.text).slice(0, 3);

    return res.json({
      gaps: sortedGaps,
      insights: sortedInsights,
      totalAnalisadas: snapshot.size
    });

  } catch (error: any) {
    console.error("❌ [CRASH NO PERSONAL-SUMMARY]:", error); 
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /leaderboard-vitrine
 * Retorna o Pódio de SDRs e as Top 5 chamadas globais.
 */
router.get('/leaderboard-vitrine', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const sdrSnapshot = await db.collection('sdr_stats')
      .orderBy('averageScore', 'desc')
      .limit(6)
      .get();

    const top6 = sdrSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const topCallsSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where("processingStatus", "==", "DONE")
      .orderBy("nota_spin", "desc")
      .limit(5)
      .get();

    return res.json({
      top6,
      topCalls: topCallsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error: any) {
    console.error("❌ [VITRINE ERROR]:", error.message);
    return res.status(500).json({ error: "Erro ao carregar vitrine" });
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