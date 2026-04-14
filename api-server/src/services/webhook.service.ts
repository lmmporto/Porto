import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';

/**
 * 🏛️ ARQUITETO: Nova Estratégia de Webhook (Leve e Assíncrona)
 * Este serviço apenas registra a chamada no banco para que o Worker processe.
 */
export async function handleIncomingCall(payload: any) {
  // 🏛️ Normaliza para sempre tratar como Array (lotes do HubSpot)
  const events = Array.isArray(payload) ? payload : [payload];
  const processedIds: string[] = [];

  for (const event of events) {
    const callId = event.objectId || event.callId;
    
    if (!callId) {
      console.warn("⚠️ Evento ignorado: Sem ID de objeto.");
      continue;
    }

    // 🚩 ESTRATÉGIA SÊNIOR: Apenas "Enfileira" no Firestore.
    // Não buscamos dados no HubSpot agora. Deixamos o Worker fazer isso.
    const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
    const callRef = db.collection(collectionName).doc(String(callId));
    
    // Verificamos o estado para evitar sobrescrever processamentos em andamento ou concluídos
    const doc = await callRef.get();
    const currentStatus = doc.data()?.processingStatus;

    // Só criamos se não existir ou se estiver em estado de erro (para reprocessar)
    if (!doc.exists || currentStatus === 'ERROR') {
      await callRef.set({
        id: String(callId),
        callId: String(callId),
        processingStatus: 'PENDING_AUDIO', // Gatilho para o Worker
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      processedIds.push(String(callId));
    } else {
      console.log(`⏭️ Chamada ${callId} já existente com status: ${currentStatus}`);
    }
  }

  console.log(`✅ Webhook processado. ${processedIds.length} chamadas enfileiradas.`);
  
  return { 
    status: 'accepted', 
    count: processedIds.length, 
    ids: processedIds 
  };
}