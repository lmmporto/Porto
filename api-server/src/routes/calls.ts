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
  [key: string]: any;
}

// --- MIDDLEWARES DE SEGURANÇA ---
function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const providedSecret = req.headers["x-webhook-secret"] || req.query.secret || "";
  const expectedSecret = process.env.WEBHOOK_SECRET || "";
  if (String(providedSecret) !== String(expectedSecret)) {
    return res.status(401).json({ success: false, error: "Não autorizado" });
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ success: false, error: "Não autenticado" });
}

// --- ROTAS ---

// 1. LISTAGEM COM FILTRO E PAGINAÇÃO
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit || 10), 50); 
      const startAfter = req.query.lastVisible as string; 
      const minScore = Number(req.query.minScore);        
      const ownerNameParam = req.query.ownerName as string; 
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      const sort = req.query.sort as string; // 🚩 NOVO: Parâmetro de ordenação

      let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);
      
      // FILTRO POR NOME (Direto no Banco)
      if (ownerNameParam) {
        query = query.where("ownerName", "==", ownerNameParam);
      }

      // FILTRO POR NOTA (Direto no Banco)
      if (!isNaN(minScore) && minScore > 0) {
        query = query.where("nota_spin", ">=", minScore);
      }

      // FILTRO POR DATA
      if (startDateParam && endDateParam) {
        const start = new Date(startDateParam);
        const end = new Date(endDateParam);
        query = query.where("updatedAt", ">=", admin.firestore.Timestamp.fromDate(start))
                     .where("updatedAt", "<=", admin.firestore.Timestamp.fromDate(end));
      }

      // 🚩 NOVO: Ordenação por Nota ou por Data
      if (sort === 'score_desc') {
        query = query.orderBy("nota_spin", "desc");
      } else if (sort === 'score_asc') {
        query = query.orderBy("nota_spin", "asc");
      } else {
        // Se não escolher nada, mostra as mais novas primeiro
        query = query.orderBy("updatedAt", "desc");
      }
      
      if (startAfter) {
        const lastDoc = await db.collection(CONFIG.CALLS_COLLECTION).doc(startAfter).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.limit(limit).get();
      console.log(`🔎 [QUERY] SDR: ${ownerNameParam} | Encontrados: ${snapshot.size} documentos`);
      
      const calls = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        nota_spin: Number(doc.data().nota_spin || 0),
      }));

      res.json({
        calls,
        lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
      });

    } catch (error: any) {
      console.error("ERRO NA BUSCA:", error.message);
      next(error);
    }
});

// 2. DETALHE DE UMA LIGAÇÃO
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; 
    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(id)).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: "Não encontrada" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) { next(error); }
});

// 3. ENTRADA DE DADOS (WEBHOOK)
router.post("/hubspot-webhook", requireWebhookSecret, hubspotWebhookHandler);

// 4. DISPARO MANUAL DE ANÁLISE
router.post("/analyze-call", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callId = String(req.body?.callId || req.query?.callId || "").trim();
    if (!callId) return res.status(400).json({ success: false, error: "ID ausente" });
    res.json(await processCall(callId));
  } catch (error) { next(error); }
});

async function hubspotWebhookHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const callId = body?.callId || body?.objectId || (Array.isArray(body) ? body[0]?.objectId : undefined);
    if (!callId) return res.status(200).json({ success: true, ignored: true });
    const result = await handleIncomingCall({ ...body, callId: String(callId).trim() });
    res.status(202).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro no webhook" });
  }
}

export default router;