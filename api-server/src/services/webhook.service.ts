import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CallStatus } from '../constants/call-processing.js';
import { CALLS_COLLECTION } from '../constants/collections.js';

/**
 * 🏛️ ARQUITETO: Nova Estratégia de Webhook (Leve e Assíncrona)
 * Este serviço apenas registra a chamada no banco para que o Worker processe.
 */
export async function handleIncomingCall(payload: any) {
  const events = Array.isArray(payload) ? payload : [payload];
  const processedIds: string[] = [];

  for (const event of events) {
    const callId = event.objectId || event.callId;

    if (!callId) {
      console.warn('⚠️ Evento ignorado: Sem ID de objeto.');
      continue;
    }

    const callRef = db.collection(CALLS_COLLECTION).doc(String(callId));

    const doc = await callRef.get();
    const currentStatus = doc.data()?.processingStatus;

    if (!doc.exists || currentStatus === CallStatus.ERROR) {
      await callRef.set(
        {
          id: String(callId),
          callId: String(callId),
          processingStatus: CallStatus.PENDING_AUDIO,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: doc.exists
            ? doc.data()?.createdAt || admin.firestore.FieldValue.serverTimestamp()
            : admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      processedIds.push(String(callId));
    } else {
      console.log(`⏭️ Chamada ${callId} já existente com status: ${currentStatus}`);
    }
  }

  console.log(`✅ Webhook processado. ${processedIds.length} chamadas enfileiradas.`);

  return {
    status: 'accepted',
    count: processedIds.length,
    ids: processedIds,
  };
}