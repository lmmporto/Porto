import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      initializeAdminApp({ credential: cert(serviceAccount) });
      console.log('✅ Firebase conectado com sucesso usando Service Account JSON.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('❌ Erro ao ler FIREBASE_SERVICE_ACCOUNT_JSON:', msg);
      initializeAdminApp();
    }
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON não encontrado. Firestore pode falhar.');
    initializeAdminApp();
  }
}

export const db = getFirestore();
