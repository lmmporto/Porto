import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { processCall } from "../services/processCall.js";
import { searchCallsInHubSpot } from "../services/hubspot.js";

const router: IRouter = Router();

// --- MIDDLEWARES ---

function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const headerSecret = req.headers["x-webhook-secret"];
  const querySecret = req.query.secret;

  const providedSecret = (Array.isArray(headerSecret) ? headerSecret[0] : headerSecret) || 
                         (Array.isArray(querySecret) ? querySecret[0] : querySecret) || "";
  
  const expectedSecret = process.env.WEBHOOK_SECRET || "";

  if (String(providedSecret) !== String(expectedSecret)) {
    res.status(401).json({ success: false, error: "Webhook não autorizado" });
    return;
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ success: false, error: "Não autenticado" });
}

// --- HANDLERS ---

async function analyzeCallHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rawCallId = req.body?.callId || req.query?.callId;
    const callId = String(rawCallId || "").trim();
    if (!callId) {
      res.status(400).json({ success: false, error: "callId não informado" });
      return;
    }
    const result = await processCall(callId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function analyzeCallsSearchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limitParam = Math.min(
      Number(req.body?.limit || req.query?.limit || CONFIG.TEST_CALLS_DEFAULT_LIMIT), 
      CONFIG.TEST_CALLS_MAX_LIMIT
    );
    const results = await searchCallsInHubSpot({ limit: limitParam });
    const processResults = [];

    for (const item of results) {
      try {
        const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(item.id)).get();
        if (doc.exists && doc.data()?.processingStatus === "DONE") continue;
        processResults.push(await processCall(String(item.id)));
      } catch (error) {
        processResults.push({ callId: item.id, success: false, error: String(error) });
      }
    }
    res.json({ success: true, processed: processResults });
  } catch (error) {
    next(error);
  }
}

async function hubspotWebhookHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const callId = body?.callId || body?.objectId || (Array.isArray(body) ? body[0]?.objectId : undefined);
    const normalizedCallId = String(callId || "").trim();

    if (!normalizedCallId) {
      res.status(200).json({ success: true, ignored: true });
      return;
    }

    res.status(200).json({ success: true, received: true, callId: normalizedCallId });

    setImmediate(async () => {
      try {
        await processCall(normalizedCallId);
      } catch (e) {
        console.error(`[WEBHOOK ERROR] ${normalizedCallId}:`, e);
      }
    });
  } catch (error) {
    if (!res.headersSent) res.status(200).json({ success: true, ignored: true });
  }
}

// --- ROTA PRINCIPAL (GET /calls) ---

router.get(
  "/calls",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit || 3000), 5000);

      // 🚩 PONTO DE ATENÇÃO: Sem .orderBy no banco para evitar que documentos incompletos sumam
      const snapshot = await db
        .collection(CONFIG.CALLS_COLLECTION)
        .limit(limit)
        .get();

      const calls = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        // 🚩 LÓGICA DE DATA: Fallback em cascata para garantir que sempre haja um timestamp
        const timestamp = data.updatedAt || data.analyzedAt || data.createdAt;
        const isoDate = timestamp && typeof timestamp.toDate === 'function' 
          ? timestamp.toDate().toISOString() 
          : new Date().toISOString();

        return {
          id: doc.id,
          callId: data.callId || doc.id,
          title: data.title || "Ligação sem título",
          ownerName: data.ownerName || "Owner não identificado",
          ownerId: data.ownerId || null,
          ownerUserId: data.ownerUserId || null,
          teamId: data.teamId || null,
          teamName: data.teamName || "Sem equipe",
          durationMs: Number(data.durationMs || 0),
          recordingUrl: data.recordingUrl || null,
          processingStatus: data.processingStatus || "UNKNOWN",
          
          // 🚩 Fallback para o filtro de tempo do Front-end (evita 1970/sumiço)
          updatedAt: data.updatedAt || data.analyzedAt || data.createdAt || { _seconds: Math.floor(Date.now() / 1000) },
          
          analyzedAt: isoDate, 
          status_final: data.status_final || "NAO_IDENTIFICADO",
          nota_spin: data.nota_spin !== undefined ? Number(data.nota_spin) : 0,
          
          resumo: data.resumo || "Sem análise detalhada disponível.",
          alertas: Array.isArray(data.alertas) ? data.alertas : [],
          ponto_atencao: data.ponto_atencao || "N/A",
          maior_dificuldade: data.maior_dificuldade || "N/A",
          pontos_fortes: Array.isArray(data.pontos_fortes) ? data.pontos_fortes : [],
        };
      });

      // 🚩 ORDENAÇÃO MANUAL: Garantia de recentes no topo
      calls.sort((a, b) => {
        const secA = a.updatedAt?._seconds || a.updatedAt?.seconds || 0;
        const secB = b.updatedAt?._seconds || b.updatedAt?.seconds || 0;
        return secB - secA;
      });

      res.json(calls);
    } catch (error) {
      console.error("Erro na API /calls:", error);
      next(error);
    }
  },
);

router.post("/test-call-ids", async (req, res, next) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Campo "ids" deve ser um array não vazio.' });
    }
    const results = [];
    for (const id of ids) {
      try {
        const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(id)).get();
        if (doc.exists && doc.data()?.processingStatus === "DONE") {
          results.push({ callId: id, skipped: true, reason: "JA_PROCESSADO" });
          continue;
        }
        results.push(await processCall(String(id)));
      } catch (error) {
        results.push({ callId: id, success: false, error: String(error) });
      }
    }
    res.json({ success: true, processed: results });
  } catch (error) {
    next(error);
  }
});

router.post("/hubspot-webhook", requireWebhookSecret, hubspotWebhookHandler);
router.post("/analyze-call", requireAuth, analyzeCallHandler);
router.post("/analyze-calls-search", requireAuth, analyzeCallsSearchHandler);
// 🔍 ROTA DE AUDITORIA: Acesse /api/debug/sdr-stats para validar os números
router.get("/debug/sdr-stats", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION).get();
    const stats: Record<string, any> = {};
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.ownerName || "SDR_DESCONHECIDO";
      
      const ts = data.updatedAt?._seconds || data.analyzedAt?._seconds || data.createdAt?._seconds || 0;
      const callTimeMs = ts * 1000;
      const isToday = callTimeMs >= startOfToday;

      if (!stats[name]) {
        stats[name] = { total_geral_no_banco: 0, tentativas_hoje: 0, analises_com_sucesso: 0, analises_puladas: 0 };
      }

      stats[name].total_geral_no_banco += 1;
      if (isToday) stats[name].tentativas_hoje += 1;
      if (data.processingStatus === "DONE") stats[name].analises_com_sucesso += 1;
      else if (data.processingStatus === "SKIPPED_FOR_AUDIT") stats[name].analises_puladas += 1;
    });

    res.json({
      timestamp_consulta: now.toLocaleString('pt-BR'),
      sdr_metrics: stats
    });
  } catch (error) {
    res.status(500).json({ error: "Falha na auditoria", details: String(error) });
  }
});
export default router;