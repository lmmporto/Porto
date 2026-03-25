import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 🚀 Lendo a Secret que você renomeou no Render
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
  if (!serviceAccountRaw) {
    console.error("❌ ERRO: A variável FIREBASE_SERVICE_ACCOUNT não foi encontrada no Render!");
  } else {
    try {
      // Transforma o texto da Secret em um objeto que o Firebase entende
      const serviceAccount = JSON.parse(serviceAccountRaw);
      
      initializeAdminApp({
        credential: cert(serviceAccount)
      });
      
      console.log('✅ Firebase conectado com sucesso via Secret!');
    } catch (error) {
      console.error("❌ ERRO ao processar o JSON da Secret do Firebase:", error);
    }
  }
}

export const db = getFirestore();