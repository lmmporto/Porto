import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 🛑 AQUI ESTÁ O PULO DO GATO:
// Pegamos a Secret que você já cadastrou no Render. 
// Certifique-se de que o nome da variável no Render é exatamente FIREBASE_SERVICE_ACCOUNT
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!getApps().length) {
  if (!serviceAccount.project_id) {
    console.error("❌ Erro: Variável FIREBASE_SERVICE_ACCOUNT não encontrada ou vazia!");
  } else {
    initializeAdminApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Conexão com Firebase via Secret ativada!');
  }
}

export const db = getFirestore();