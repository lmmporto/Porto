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
 * Retorna o resumo de performance extraído do Placar Consolidado (sdr_stats) com lógica Bayesiana e filtro mensal.
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);
    const now = Date.now();
    
    const nowDate = new Date();
    const currentMonthKey = `${nowDate.getFullYear()}_${String(nowDate.getMonth() + 1).padStart(2, '0')}`;

    const requestedEmail = req.query.ownerEmail as string;
    const targetEmail = (isAdmin && requestedEmail) ? requestedEmail.toLowerCase().trim() : userEmail.toLowerCase().trim();
    
    if (!requestedEmail && isAdmin && cachedStats && (now - lastCacheTime < 60000)) {
      console.log(`📊 [STATS] Retornando resumo de performance do CACHE.`);
      return res.json(cachedStats);
    }

    const snapshot = await db.collection('sdr_stats').get();
    let monthlyDocs = snapshot.docs.filter(doc => doc.id.endsWith(currentMonthKey));

    if (!isAdmin || requestedEmail) {
      monthlyDocs = monthlyDocs.filter(doc => doc.data().ownerEmail === targetEmail);
    }
    
    if (monthlyDocs.length === 0) {
      return res.json({ total_calls: 0, media_geral: 0, sdr_ranking: {}, version: "V7_MONTHLY_BAYESIAN_EMPTY" });
    }

    const sdr_ranking: Record<string, any> = {};
    let total_calls_time = 0;
    let sum_notes_time = 0;

    monthlyDocs.forEach(doc => {
      const data = doc.data();
      const name = data.ownerName || "SDR";
      
      sdr_ranking[name] = {
        ownerName: name,
        ownerEmail: data.ownerEmail,
        calls: data.totalCalls || 0,
        valid_calls: data.totalCalls || 0, 
        sum_notes: data.totalScore || 0,
        nota_media: 0 
      };

      total_calls_time += (data.totalCalls || 0);
      sum_notes_time += (data.totalScore || 0);
    });

    const sdrNames = Object.keys(sdr_ranking);
    const totalSDRs = sdrNames.length;

    const v_bar = total_calls_time / totalSDRs;
    const m_bar = total_calls_time > 0 ? (sum_notes_time / total_calls_time) : 0;

    sdrNames.forEach(name => {
      const s = sdr_ranking[name];
      const V = s.calls;
      const M = V > 0 ? (s.sum_notes / V) : 0;

      if (V > 0) {
        const qualidade = (V * M + v_bar * m_bar) / (V + v_bar);
        const tracao = Math.sqrt(V / (v_bar || 1));
        s.nota_media = Number((qualidade * tracao).toFixed(2));
      }
    });

    const resultado = {
      total_calls: total_calls_time,
      media_geral: Number(m_bar.toFixed(2)),
      sdr_ranking: sdr_ranking,
      version: "V7_MONTHLY_BAYESIAN"
    };

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
 * GET /performance
 * Retorna métricas detalhadas com suporte a filtro por Categoria (Rota).
 */
router.get("/performance", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { startDate, endDate, ownerEmail, rota } = req.query;
    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    // 1. Filtro de Identidade (Segurança)
    if (!isAdmin) {
      query = query.where("ownerEmail", "==", userEmail);
    } else if (ownerEmail) {
      query = query.where("ownerEmail", "==", (ownerEmail as string).toLowerCase().trim());
    }

    // 2. 🚩 FILTRO DE CATEGORIA (ROTA)
    if (rota && rota !== 'ALL') {
      console.log(`🎯 [METRICS] Filtrando por Categoria: ${rota}`);
      query = query.where("rota", "==", rota);
    }

    // 3. Filtro de Período
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);

      query = query
        .where("callTimestamp", ">=", admin.firestore.Timestamp.fromDate(start))
        .where("callTimestamp", "<=", admin.firestore.Timestamp.fromDate(end));
    }

    // Ordenação padrão para métricas
    query = query.orderBy("callTimestamp", "desc");

    const snapshot = await query.get();
    
    res.json({ 
      count: snapshot.size,
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });

  } catch (error: any) {
    console.error("❌ [METRICS ERROR]:", error.message);
    res.status(500).json({ error: "Erro ao carregar métricas de performance" });
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