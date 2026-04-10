import { Router, type Request, type Response } from "express";
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
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);

    // 🚩 SONDA DE DIAGNÓSTICO: Auditoria de Identidade
    console.log(`🕵️ [PROD DEBUG] Buscando chamadas para: "${userEmail}" | isAdmin: ${isAdmin}`);
    
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const startAfter = req.query.lastVisible as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    const filterEmail = req.query.ownerEmail as string;
    const mode = req.query.mode as string;

    console.log(`🔎 [BUSCA] User: ${userEmail} | Admin: ${isAdmin} | Filtro: ${filterEmail} | Datas: ${startDateParam} a ${endDateParam} | Mode: ${mode}`);

    let query: FirebaseFirestore.Query = db.collection(CONFIG.CALLS_COLLECTION);

    // 1. Filtro de Autoria (Resiliência e Segurança)
    if (filterEmail || !isAdmin) {
      const rawEmail = filterEmail || userEmail || "";
      const targetEmail = rawEmail.toLowerCase().trim();
      console.log(`🔎 [DEBUG] Buscando dados para e-mail normalizado: "${targetEmail}"`);
      query = query.where("ownerEmail", "==", targetEmail);
    }

    // 2. Lógica de Ordenação e Modo (Feed vs Vitrine Ranking)

    // 🚩 REGRA GLOBAL: O SDR só vê o que a IA terminou de analisar com sucesso
    query = query.where("processingStatus", "==", "DONE");

    if (mode === 'ranking') {
      // VITRINE: Performance absoluta (Top 10)
      query = query
        .orderBy("nota_spin", "desc")
        .limit(10);
    } else {
      // FEED: Cronológico (Fluxo normal com filtros de data)
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
      
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    console.log(`✅ [BUSCA] Encontrados ${snapshot.size} documentos`);

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
    const userEmail = (req.user as any).email;
    const isAdmin = await checkIfAdmin(userEmail);

    if (!isAdmin && callData?.ownerEmail !== userEmail) {
      return res.status(403).json({ error: "Permissão negada." });
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