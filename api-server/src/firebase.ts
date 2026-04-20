import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// 🚩 FORÇA A CARGA AQUI (Antes de qualquer lógica)
dotenv.config();

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;

const initializeFirebase = () => {
  if (getApps().length > 0) return getApps()[0];

  if (!serviceAccountRaw) {
    // Se cair aqui, é porque o .env realmente não tem a chave ou o caminho está errado
    console.error("❌ [FIREBASE ERROR]: Variável ausente no processo atual.");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountRaw.trim());
    return initializeAdminApp({ credential: cert(serviceAccount) });
  } catch (error) {
    return null;
  }
};

const app = initializeFirebase();

const firestore = app ? getFirestore() : null as any;

if (firestore) {
  // Trava de segurança para operações de deleção
  const originalDelete = firestore.recursiveDelete.bind(firestore);
  firestore.recursiveDelete = (ref: any, ...args: any[]) => {
    if (process.env.ALLOW_DELETE !== 'true') {
      throw new Error('[SECURITY] Mass delete denied. Set ALLOW_DELETE=true to proceed.');
    }
    return originalDelete(ref, ...args);
  };
}

export const db = firestore;