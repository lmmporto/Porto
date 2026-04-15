// firebase.ts
import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;

const initializeFirebase = () => {
  if (!getApps().length) {
    if (!serviceAccountRaw) {
      console.error("❌ Erro: Variável de serviço do Firebase ausente.");
      return null;
    }
    try {
      // Tenta limpar possíveis quebras de linha mal formatadas do Render
      const cleanedJson = serviceAccountRaw.trim();
      const serviceAccount = JSON.parse(cleanedJson);
      return initializeAdminApp({ credential: cert(serviceAccount) });
    } catch (error) {
      console.error("❌ Erro fatal no JSON do Firebase. Verifique as aspas e quebras de linha.");
      return null;
    }
  }
  return getApps()[0];
};

initializeFirebase();
export const db = getFirestore();