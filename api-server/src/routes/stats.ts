import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';
import {
  type AnalysisStatus,
  type UpdateDailyStatsOptions,
} from '../domain/analysis/analysis.types.js';
import {
  CALLS_COLLECTION,
  SDR_MONTHLY_STATS_COLLECTION,
} from '../domain/analysis/analysis.constants.js';
import { checkIfAdmin } from '../utils/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { MetricsService } from '../services/metrics.service.js';
import { RankingLogic } from '../domain/analysis/ranking.logic.js';
import NodeCache from 'node-cache';


const router = Router();
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const getCurrentMonthSuffix = () => {
  const now = new Date();
  return `_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * GET /summary
 * 🏛️ ARQUITETO: Vitrine Global Turbo
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).send();

    const cacheKey = 'summary_GLOBAL_VITRINE';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const monthSuffix = getCurrentMonthSuffix();
    const snapshot = await db.collection(SDR_MONTHLY_STATS_COLLECTION).get();
    
    const monthlyDocs = snapshot.docs
      .filter((doc: admin.firestore.QueryDocumentSnapshot) => doc.id.endsWith(monthSuffix))
      .map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data());

    const processed = RankingLogic.calculateBayesianRanking(monthlyDocs);

    const response = {
      total_calls: processed.total_calls,
      media_geral: Number(processed.media_geral.toFixed(2)),
      sdr_ranking: processed.ranking, 
      version: "V12_GLOBAL_VITRINE"
    };

    cache.set(cacheKey, response, 300);
    return res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Erro na vitrine" });
  }
});

/**
 * GET /performance
 */
router.get("/performance", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autorizado" });

    const { startDate, endDate, ownerEmail, rota } = req.query;
    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);

    let query: FirebaseFirestore.Query = db.collection(CALLS_COLLECTION);

    if (!isAdmin) {
      query = query.where("ownerEmail", "==", userEmail);
    } else if (ownerEmail) {
      const targetEmail = (ownerEmail as string).toLowerCase().trim();
      if (targetEmail !== userEmail) {
        console.info("IMPERSONATION", {
          admin: userEmail,
          target: targetEmail,
          route: 'performance',
          timestamp: new Date().toISOString()
        });
      }
      query = query.where("ownerEmail", "==", targetEmail);
    }

    if (rota && rota !== 'ALL') query = query.where("rota", "==", rota);

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
        query = query.where("callTimestamp", ">=", admin.firestore.Timestamp.fromDate(start))
          .where("callTimestamp", "<=", admin.firestore.Timestamp.fromDate(end));
      }
    }

    const countSnapshot = await query.count().get();
    const snapshot = await query.orderBy("callTimestamp", "desc").limit(50).get();

    res.json({
      total: countSnapshot.data().count,
      data: snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao carregar métricas" });
  }
});

/**
 * GET /personal-summary
 */
router.get('/personal-summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ error: "Não autorizado" });
    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);
    const requestedEmail = (req.query.ownerEmail as string)?.toLowerCase().trim();
    
    let targetEmail = userEmail;
    let targetName = (req.query.ownerEmail as string) || "";

    if (isAdmin && requestedEmail) {
      targetEmail = requestedEmail;
      if (targetEmail !== userEmail) {
        console.info("IMPERSONATION", {
          admin: userEmail,
          target: targetEmail,
          route: 'personal-summary',
          timestamp: new Date().toISOString()
        });
      }
    } else if (!isAdmin) {
      targetEmail = userEmail;
      targetName = ""; // Protege contra name spoofing
    }

    let query: FirebaseFirestore.Query = db.collection(CALLS_COLLECTION);
    if (targetEmail.includes('@') && targetEmail !== "") {
      query = query.where("ownerEmail", "==", targetEmail);
    } else {
      query = query.where("ownerName", "==", targetName);
    }

    const snapshot = await query.orderBy("callTimestamp", "desc").limit(15).get();
    if (snapshot.empty) return res.json({ gaps: [], insights: [], totalAnalisadas: 0 });

    const gapMap: Record<string, { text: string, count: number }> = {};
    const insightMap: Record<string, { text: string, count: number }> = {};

    snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const c = doc.data();
      const rawGaps = (Array.isArray(c.alertas) && c.alertas.length > 0) ? c.alertas : (c.ponto_atencao ? [c.ponto_atencao] : []);
      rawGaps.forEach((g: string) => {
        if (!g || g.length < 5) return;
        const key = g.split(' ').slice(0, 4).join(' ').toLowerCase().replace(/[^\w\s]/gi, '');
        if (!gapMap[key]) gapMap[key] = { text: g, count: 0 };
        gapMap[key].count++;
      });
      if (Array.isArray(c.pontos_fortes)) {
        c.pontos_fortes.forEach((i: string) => {
          if (!i || i.length < 5) return;
          const key = i.split(' ').slice(0, 4).join(' ').toLowerCase().replace(/[^\w\s]/gi, '');
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

/**
 * GET /leaderboard-vitrine
 */
router.get('/leaderboard-vitrine', async (req: Request, res: Response) => {
  try {
    const sdrSnapshot = await db
      .collection(SDR_MONTHLY_STATS_COLLECTION)
      .orderBy('averageScore', 'desc')
      .limit(6)
      .get();
    
    const topCallsSnapshot = await db
      .collection(CALLS_COLLECTION)
      .orderBy("nota_spin", "desc")
      .limit(10) 
      .get();

    const topCalls = topCallsSnapshot.docs
      .map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      .filter((c: any) => c.processingStatus === "DONE" && Number(c.nota_spin) >= 7);

    return res.json({
      top6: sdrSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
      topCalls: topCalls
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao carregar vitrine" });
  }
});

/**
 * GET /audit
 */
router.get("/audit", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { date, ownerEmail } = req.query;
    const parsedDate = date ? new Date(date as string) : new Date();
    const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const start = new Date(safeDate); start.setHours(0, 0, 0, 0);
    const end = new Date(safeDate); end.setHours(23, 59, 59, 999);

    let query = db
      .collection(CALLS_COLLECTION)
      .where("callTimestamp", ">=", admin.firestore.Timestamp.fromDate(start))
      .where("callTimestamp", "<=", admin.firestore.Timestamp.fromDate(end));

    if (ownerEmail) query = query.where("ownerEmail", "==", (ownerEmail as string).toLowerCase().trim());

    const snapshot = await query.get();
    const stats = { DONE: 0, ERROR: 0, PENDING_AUDIO: 0, QUEUED: 0, SKIPPED: 0, OTHER: 0 };
    const by_reason: Record<string, number> = {};

    const calls = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
      const d = doc.data();
      const status = (d.processingStatus || 'OTHER') as keyof typeof stats;

      if (stats.hasOwnProperty(status)) stats[status]++;
      else stats.OTHER++;

      const r = d.reason || d.failureReason;
      if (r) by_reason[r] = (by_reason[r] || 0) + 1;

      return {
        id: doc.id,
        t: d.title || "S/T",
        s: status,
        o: d.ownerName || "Desconhecido",
        d: d.durationMs ? Math.round(d.durationMs / 1000) + 's' : '0s'
      };
    });

    res.json({ total: snapshot.size, stats, by_reason, calls });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /rebuild-today-stats
 */
router.post("/rebuild-today-stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const snapshot = await db
      .collection(CALLS_COLLECTION)
      .where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .get();

    for (const doc of snapshot.docs) {
      const callData = doc.data();
      await updateDailyStats(
        callData,
        { status_final: 'NAO_SE_APLICA' as AnalysisStatus, nota_spin: null },
        { isUpdate: false }
      );
      if (callData.processingStatus === 'DONE') {
        await updateDailyStats(callData, callData as any, { isUpdate: true });
      }
    }

    res.json({ success: true, processed: snapshot.size });
  } catch (error: any) {
    res.status(500).json({ error: "Falha na reconstrução" });
  }
});

/**
 * GET /stats
 * 🏛️ ARQUITETO: Conexão com MetricsService para Squads
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { team, period } = req.query;
    const teamStr = team as string;

    if (teamStr === 'Todos os squads' || teamStr === 'all' || !teamStr) {
      const statsDoc = await db.collection('dashboard_stats').doc('global_summary').get();
      return res.json(statsDoc.data() || {});
    }

    // Busca chamadas do time via MetricsService (lógica de chunking/sdr_registry)
    const calls = await MetricsService.getStatsByTeam(teamStr);
    
    if (calls.length === 0) {
      return res.json({ total_calls: 0, media_geral: 0, taxa_aprovacao: 0, duracao_media: 0 });
    }

    // Agregação de KPIs
    let totalSpin = 0;
    let approvedCount = 0;
    let totalDuration = 0;

    calls.forEach((c: any) => {
      totalSpin += c.nota_spin || 0;
      if ((c.nota_spin || 0) >= 7) approvedCount++;
      totalDuration += c.durationMs || 0;
    });

    const stats = {
      total_calls: calls.length,
      media_geral: Number((totalSpin / calls.length).toFixed(2)),
      taxa_aprovacao: Math.round((approvedCount / calls.length) * 100),
      duracao_media: Math.round(totalDuration / calls.length)
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Erro em GET /stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;