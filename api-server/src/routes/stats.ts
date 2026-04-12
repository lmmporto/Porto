import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';
import { checkIfAdmin } from '../utils/auth.js';
import NodeCache from 'node-cache';

const router = Router();
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

// 🏛️ Cache de 1 hora
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * GET /summary
 * Retorna o resumo com Cache de 1 Hora e isolamento por usuário.
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);
    const requestedEmail = (req.query.ownerEmail as string)?.toLowerCase().trim();
    
    const targetEmail = (isAdmin && requestedEmail) ? requestedEmail : userEmail;
    const isGlobalQuery = isAdmin && !requestedEmail;
    const cacheKey = `summary_${isGlobalQuery ? 'GLOBAL' : targetEmail}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`📊 [CACHE HIT] Resumo para: ${cacheKey}`);
      return res.json(cachedData);
    }

    const nowDate = new Date();
    const currentMonthKey = `${nowDate.getFullYear()}_${String(nowDate.getMonth() + 1).padStart(2, '0')}`;

    const snapshot = await db.collection('sdr_stats').get();
    let monthlyDocs = snapshot.docs.filter(doc => doc.id.endsWith(currentMonthKey));

    if (!isGlobalQuery) {
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
    const v_bar = total_calls_time / (sdrNames.length || 1);
    const m_bar = total_calls_time > 0 ? (sum_notes_time / total_calls_time) : 0;

    sdrNames.forEach(name => {
      const s = sdr_ranking[name];
      if (s.calls > 0) {
        const qualidade = (s.calls * (s.sum_notes / s.calls) + v_bar * m_bar) / (s.calls + v_bar);
        const tracao = Math.sqrt(s.calls / (v_bar || 1));
        s.nota_media = Number((qualidade * tracao).toFixed(2));
      }
    });

    const resultado = {
      total_calls: total_calls_time,
      media_geral: Number(m_bar.toFixed(2)),
      sdr_ranking,
      version: "V7_MONTHLY_BAYESIAN_CACHED"
    };

    cache.set(cacheKey, resultado);
    return res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /performance
 * Otimizado com Aggregation Query.
 */
router.get("/performance", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ error: "Não autorizado" });

    const { startDate, endDate, ownerEmail, rota } = req.query;
    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    if (!isAdmin) query = query.where("ownerEmail", "==", userEmail);
    else if (ownerEmail) query = query.where("ownerEmail", "==", (ownerEmail as string).toLowerCase().trim());

    if (rota && rota !== 'ALL') query = query.where("rota", "==", rota);

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      query = query.where("callTimestamp", ">=", admin.firestore.Timestamp.fromDate(start))
                   .where("callTimestamp", "<=", admin.firestore.Timestamp.fromDate(end));
    }

    const countSnapshot = await query.count().get();
    const snapshot = await query.orderBy("callTimestamp", "desc").limit(50).get();
    
    res.json({ 
      count: countSnapshot.data().count,
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao carregar métricas" });
  }
});

router.get('/personal-summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ error: "Não autorizado" });

    const userEmail = (req.user as any).email;
    const rawEmail = (req.query.ownerEmail as string) || userEmail || "";
    const targetEmail = rawEmail.toLowerCase().trim();

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);
    if (targetEmail.includes('@')) query = query.where("ownerEmail", "==", targetEmail);
    else query = query.where("ownerName", "==", rawEmail);

    const snapshot = await query.orderBy("callTimestamp", "desc").limit(15).get();
    if (snapshot.empty) return res.json({ gaps: [], insights: [], totalAnalisadas: 0 });

    const gapMap: Record<string, { text: string, count: number }> = {};
    const insightMap: Record<string, { text: string, count: number }> = {};

    snapshot.docs.forEach((doc) => {
      const c = doc.data();
      const rawGaps = (Array.isArray(c.alertas) && c.alertas.length > 0) ? c.alertas : (c.ponto_atencao ? [c.ponto_atencao] : []);
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

    return res.json({
      gaps: Object.values(gapMap).sort((a, b) => b.count - a.count).map(e => e.text).slice(0, 3),
      insights: Object.values(insightMap).sort((a, b) => b.count - a.count).map(e => e.text).slice(0, 3),
      totalAnalisadas: snapshot.size
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaderboard-vitrine', async (req: Request, res: Response) => {
  try {
    const sdrSnapshot = await db.collection('sdr_stats').orderBy('averageScore', 'desc').limit(6).get();
    const topCallsSnapshot = await db.collection(CONFIG.CALLS_COLLECTION).where("processingStatus", "==", "DONE").orderBy("nota_spin", "desc").limit(5).get();
    return res.json({
      top6: sdrSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      topCalls: topCallsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao carregar vitrine" });
  }
});

router.post("/rebuild-today-stats", async (req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); 
    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION).where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay)).get();
    for (const doc of snapshot.docs) {
      const callData = doc.data();
      await updateDailyStats(callData, { status_final: 'NAO_IDENTIFICADO', nota_spin: null }, false);
      if (callData.processingStatus === "DONE") await updateDailyStats(callData, callData, true);
    }
    res.json({ success: true, processedCalls: snapshot.size });
  } catch (error: any) {
    res.status(500).json({ error: "Falha na reconstrução", details: error.message });
  }
});

export default router;