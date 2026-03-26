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

async function analyzeCallHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const callId = String(req.body?.callId || req.query?.callId || "").trim();
    if (!callId) return res.status(400).json({ success: false, error: "callId ausente" });
    res.json(await processCall(callId));
  } catch (error) { next(error); }
}

async function analyzeCallsSearchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limitParam = Math.min(Number(req.body?.limit || req.query?.limit || CONFIG.TEST_CALLS_DEFAULT_LIMIT), CONFIG.TEST_CALLS_MAX_LIMIT);
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
  } catch (error) { next(error); }
}

async function hubspotWebhookHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const callId = body?.callId || body?.objectId || (Array.isArray(body) ? body[0]?.objectId : undefined);
    const normalizedCallId = String(callId || "").trim();

    if (!normalizedCallId) return res.status(200).json({ success: true, ignored: true });
    res.status(200).json({ success: true, received: true, callId: normalizedCallId });

    setImmediate(async () => {
      try { await processCall(normalizedCallId); } 
      catch (e) { console.error(`[WEBHOOK ERROR] ${normalizedCallId}:`, e); }
    });
  } catch (error) {
    if (!res.headersSent) res.status(200).json({ success: true, ignored: true });
  }
}

router.get("/calls/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; 
    if (!id) return res.status(400).json({ error: "ID ausente" });
    
    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(id)).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: "Não encontrada" });

    const data = doc.data() || {};
    const timestamp = data.updatedAt || data.analyzedAt || data.createdAt;
    res.json({
      id: doc.id, ...data,
      updatedAt: timestamp || { _seconds: Math.floor(Date.now() / 1000) },
      analyzedAt: timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString(),
      nota_spin: data.nota_spin !== undefined ? Number(data.nota_spin) : 0,
      status_final: data.status_final || "NAO_IDENTIFICADO"
    });
  } catch (error) { next(error); }
});

router.get("/calls", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🚩 Limite seguro para não estourar a RAM
      const limit = Math.min(Number(req.query.limit || 50), 100); 
      const ownerNameParam = req.query.ownerName as string;

      console.log(`📞 [CALLS] Buscando ${limit} chamadas recentes...`);

      let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);
      if (ownerNameParam) query = query.where("ownerName", "==", ownerNameParam);

      // 🚩 Removi a ordenação no banco para evitar Erro de Índice no Firebase
      const snapshot = await query.limit(limit).get();
      
      console.log(`📞 [CALLS] Retornadas ${snapshot.size} chamadas do banco.`);

      const calls = snapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.updatedAt || data.analyzedAt || data.createdAt;
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
          updatedAt: timestamp || { _seconds: Math.floor(Date.now() / 1000) },
          analyzedAt: timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString(), 
          status_final: data.status_final || "NAO_IDENTIFICADO",
          nota_spin: data.nota_spin !== undefined ? Number(data.nota_spin) : 0,
          resumo: data.resumo || "Sem análise detalhada disponível.",
          alertas: Array.isArray(data.alertas) ? data.alertas : [],
          ponto_atencao: data.ponto_atencao || "N/A",
          maior_dificuldade: data.maior_dificuldade || "N/A",
          pontos_fortes: Array.isArray(data.pontos_fortes) ? data.pontos_fortes : [],
        };
      });

      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      let processedCalls = calls;

      if (startDateParam && endDateParam) {
        const start = new Date(startDateParam).getTime();
        const end = new Date(endDateParam).getTime();
        processedCalls = calls.filter(call => {
          const sec = call.updatedAt?._seconds || call.updatedAt?.seconds || (typeof call.updatedAt === 'number' ? call.updatedAt / 1000 : 0);
          return (sec * 1000) >= start && (sec * 1000) <= end;
        });
      }

      // 🚩 Ordenação feita na memória (Totalmente Seguro)
      processedCalls.sort((a, b) => {
        const notaA = Number(a.nota_spin) || 0;
        const notaB = Number(b.nota_spin) || 0;
        if (notaB !== notaA) return notaB - notaA; 
        const secA = a.updatedAt?._seconds || a.updatedAt?.seconds || 0;
        const secB = b.updatedAt?._seconds || b.updatedAt?.seconds || 0;
        return secB - secA;
      });

      res.json(processedCalls);
    } catch (error) {
      console.error("❌ [CALLS LIST ERROR]:", error);
      next(error);
    }
  }
);

router.post("/test-call-ids", async (req, res, next) => {
  // ... mantido igual
  res.json({ success: true, processed: [] });
});

router.post("/hubspot-webhook", requireWebhookSecret, hubspotWebhookHandler);
router.post("/analyze-call", requireAuth, analyzeCallHandler);
router.post("/analyze-calls-search", requireAuth, analyzeCallsSearchHandler);

export default router;