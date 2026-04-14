import axios from 'axios';
import admin from 'firebase-admin';
import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { HUBSPOT_CALL_PROPERTIES } from '../constants/hubspot.js';

const MAX_AUDIO_FETCH_ATTEMPTS = 10;
const MIN_DURATION_MS = 110000; // 1:50 min

/**
 * 🏛️ ARQUITETO: Refresh e Filtro Qualitativo
 * Esta função reconsulta o HubSpot e decide se a chamada segue para análise ou é descartada.
 */
export async function refreshPendingAudioCall(callId: string) {
  try {
    const token = process.env.HUBSPOT_TOKEN;
    if (!token) throw new Error("HUBSPOT_TOKEN não configurado no .env");

    const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
    const docRef = db.collection(collectionName).doc(callId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return;

    // 1. Reconsulta dados reais no HubSpot
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const props = response.data.properties;
    const durationMs = Number(props.hs_call_duration || 0);

    // 🚩 O FILTRO AGORA VIVE AQUI: Descarte por duração
    if (durationMs < MIN_DURATION_MS) {
      console.log(`⏭️ [WORKER] Chamada ${callId} descartada por ser curta demais (${durationMs}ms)`);
      
      await docRef.update({
        processingStatus: 'SKIPPED',
        reason: 'TOO_SHORT',
        durationMs: durationMs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return; 
    }

    // 2. Extração de Mídia e Transcrição
    const hubspotTranscript = String(props.hs_call_transcript || '').trim();
    const recordingUrl = String(props.hs_call_recording_url || '').trim();
    
    const hasTranscript = hubspotTranscript.length >= 100;
    const hasAudio = Boolean(recordingUrl);

    const currentAttempts = docSnap.data()?.audioFetchAttempts || 0;
    const newAttempts = currentAttempts + 1;

    // 3. Lógica de Limite de Tentativas (Polling de Áudio)
    if (!hasTranscript && !hasAudio && newAttempts >= MAX_AUDIO_FETCH_ATTEMPTS) {
      await docRef.update({
        processingStatus: 'FAILED_NO_AUDIO',
        failureReason: 'NO_AUDIO_AFTER_RETRIES',
        audioFetchAttempts: newAttempts,
        lastAudioCheckAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🚫 Chamada ${callId} atingiu limite de tentativas. Status: FAILED_NO_AUDIO`);
      return;
    }

    // 4. Amadurecimento de Estado
    let updateData: any = {
      recordingUrl,
      hasAudio,
      hasTranscript,
      durationMs,
      audioFetchAttempts: newAttempts,
      lastAudioCheckAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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

    await docRef.update(updateData);
    console.log(`✅ Chamada ${callId} atualizada. Novo status: ${updateData.processingStatus}`);

  } catch (error: any) {
    console.error(`❌ Erro ao reconsultar HubSpot para ${callId}:`, error.message);
    throw error;
  }
}