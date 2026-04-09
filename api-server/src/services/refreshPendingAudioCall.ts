import axios from 'axios';
import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { HUBSPOT_CALL_PROPERTIES } from '../constants/hubspot.js';

const MAX_AUDIO_FETCH_ATTEMPTS = 10;

export async function refreshPendingAudioCall(callId: string) {
  try {
    const token = process.env.HUBSPOT_TOKEN;
    if (!token) throw new Error("HUBSPOT_TOKEN não configurado no .env");

    // 1. Reconsulta no HubSpot
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Extração e validação dos dados
    const props = response.data.properties;
    const hubspotTranscript = String(props.hs_call_transcript || '').trim();
    const recordingUrl = String(props.hs_call_recording_url || '').trim();
    
    const hasTranscript = hubspotTranscript.length >= 100;
    const hasAudio = Boolean(recordingUrl);

    // Obter estado atual para incrementar tentativas
    const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
    const docRef = db.collection(collectionName).doc(callId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return;
    }

    const currentAttempts = docSnap.data()?.audioFetchAttempts || 0;
    const newAttempts = currentAttempts + 1;

    // Lógica de incremento e verificação de limite
    if (!hasTranscript && !hasAudio && newAttempts >= MAX_AUDIO_FETCH_ATTEMPTS) {
      await docRef.set({
        processingStatus: 'FAILED_NO_AUDIO',
        failureReason: 'NO_AUDIO_AFTER_RETRIES',
        audioFetchAttempts: newAttempts,
        lastAudioCheckAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`🚫 Chamada ${callId} atingiu limite de tentativas. Status: FAILED_NO_AUDIO`);
      return;
    }

    // Lógica de amadurecimento de estado
    let updateData: any = {
      recordingUrl,
      hasAudio,
      hasTranscript,
      audioFetchAttempts: newAttempts,
      lastAudioCheckAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (hasTranscript) {
      updateData.transcript = hubspotTranscript;
      updateData.transcriptSource = 'HUBSPOT';
      updateData.processingStatus = 'QUEUED';
    } else if (hasAudio) {
      updateData.processingStatus = 'QUEUED';
    } else {
      updateData.processingStatus = 'PENDING_AUDIO';
    }

    // Persistência no Firestore
    await docRef.update(updateData);

    console.log(`✅ Chamada ${callId} atualizada via polling/refresh. Novo status: ${updateData.processingStatus}`);
  } catch (error) {
    console.error(`❌ Erro ao reconsultar HubSpot para ${callId}:`, error);
    throw error;
  }
}
