import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url || `file://${process.cwd()}/`);

// 🚩 O nome que você me passou
const serviceAccount = require('./chave-firebase.json'); 

if (!getApps().length) {
  initializeAdminApp({
    credential: cert(serviceAccount)
  });
  console.log('✅ Conexão LOCAL ativada para o Resgate.');
}

export const db = getFirestore();