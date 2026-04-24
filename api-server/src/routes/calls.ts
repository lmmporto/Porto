import { Router, Request, Response } from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { handleIncomingCall } from "../services/webhook.service.js";
import { checkIfAdmin } from "../utils/auth.js";
import { extractCallId } from '../utils/hubspot-parser.js';
import { CallStatus } from "../domain/analysis/analysis.types.js";

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
    const team = req.query.team as string; // Novo: Suporte a times
    const filterEmail = (req.query.ownerEmail as string || "").toLowerCase().trim();
    const minScore = req.query.minScore ? Number(req.query.minScore) : null;

    const limit = Math.min(Number(req.query.limit || 10), 50);
    const startAfter = req.query.lastVisible as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    // 🛡️ LÓGICA DE SOBERANIA E ACESSO
    if (isAdmin) {
      if (filterEmail) {
        // Impersonate SDR específico
        query = query.where("ownerEmail", "==", filterEmail);
        console.info("IMPERSONATION", { admin: userEmail, target: filterEmail, route: 'list_calls' });
      } else if (team && team !== 'all' && team !== 'Todos os squads') {
        // Filtro por Time (Soberania do sdr_registry)
        const teamSnap = await db.collection('sdr_registry')
          .where('assignedTeam', '==', team)
          .where('isActive', '==', true)
          .get();
        
        const teamEmails = teamSnap.docs.map(d => d.data().email).filter(Boolean);
        
        if (teamEmails.length > 0) {
          // Firestore 'in' suporta até 30 itens. Se for maior, o ideal é não filtrar por email no banco e sim por timeName se existisse.
          // Como removemos teamName, usamos os emails. Se > 30, limitamos aos primeiros 30 para evitar erro de query.
          query = query.where("ownerEmail", "in", teamEmails.slice(0, 30));
        } else {
          // Time sem membros: retorna vazio
          return res.json({ calls: [], isAdmin, lastVisible: null });
        }
      } else {
        // Global: Não aplica filtro de ownerEmail para Admin
        console.log(`[ACCESS] Admin ${userEmail} acessando visão global.`);
      }
    } else {
      // Usuário comum: Vê apenas as próprias calls
      query = query.where("ownerEmail", "==", userEmail);
    }

    query = query.where("processingStatus", "==", CallStatus.DONE);

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

// 2. DETALHE DA LIGAÇÃO (COM TRAVA DE SEGURANÇA ELITE)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).send();

    const userEmail = (req.user as any).email.toLowerCase().trim();
    const isAdmin = await checkIfAdmin(userEmail);
    
    const callId = String(req.params.id);
    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).get();
    
    if (!doc.exists) return res.status(404).send();
    const data = doc.data()!;

    // 🚩 TRAVA DE SEGURANÇA: Só vê detalhes se for Admin, Dono ou Nota >= 7
    const isOwner = data.ownerEmail?.toLowerCase().trim() === userEmail;
    const isElite = Number(data.nota_spin || 0) >= 7;

    if (!isAdmin && !isOwner && !isElite) {
      return res.status(403).json({ error: "Acesso restrito a chamadas Elite (Nota 7+)" });
    }

    res.json({ id: doc.id, ...data });
  } catch (error) {
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

    if (doc.exists && currentStatus === CallStatus.DONE) {
      return res.json({
        uiState: 'ALREADY_DONE',
        success: true,
        callId,
        message: "Esta ligação já foi analisada e está disponível no histórico."
      });
    }

    if (doc.exists && (currentStatus === CallStatus.PENDING_AUDIO || currentStatus === CallStatus.PROCESSING || currentStatus === CallStatus.QUEUED)) {
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
      processingStatus: CallStatus.QUEUED,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      manualTriggerBy: userEmail,
      ...(doc.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() })
    }, { merge: true });

    res.json({
      uiState: 'QUEUED',
      success: true,
      callId,
      message: "Ligação recebida! A análise foi iniciada e estará disponível em breve no histórico."
    });

  } catch (error: any) {
    res.status(500).json({
      uiState: 'SERVER_ERROR',
      error: "Erro ao processar gatilho manual.",
      message: "Ocorreu um erro interno. Tente novamente em alguns segundos."
    });
  }
});

export default router;