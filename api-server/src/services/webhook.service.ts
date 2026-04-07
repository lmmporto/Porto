import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import axios from 'axios';

export async function handleIncomingCall(payload: any) {
  // 1. Filtro: Se a ligação for muito curta ou sem áudio, nem entra
  if (!payload.callId || payload.durationMs < 30000 || !payload.hasAudio) {
    return { status: 'rejected', reason: 'Invalid criteria' };
  }

  let ownerEmail = 'nao_encontrado@empresa.com';

  // 2. Busca o e-mail do vendedor no HubSpot pelo ID
  if (payload.hubspot_owner_id) {
    try {
      const response = await axios.get(
        `https://api.hubapi.com/crm/v3/owners/${payload.hubspot_owner_id}`,
        {
          headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}` }
        }
      );
      ownerEmail = response.data.email;
    } catch (error) {
      console.error('Erro ao buscar e-mail no HubSpot:', error);
    }
  }

  // 3. Salva na gaveta de ligações com o carimbo do e-mail
  const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
  const callRef = db.collection(collectionName).doc(payload.callId);
  
  await callRef.set({
    ...payload,
    ownerEmail: ownerEmail,
    processingStatus: 'QUEUED',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { status: 'accepted', callId: payload.callId };
}