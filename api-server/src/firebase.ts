import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 🚩 Ajustado para o nome exato que aparece no seu print do Render
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
  if (!serviceAccountRaw) {
    throw new Error("❌ CRÍTICO: Variável FIREBASE_SERVICE_ACCOUNT_JSON ausente no Render!");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    initializeAdminApp({ credential: cert(serviceAccount) });
    console.log('✅ Firebase conectado com sucesso!');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error("❌ Erro no JSON do Firebase: " + msg);
  }
}

export const db = getFirestore();