import { Router, Request, Response } from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { handleIncomingCall } from "../services/webhook.service.js";
import { checkIfAdmin } from "../utils/auth.js";
import { extractCallId } from '../utils/hubspot-parser.js';

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
    const minScore = req.query.minScore ? Number(req.query.minScore) : null;

    const limit = Math.min(Number(req.query.limit || 10), 50);
    const startAfter = req.query.lastVisible as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;

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
      query = query.where("rota", "==", rota);
    }

    if (minScore !== null && !isNaN(minScore)) {
      query = query.where("nota_spin", ">=", minScore);
    }

    if (mode === 'ranking') {
      query = query
        .where("nota_spin", ">=", 7.0)
        .orderBy("nota_spin", "desc")
        .limit(10);
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
    res.status(500).json({ error: error.message });
  }
});

// 2. DETALHE DA LIGAÇÃO
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ error: "Não autorizado" });

    const callId = req.params.id ? String(req.params.id).trim() : null;
    if (!callId || callId === 'undefined' || callId === 'null') return res.status(400).json({ error: "ID inválido." });

    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).get();
    if (!doc.exists) return res.status(404).json({ error: "Ligação não encontrada." });

    const callData = doc.data();
    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);

    const isOwner = callData?.ownerEmail === userEmail;
    const isEliteCall = (callData?.nota_spin || 0) >= 7.0;

    if (!isAdmin && !isOwner && !isEliteCall) {
      return res.status(403).json({ error: "Permissão negada. Esta ligação não é pública." });
    }

    res.json({ id: doc.id, ...callData });
  } catch (error: any) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// 3. WEBHOOK
router.post("/hubspot-webhook", async (req: Request, res: Response) => {
  try {
    const result = await handleIncomingCall(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Erro no webhook" });
  }
});

// 4. GATILHO MANUAL
router.post("/manual-trigger", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Não autorizado" });

    const { url } = req.body;

    // Valida presença do campo
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        uiState: 'INVALID_LINK',
        error: "Link inválido",
        message: "Nenhum link foi informado. Cole o link da chamada no HubSpot."
      });
    }

    const callId = extractCallId(url);

    if (!callId) {
      return res.status(400).json({
        uiState: 'INVALID_LINK',
        error: "Link inválido",
        message: "Não encontramos um ID de ligação. Certifique-se de copiar o link correto da chamada no HubSpot."
      });
    }

    const callRef = db.collection(CONFIG.CALLS_COLLECTION).doc(callId);
    const doc = await callRef.get();
    const currentStatus = doc.data()?.processingStatus;

    // Já concluída — não precisa de ação
    if (doc.exists && currentStatus === 'DONE') {
      return res.json({
        uiState: 'ALREADY_DONE',
        success: true,
        callId,
        message: "Esta ligação já foi analisada e está disponível no histórico."
      });
    }

    // Já está em fila ou processando — evita duplicata desnecessária
    if (doc.exists && (currentStatus === 'PENDING_AUDIO' || currentStatus === 'PROCESSING' || currentStatus === 'QUEUED')) {
      return res.json({
        uiState: 'ALREADY_QUEUED',
        success: true,
        callId,
        message: "Esta ligação já está na fila de análise. Aguarde alguns instantes."
      });
    }

    const userEmail = (req.user as { email: string }).email;

    await callRef.set({
      id: callId,
      callId: callId,
      processingStatus: 'PENDING_AUDIO',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      manualTriggerBy: userEmail,
      ...(doc.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() })
    }, { merge: true });

    console.log(`🚀 [MANUAL] Chamada ${callId} enfileirada por ${userEmail}`);
    res.json({
      uiState: 'QUEUED',
      success: true,
      callId,
      message: "Ligação recebida! A análise foi iniciada e estará disponível em breve no histórico."
    });

  } catch (error: any) {
    console.error("💥 [MANUAL TRIGGER ERROR]:", error.message);
    res.status(500).json({
      uiState: 'SERVER_ERROR',
      error: "Erro ao processar gatilho manual.",
      message: "Ocorreu um erro interno. Tente novamente em alguns segundos."
    });
  }
});

export default router;