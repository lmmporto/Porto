import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';

export async function handleIncomingCall(payload: any) {
  // Triagem rígida: descarta lixo antes de entrar no sistema
  if (!payload.callId || payload.durationMs < 30000 || !payload.hasAudio) {
    return { status: 'rejected', reason: 'Invalid criteria' };
  }

  // Persistência como Fila: O status QUEUED é o gatilho para o seu processCall
  const callRef = db.collection(CONFIG.CALLS_COLLECTION).doc(payload.callId);
  
  await callRef.set({
    ...payload,
    processingStatus: 'QUEUED',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { status: 'accepted', callId: payload.callId };
}