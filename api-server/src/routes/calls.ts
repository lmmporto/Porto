import { Router, type Request, type Response, type NextFunction } from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { processCall } from "../services/processCall.js";
import { handleIncomingCall } from "../services/webhook.service.js";

const router = Router();

// 1. LISTAGEM (Filtra direto no banco para não vir dado errado)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const ownerNameParam = req.query.ownerName as string;
    const startAfter = req.query.lastVisible as string;

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    // 🚩 FILTRO DIRETO NO BANCO (Evita misturar SDRs)
    if (ownerNameParam) {
      query = query.where("ownerName", "==", ownerNameParam);
    }

    query = query.orderBy("callTimestamp", "desc");

    if (startAfter) {
      const lastDoc = await db.collection(CONFIG.CALLS_COLLECTION).doc(startAfter).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(limit).get();
    const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      calls,
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
    });
  } catch (error) { next(error); }
});

// 2. DETALHE (Busca a ligação exata pelo ID)
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(String(id)).get();
    if (!doc.exists) return res.status(404).json({ error: "Não encontrada" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) { next(error); }
});

// 3. WEBHOOK E OUTROS
router.post("/hubspot-webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const callId = body?.callId || body?.objectId || (Array.isArray(body) ? body[0]?.objectId : undefined);
    
    if (!callId) return res.status(200).json({ ignored: true });
    
    const result = await handleIncomingCall({ ...body, callId: String(callId).trim() });
    res.status(202).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro no processamento do webhook" });
  }
});

export default router;