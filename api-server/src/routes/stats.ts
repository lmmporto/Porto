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

// Função auxiliar para saber se é Admin
async function checkIfAdmin(email: string) {
  try {
    const doc = await db.collection("configuracoes").doc("gerais").get();
    const admins = doc.data()?.admins || [];
    return admins.includes(email);
  } catch {
    return false;
  }
}

/**
 * GET /summary (Relativo ao prefixo /api/stats)
 * Retorna o resumo de performance extraído do Placar Consolidado (sdr_stats).
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);

    const now = Date.now();
    
    if (isAdmin && cachedStats && (now - lastCacheTime < 60000)) {
      console.log(`📊 [STATS] Retornando resumo de performance do CACHE (Admin).`);
      return res.json(cachedStats);
    }

    console.log(`📊 [STATS] Buscando resumo de performance do FIRESTORE para: ${userEmail}`);

    let query: FirebaseFirestore.Query = db.collection('sdr_stats');

    if (!isAdmin) {
      const targetEmail = userEmail.toLowerCase().trim();
      console.log(`🔎 [DEBUG] Buscando estatísticas para e-mail normalizado: "${targetEmail}"`);
      query = query.where("ownerEmail", "==", targetEmail);
    }

    const snapshot = await query.get();

    const sdr_ranking: Record<string, any> = {};
    let total_calls = 0;
    let sum_notes = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.ownerEmail && data.ownerEmail.includes('@')) {
        const name = data.ownerName || "SDR Desconhecido";
        const email = data.ownerEmail;
        
        sdr_ranking[name] = {
          ownerName: name,
          ownerEmail: email,
          calls: data.totalCalls || 0,
          valid_calls: data.totalCalls || 0,
          sum_notes: data.totalScore || 0,
          nota_media: data.averageScore || 0
        };

        total_calls += Number(data.totalCalls || 0);
        sum_notes += Number(data.totalScore || 0);
      }
    });

    const sdrNames = Object.keys(sdr_ranking);
    const totalSDRs = sdrNames.length || 1;

    const v_bar = total_calls / totalSDRs; 
    const m_bar = total_calls > 0 ? (sum_notes / total_calls) : 0; 

    sdrNames.forEach(name => {
      const s = sdr_ranking[name];
      const V = s.calls;
      const M = s.valid_calls > 0 ? (s.sum_notes / s.valid_calls) : 0;

      if (V > 0) {
        const qualidade = (V * M + v_bar * m_bar) / (V + v_bar);
        const tracao = Math.sqrt(V / (v_bar || 1));
        s.nota_media = Number((qualidade * tracao).toFixed(1));
      } else {
        s.nota_media = 0;
      }
    });

    const resultado = {
      total_calls,
      valid_calls: total_calls,
      sum_notes,
      media_geral: total_calls > 0 ? Number((sum_notes / total_calls).toFixed(2)) : 0,
      sdr_ranking: sdr_ranking,
      version: "V6_TURBO_SCORE_DYNAMIC_SECURE_NO_ORDER"
    };

    if (isAdmin) {
      cachedStats = resultado;
      lastCacheTime = now;
    }

    return res.json(resultado);

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message);
    return res.status(500).json({ error: "Erro interno no processamento de estatísticas" });
  }
});

/**
 * GET /personal-summary
 * Retorna insights qualitativos baseados nas últimas chamadas.
 * Suporta ownerEmail via query para Admins.
 */
router.get('/personal-summary', async (req: Request, res: Response) => {
  try {
    // 🚩 SEGURANÇA: Bloqueia acesso não autenticado
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    // 1. Normalização rigorosa
    const rawEmail = (req.query.ownerEmail as string) || (req.user as any).email || "";
    const targetEmail = rawEmail.toLowerCase().trim();
    
    console.log(`🔎 [DEBUG] Buscando insights para: "${targetEmail}"`);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    // 2. Filtro resiliente
    if (targetEmail.includes('@')) {
      query = query.where("ownerEmail", "==", targetEmail);
    } else {
      query = query.where("ownerName", "==", rawEmail);
    }

    // 3. Execução da Query
    const snapshot = await query.orderBy("callTimestamp", "desc").limit(50).get();

    if (snapshot.empty) {
      console.log(`⚠️ [DEBUG DASHBOARD] Nenhum documento encontrado para: ${targetEmail}`);
      return res.json({ gaps: [], insights: [], totalAnalisadas: 0 });
    }

    const gapMap: Record<string, { text: string, count: number }> = {};
    const insightMap: Record<string, { text: string, count: number }> = {};

    snapshot.docs.forEach((doc) => {
      const c = doc.data();
      
      // Captura Gaps (Alertas ou Ponto de Atenção)
      const rawGaps = (Array.isArray(c.alertas) && c.alertas.length > 0) 
        ? c.alertas 
        : (c.ponto_atencao ? [c.ponto_atencao] : []);

      rawGaps.forEach((g: string) => {
        if (!g || g.length < 5) return;
        const key = g.split(' ').slice(0, 5).join(' ').toLowerCase().replace(/[^\w\s]/gi, '');
        if (!gapMap[key]) gapMap[key] = { text: g, count: 0 };
        gapMap[key].count++;
      });

      // Captura Insights (Pontos Fortes)
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
    console.error("❌ [PERSONAL SUMMARY ERROR]:", error);
    res.status(500).json({ error: "Erro ao processar insights" });
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
      const sdrIdentifier = callData.ownerEmail || callData.ownerName || "Desconhecido";
      
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