import { Router, Request, Response } from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { handleIncomingCall } from "../services/webhook.service.js";
import { checkIfAdmin } from "../utils/auth.js";

const router = Router();

// 1. LISTAGEM COM TRAVA DE SEGURANÇA E AUDITORIA
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);
    
    const mode = req.query.mode as string; 
    const rota = req.query.rota as string; 
    const filterEmail = (req.query.ownerEmail as string || "").toLowerCase().trim();
    
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const startAfter = req.query.lastVisible as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;

    console.log(`🔎 [BUSCA] User: ${userEmail} | Admin: ${isAdmin} | Mode: ${mode} | Rota: ${rota || 'ALL'}`);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    if (isAdmin || mode === 'ranking') {
      if (filterEmail) {
        query = query.where("ownerEmail", "==", filterEmail);
      } else if (!isAdmin) {
        query = query.where("ownerEmail", "==", userEmail);
      }
    } else {
      query = query.where("ownerEmail", "==", userEmail);
    }

    query = query.where("processingStatus", "==", "DONE");

    if (rota && rota !== 'ALL') {
      console.log(`🎯 [BACKEND] Aplicando filtro de Rota: ${rota}`);
      query = query.where("rota", "==", rota);
    }

    if (mode === 'ranking') {
      query = query.orderBy("nota_spin", "desc").limit(10); 
    } else {
      if (startDateParam && endDateParam) {
        const start = new Date(startDateParam);
        const end = new Date(endDateParam);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
        query = query.where("callTimestamp", ">=", admin.firestore.Timestamp.fromDate(start))
                     .where("callTimestamp", "<=", admin.firestore.Timestamp.fromDate(end));
      }

      query = query.orderBy("callTimestamp", "desc");

      if (startAfter) {
        const lastDoc = await db.collection(CONFIG.CALLS_COLLECTION).doc(startAfter).get();
        if (lastDoc.exists) query = query.startAfter(lastDoc);
      }

      query = query.limit(limit);
    }

    const snapshot = await query.get();
    const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      calls,
      isAdmin,
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
    });

  } catch (error: any) {
    console.error("❌ [BUSCA ERROR]:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. DETALHE DA LIGAÇÃO
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const callId = req.params.id ? String(req.params.id).trim() : null;
    if (!callId || callId === 'undefined' || callId === 'null') {
      return res.status(400).json({ error: "ID inválido." });
    }

    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).get();
    if (!doc.exists) return res.status(404).json({ error: "Ligação não encontrada." });

    const callData = doc.data();
    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);

    // 🏛️ O ARQUITETO: A Regra de Ouro da Vitrine
    const isOwner = callData?.ownerEmail === userEmail;
    const isEliteCall = (callData?.nota_spin || 0) >= 7.0;

    if (!isAdmin && !isOwner && !isEliteCall) {
      return res.status(403).json({ error: "Permissão negada. Esta ligação não é pública." });
    }

    res.json({ id: doc.id, ...callData });
  } catch (error: any) {
    console.error("❌ [DETAIL ERROR]:", error.message);
    res.status(500).json({ error: "Erro interno" });
  }
});

// 3. WEBHOOK
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