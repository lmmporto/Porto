import { db } from "../firebase.js";

/**
 * Verifica se um e-mail pertence à lista de administradores no Firestore.
 * 🚩 SEGURANÇA: Em caso de erro ou e-mail vazio, retorna false (comportamento fail-safe).
 */
export async function checkIfAdmin(email: string): Promise<boolean> {
  try {
    if (!email) return false;
    
    const doc = await db.collection("configuracoes").doc("gerais").get();
    if (!doc.exists) {
      console.warn("⚠️ [AUTH] Documento de configurações gerais não encontrado.");
      return false;
    }
    
    const admins: string[] = doc.data()?.admins || [];
    // Normalização rigorosa para evitar falhas por case-sensitivity
    return admins.map(e => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
  } catch (error) {
    console.error("❌ [AUTH ERROR] Erro crítico ao verificar privilégios de admin:", error);
    return false; 
  }
}
