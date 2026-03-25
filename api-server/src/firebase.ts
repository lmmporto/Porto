import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Aceita tanto o nome antigo quanto o novo com _JSON
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!getApps().length) {
  if (!serviceAccountRaw) {
    throw new Error("❌ CRÍTICO: Variável de credenciais do Firebase ausente no Render!");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    
    initializeAdminApp({
      credential: cert(serviceAccount)
    });
    
    console.log('✅ Firebase conectado com sucesso!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error("❌ CRÍTICO: Erro ao processar JSON do Firebase: " + errorMessage);
  }
}

export const db = getFirestore();