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
import { handleIncomingCall } from "../services/webhook.service.js";

const router: IRouter = Router();

// --- INTERFACES ---

interface CallDocument {
  id: string;
  ownerName?: string;
  nota_spin?: number;
  [key: string]: any; // Permite campos dinâmicos do Firestore
}

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

async function hubspotWebhookHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const callId = body?.callId || body?.objectId || (Array.isArray(body) ? body[0]?.objectId : undefined);
    
    if (!callId) return res.status(200).json({ success: true, ignored: true });

    const result = await handleIncomingCall({ ...body, callId: String(callId).trim() });
    
    res.status(202).json({ success: true, ...result });
  } catch (error) {
    console.error("[WEBHOOK ERROR]:", error);
    res.status(500).json({ success: false, error: "Falha na triagem" });
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

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit || 10), 50); 
      const startAfter = req.query.lastVisible as string; 
      const minScore = Number(req.query.minScore);        
      const ownerNameParam = req.query.ownerName as string; 
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;

      let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);
      
      // 1. Filtro de Data
      if (startDateParam && endDateParam) {
        const start = new Date(startDateParam);
        const end = new Date(endDateParam);
        query = query.where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(start))
                     .where("updatedAt", "<=", admin.firestore.Timestamp.fromDate(end));
      }

      // 2. Filtro de Nota
      if (!isNaN(minScore)) {
        query = query.where("nota_spin", ">=", minScore);
      }

      // 3. Ordenação e Paginação (Busca ampliada para permitir filtragem posterior)
      query = query.orderBy("updatedAt", "desc");
      
      if (startAfter) {
        const lastDoc = await db.collection(CONFIG.CALLS_COLLECTION).doc(startAfter).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      // Aumentamos o limite da query para 100 para ter margem de manobra com o filtro do SDR
      const snapshot = await query.limit(100).get(); 
      
      let calls: CallDocument[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        nota_spin: Number(doc.data().nota_spin || 0),
      }));

      // 🚩 FILTRO ROBUSTO PARA O SDR (Ajuste solicitado)
      if (ownerNameParam) {
        const cleanParam = decodeURIComponent(ownerNameParam).trim().toLowerCase();
        
        calls = calls.filter(call => {
          const callOwner = (call.ownerName || "").trim().toLowerCase();
          // 🚩 Troca do === pelo .includes() para ser mais permissivo
          return callOwner.includes(cleanParam); 
        });
      }

      // Retorna os dados e o ID do último pra usar na próxima página
      res.json({
        calls: calls.slice(0, limit),
        lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
      });

    } catch (error: any) {
      next(error);
    }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
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