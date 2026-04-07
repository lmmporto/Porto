import { Router, type Request, type Response, type NextFunction } from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { handleIncomingCall } from "../services/webhook.service.js";

const router = Router();

// Função auxiliar para saber se é Admin
async function checkIfAdmin(email: string) {
  try {
    const doc = await db.collection("configuracoes").doc("gerais").get();
    const admins = doc.data()?.admins || [];
    return admins.includes(email);
  } catch {
    return false;
  }
}

// 1. LISTAGEM COM TRAVA DE SEGURANÇA E AUDITORIA
router.get("/", async (req: Request, res: Response) => {
  try {
    // Trava de Autenticação
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);
    
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const startAfter = req.query.lastVisible as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;

    // 🚩 LOG DE AUDITORIA
    console.log(`🔎 [BUSCA] User: ${userEmail} | Admin: ${isAdmin} | Datas: ${startDateParam} a ${endDateParam}`);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    // 🚩 A TRAVA: Se não for admin, SÓ vê as próprias ligações pelo e-mail
    if (!isAdmin) {
      query = query.where("ownerEmail", "==", userEmail);
    } else {
      // Se for admin, ele pode filtrar por e-mail de outros via query param
      const filterEmail = req.query.ownerEmail as string;
      if (filterEmail) query = query.where("ownerEmail", "==", filterEmail);
    }

    // Filtros de Período Real (Usando callTimestamp)
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);

      query = query
        .where("callTimestamp", ">=", admin.firestore.Timestamp.fromDate(start))
        .where("callTimestamp", "<=", admin.firestore.Timestamp.fromDate(end));
    }

    query = query.orderBy("callTimestamp", "desc");

    if (startAfter) {
      const lastDoc = await db.collection(CONFIG.CALLS_COLLECTION).doc(startAfter).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(limit).get();
    console.log(`✅ [BUSCA] Encontrados ${snapshot.size} documentos para ${userEmail}`);

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

// 2. DETALHE DA LIGAÇÃO COM VALIDAÇÃO DE PERMISSÃO E BLINDAGEM DE ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    // 🚩 SOLUÇÃO DO ERRO: Extração e validação rigorosa do ID
    const callId = req.params.id ? String(req.params.id).trim() : null;

    if (!callId || callId === 'undefined' || callId === 'null') {
      return res.status(400).json({ error: "ID da ligação inválido ou não fornecido." });
    }
    
    // Agora o Firestore garante que o caminho é uma string válida
    const doc = await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Ligação não encontrada no banco." });
    }
    
    const callData = doc.data();
    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);

    // 🚩 TRAVA DE PRIVACIDADE
    if (!isAdmin && callData?.ownerEmail !== userEmail) {
      return res.status(403).json({ error: "Você não tem permissão para ver esta ligação." });
    }

    res.json({ id: doc.id, ...callData });
  } catch (error: any) {
    console.error("❌ [DETAIL ERROR]:", error.message);
    res.status(500).json({ error: "Erro interno ao buscar detalhes", details: error.message });
  }
});

// 3. WEBHOOK (Vital para entrada de dados)
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