import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import { HUBSPOT_CALL_PROPERTIES } from '../constants/hubspot.js';
import axios from 'axios';

// 🚩 DURAÇÃO MÍNIMA:  110000 (1:50 min)
const MIN_DURATION_MS = 110000;;

export async function handleIncomingCall(payload: any) {
  // 1. Extração Inteligente do ID (O HubSpot pode mandar como callId ou objectId num array)
  const callId = payload.callId || payload.objectId || (Array.isArray(payload) ? payload[0]?.objectId : undefined);
  
  if (!callId) {
    console.warn("⚠️ Webhook ignorado: Sem ID de chamada.");
    return { status: 'rejected', reason: 'No Call ID' };
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    console.error("❌ ERRO CRÍTICO: HUBSPOT_TOKEN não configurado no .env");
    return { status: 'error', reason: 'Missing API Token' };
  }

  try {
    console.log(`📡 Buscando detalhes da chamada ${callId} no HubSpot...`);

    // 2. BUSCA ATIVA: Pega os dados reais da chamada no HubSpot
    // Usamos a API v3 de Engagements/Calls
    const hsResponse = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const callData = hsResponse.data.properties;

    // Normalização de dados para processamento
    const hubspotTranscript = String(callData.hs_call_transcript || '').trim();
    const hasTranscript = hubspotTranscript.length >= 100;
    const recordingUrl = String(callData.hs_call_recording_url || '').trim();
    const hasAudio = Boolean(recordingUrl);

    const durationMs = Number(callData.hs_call_duration || 0);
    const ownerId = callData.hubspot_owner_id;

    // Validação de duração mínima
    if (durationMs < MIN_DURATION_MS) {
      console.log(`⏭️ Chamada ${callId} ignorada por duração. Duração: ${durationMs}ms`);
      return { status: 'rejected', reason: 'Too short' };
    }

    // 4. TRADUÇÃO DE DONO (ID para E-mail)
    let ownerEmail = 'nao_encontrado@empresa.com';
    let ownerName = 'Desconhecido';

    if (ownerId) {
      try {
        const ownerRes = await axios.get(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        ownerEmail = ownerRes.data.email;
        ownerName = `${ownerRes.data.firstName || ''} ${ownerRes.data.lastName || ''}`.trim();
      } catch (ownerError) {
        console.error(`⚠️ Erro ao buscar dono ${ownerId}:`, ownerError);
      }
    }

    // 5. SALVAMENTO NO BANCO
    const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
    const callRef = db.collection(collectionName).doc(String(callId));
    
    // Lógica de verificação de estado para permitir ou bloquear o processamento
    const docSnap = await callRef.get();

    if (docSnap.exists) {
      const existingData = docSnap.data();
      const blockedStatuses = ['DONE', 'PROCESSING'];

      if (blockedStatuses.includes(existingData?.processingStatus)) {
        console.log(`⏭️ Chamada ${callId} ignorada. Estado atual: ${existingData?.processingStatus}`);
        return { status: 'ignored', reason: 'Already processed or in progress' };
      }
      
      console.log(`🔄 Atualizando chamada ${callId} existente. Estado anterior: ${existingData?.processingStatus}`);
    }

    // Determinação do estado inicial da chamada
    let initialStatus = 'PENDING_AUDIO';

    if (hasTranscript || hasAudio) {
      initialStatus = 'QUEUED';
    }

    const payloadToSave = {
      id: String(callId),
      callId: String(callId),
      title: callData.hs_call_title || 'Chamada sem título',
      durationMs: durationMs,
      hasAudio: hasAudio,
      hasTranscript: hasTranscript,
      transcript: hasTranscript ? hubspotTranscript : null,
      transcriptSource: hasTranscript ? 'HUBSPOT' : null,
      recordingUrl: recordingUrl,
      ownerId: ownerId,
      ownerEmail: ownerEmail.toLowerCase(),
      ownerName: ownerName,
      hsCallStatus: callData.hs_call_status,
      processingStatus: initialStatus,
      audioFetchAttempts: 0,
      lastAudioCheckAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      callTimestamp: admin.firestore.FieldValue.serverTimestamp() // Idealmente pegar do HubSpot (hs_createdate)
    };

    await callRef.set(payloadToSave, { merge: true });
    console.log(`✅ Chamada ${callId} enfileirada para análise!`);

    return { status: 'accepted', callId: callId };

  } catch (error: any) {
    console.error(`❌ Erro no processamento do Webhook para ${callId}:`, error?.response?.data || error.message);
    return { status: 'error', reason: 'HubSpot API Error' };
  }
}