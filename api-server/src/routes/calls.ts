import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { firestore } from "firebase-admin"; // <-- Importação necessária para o Timestamp
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

// --- ROTA DE DETALHE ÚNICO ---
router.get("/calls/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; 
    
    if (!id) return res.status(400).json({ error: "ID ausente" });

    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(id)).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: "Análise não encontrada no banco" });
    }

    const data = doc.data() || {};
    const timestamp = data.updatedAt || data.analyzedAt || data.createdAt;
    const isoDate = timestamp && typeof timestamp.toDate === 'function' 
      ? timestamp.toDate().toISOString() 
      : new Date().toISOString();

    res.json({
      id: doc.id,
      ...data,
      updatedAt: data.updatedAt || data.analyzedAt || data.createdAt || { _seconds: Math.floor(Date.now() / 1000) },
      analyzedAt: isoDate,
      nota_spin: data.nota_spin !== undefined ? Number(data.nota_spin) : 0,
      status_final: data.status_final || "NAO_IDENTIFICADO"
    });
  } catch (error) {
    next(error);
  }
});

// --- ROTA DE LISTAGEM OTIMIZADA ---
router.get(
  "/calls",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Limite sensato para paginação/feed (ex: 100)
      const limit = Math.min(Number(req.query.limit || 100), 100); 
      const ownerNameParam = req.query.ownerName as string;
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;

      let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

      // Filtro de Owner
      if (ownerNameParam) {
        query = query.where("ownerName", "==", ownerNameParam);
      }

      // Filtro de Data e Ordenação na BD
      if (startDateParam && endDateParam) {
        const startTimestamp = firestore.Timestamp.fromDate(new Date(startDateParam));
        const endTimestamp = firestore.Timestamp.fromDate(new Date(endDateParam));
        
        query = query
          .where("analyzedAt", ">=", startTimestamp)
          .where("analyzedAt", "<=", endTimestamp);
      }

      // IMPORTANTE: Se fizermos um range filter (>=, <=) em "analyzedAt", 
      // o Firestore exige que a primeira ordenação seja no mesmo campo.
      query = query.orderBy("analyzedAt", "desc").limit(limit);

      const snapshot = await query.get();

      const calls = snapshot.docs.map((doc) => {
        const data = doc.data();
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

      // (Opcional) Mantemos um sort em memória APENAS nos 100 documentos retornados
      // para garantir que as melhores notas apareçam primeiro no topo dessa página específica.
      calls.sort((a, b) => {
        const notaA = Number(a.nota_spin) || 0;
        const notaB = Number(b.nota_spin) || 0;
        if (notaB !== notaA) return notaB - notaA; 
        return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime();
      });

      res.json(calls);
    } catch (error) {
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

export default router;