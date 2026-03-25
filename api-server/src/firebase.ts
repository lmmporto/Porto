import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
  if (!serviceAccountRaw) {
    throw new Error("❌ CRÍTICO: Variável FIREBASE_SERVICE_ACCOUNT ausente no Render!");
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