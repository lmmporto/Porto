import { db } from "../firebase.js";

/**
 * Verifica se um e-mail pertence à lista de administradores no Firestore.
 * 🚩 SEGURANÇA: Em caso de erro ou e-mail vazio, retorna false (comportamento fail-safe).
 */
export async function checkIfAdmin(email: string): Promise<boolean> {
  try {
    if (!email) return false;

    const doc = await db.collection("configuracoes").doc("gerais").get();
    const data = doc.data();
    
    // 🚩 PROTEÇÃO SÊNIOR: Garante que 'admins' seja sempre um array antes de processar
    const adminsRaw = data?.admins;
    const adminsList = Array.isArray(adminsRaw) ? adminsRaw : [];

    // Normaliza o e-mail do usuário
    const normalizedUserEmail = email.toLowerCase().trim();

    // Verifica se o e-mail está na lista (também normalizada)
    return adminsList.some(adminEmail => 
      typeof adminEmail === 'string' && 
      adminEmail.toLowerCase().trim() === normalizedUserEmail
    );
  } catch (error) {
    console.error("❌ [AUTH ERROR] Falha catastrófica no checkIfAdmin:", error);
    return false; // Em dúvida, nega acesso (Fail-Closed)
  }
}
