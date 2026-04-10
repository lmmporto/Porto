import { db } from "../firebase.js";

export async function checkIfAdmin(email: string): Promise<boolean> {
  try {
    if (!email) return false;

    const doc = await db.collection("configuracoes").doc("gerais").get();
    if (!doc.exists) return false;

    const data = doc.data();
    const adminsRaw = data?.admins;
    const normalizedUserEmail = email.toLowerCase().trim();

    // 🚩 TRATAMENTO MULTI-TIPO (O Segredo da Resiliência)
    
    // Caso 1: O banco tem uma LISTA de admins
    if (Array.isArray(adminsRaw)) {
      return adminsRaw.some(adminEmail => 
        typeof adminEmail === 'string' && 
        adminEmail.toLowerCase().trim() === normalizedUserEmail
      );
    }

    // Caso 2: O banco tem apenas UMA STRING (Seu estado atual)
    if (typeof adminsRaw === 'string') {
      return adminsRaw.toLowerCase().trim() === normalizedUserEmail;
    }

    return false;
  } catch (error) {
    console.error("❌ [AUTH ERROR] Erro ao verificar admin:", error);
    return false; 
  }
}