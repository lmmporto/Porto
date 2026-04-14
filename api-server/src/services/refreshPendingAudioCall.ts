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
  const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
  const docRef = db.collection(collectionName).doc(callId);

  try {
    // 1. 🏛️ ARQUITETO: Guarda de Sanidade - Ignora IDs não-numéricos (como "Valor de teste" do HubSpot)
    if (!/^\d+$/.test(callId)) {
      console.warn(`⚠️ [SKIP] ID inválido detectado: "${callId}". Removendo ruído do banco.`);
      await docRef.delete();
      return;
    }

    const token = process.env.HUBSPOT_TOKEN;
    if (!token) throw new Error("HUBSPOT_TOKEN não configurado no .env");

    const docSnap = await docRef.get();
    if (!docSnap.exists) return;

    // 2. Busca os dados no HubSpot com tratamento isolado para o erro 404
    // Isso resolve o erro de tipagem das linhas 42/44
    let response;
    try {
      response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e: any) {
      if (e.response?.status === 404) {
        console.error(`🚫 [404] Chamada ${callId} não existe no HubSpot. Deletando do banco.`);
        await docRef.delete();
        return; // Interrompe a execução aqui
      }
      throw e; // Lança outros erros (Timeout, 500) para o catch principal
    }

    // 🏛️ ARQUITETO: Agora o TypeScript sabe que 'response.data' existe com certeza
    const props = response.data.properties;
    const durationMs = Number(props.hs_call_duration || 0);

    // 3. 🚩 O FILTRO: Descarte por duração (Chamadas muito curtas)
    if (durationMs < MIN_DURATION_MS) {
      console.log(`⏭️ [WORKER] Chamada ${callId} curta demais (${Math.round(durationMs/1000)}s).`);
      await docRef.update({
        processingStatus: 'SKIPPED',
        reason: 'TOO_SHORT',
        durationMs: durationMs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return; 
    }

    // 4. Extração de Mídia e Transcrição
    const hubspotTranscript = String(props.hs_call_transcript || '').trim();
    const recordingUrl = String(props.hs_call_recording_url || '').trim();
    
    // 🏛️ ARQUITETO: Capturando a data real da ligação para o BI
    const hsTimestamp = props.hs_timestamp || props.hs_createdate;
    const actualCallDate = hsTimestamp ? new Date(hsTimestamp) : new Date();
    const safeDate = isNaN(actualCallDate.getTime()) ? new Date() : actualCallDate;

    const hasTranscript = hubspotTranscript.length >= 100;
    const hasAudio = Boolean(recordingUrl);

    const currentAttempts = docSnap.data()?.audioFetchAttempts || 0;
    const newAttempts = currentAttempts + 1;

    // 5. Lógica de Limite de Tentativas (Polling de Áudio)
    if (!hasTranscript && !hasAudio && newAttempts >= MAX_AUDIO_FETCH_ATTEMPTS) {
      await docRef.update({
        processingStatus: 'FAILED_NO_AUDIO',
        failureReason: 'NO_AUDIO_AFTER_RETRIES',
        audioFetchAttempts: newAttempts,
        lastAudioCheckAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🚫 Chamada ${callId} atingiu limite de tentativas sem áudio.`);
      return;
    }

    // 6. Amadurecimento de Estado para a Fila de IA
    let updateData: any = {
      recordingUrl,
      hasAudio,
      hasTranscript,
      durationMs,
      audioFetchAttempts: newAttempts,
      callTimestamp: safeDate, 
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
    console.log(`✅ Chamada ${callId} atualizada. Status: ${updateData.processingStatus}`);

  } catch (error: any) {
    // 🏛️ ARQUITETO: Log limpo para não inundar o terminal e proteger o ambiente
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`❌ [WORKER ERROR] Falha na sincronização de ${callId}: ${errorMsg}`);
  }
}