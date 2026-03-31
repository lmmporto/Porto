import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { processCall } from "../services/processCall.js";

const router: IRouter = Router();

// --- MIDDLEWARES DE SEGURANÇA ---

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

// --- HANDLERS DE PROCESSAMENTO ---

/**
 * 🚩 RESTAURADO: Handler real do Webhook
 * Sem isso, sua IA para de trabalhar sozinha.
 */
async function hubspotWebhookHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const callId = body?.callId || body?.objectId || (Array.isArray(body) ? body[0]?.objectId : undefined);
    const normalizedCallId = String(callId || "").trim();

    if (!normalizedCallId) return res.status(200).json({ success: true, ignored: true });

    // Responde rápido pro HubSpot não dar timeout
    res.status(200).json({ success: true, received: true, callId: normalizedCallId });

    // Processa em background
    setImmediate(async () => {
      try { 
        console.log(`🚀 [WEBHOOK] Disparando análise para: ${normalizedCallId}`);
        await processCall(normalizedCallId); 
      } 
      catch (e) { console.error(`[WEBHOOK ERROR] ${normalizedCallId}:`, e); }
    });
  } catch (error) {
    if (!res.headersSent) res.status(200).json({ success: true, ignored: true });
  }
}

async function analyzeCallHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const callId = String(req.body?.callId || req.query?.callId || "").trim();
    if (!callId) return res.status(400).json({ success: false, error: "callId ausente" });
    res.json(await processCall(callId));
  } catch (error) { next(error); }
}

// --- ROTAS ---

// 🚩 Rota de Listagem com ORDENAÇÃO NO BANCO
router.get("/calls", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit || 50), 100); 
      const ownerNameParam = req.query.ownerName as string;
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      const sortParam = req.query.sort as string; 

      console.log(`📞 [CALLS] Buscando chamadas (Sort: ${sortParam || 'recent'})...`);

      let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);
      
      if (ownerNameParam) {
        query = query.where("ownerName", "==", ownerNameParam);
      }

      if (startDateParam && endDateParam) {
        const start = new Date(startDateParam);
        const end = new Date(endDateParam);
        if (startDateParam.length === 10) {
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(23, 59, 59, 999);
        }
        query = query
            .where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(start))
            .where("updatedAt", "<=", admin.firestore.Timestamp.fromDate(end));
      }

      // 🚩 LÓGICA DE ORDENAÇÃO SÊNIOR
      // Nota: Isso exige índices compostos no Firebase. 
      // Se der erro, clique no link que aparecerá no log do Render.
      if (sortParam === 'score_desc') {
        query = query.orderBy("nota_spin", "desc").orderBy("updatedAt", "desc");
      } else if (sortParam === 'score_asc') {
        query = query.orderBy("nota_spin", "asc").orderBy("updatedAt", "desc");
      } else {
        query = query.orderBy("updatedAt", "desc");
      }

      const snapshot = await query.limit(limit).get();
      
      const calls = snapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.updatedAt || data.analyzedAt || data.createdAt;
        return {
          id: doc.id,
          ...data,
          updatedAt: timestamp,
          nota_spin: data.nota_spin !== undefined ? Number(data.nota_spin) : 0,
        };
      });

      res.json(calls);
    } catch (error: any) {
      console.error("❌ [CALLS LIST ERROR]:", error.message);
      next(error);
    }
  }
);

router.get("/calls/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; 
    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(id)).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: "Não encontrada" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) { next(error); }
});

router.post("/hubspot-webhook", requireWebhookSecret, hubspotWebhookHandler);
router.post("/analyze-call", requireAuth, analyzeCallHandler);

export default router;