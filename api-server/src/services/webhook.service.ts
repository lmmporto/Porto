import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CONFIG } from '../config.js';
import axios from 'axios';

// 🚩 DURAÇÃO MÍNIMA: 2 minutos (120.000 milissegundos)
const MIN_DURATION_MS = 120000;

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
      `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=hs_call_duration,hs_call_recording_url,hubspot_owner_id,hs_call_title,hs_call_status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const callData = hsResponse.data.properties;
    const durationMs = Number(callData.hs_call_duration || 0);
    const hasAudio = !!callData.hs_call_recording_url;
    const ownerId = callData.hubspot_owner_id;

    // 3. FILTRO DE QUALIDADE (2 minutos e com áudio)
    if (durationMs < MIN_DURATION_MS || !hasAudio) {
      console.log(`⏭️ Chamada ${callId} ignorada. Duração: ${durationMs}ms, Áudio: ${hasAudio}`);
      return { status: 'rejected', reason: 'Invalid criteria (Duration or Audio)' };
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
    
    // Verificamos se já não está processando para evitar duplicidade
    const docSnap = await callRef.get();
    if (docSnap.exists && docSnap.data()?.processingStatus !== 'ERROR') {
      console.log(`⏭️ Chamada ${callId} já existe no banco.`);
      return { status: 'ignored', reason: 'Already exists' };
    }

    const payloadToSave = {
      id: String(callId),
      callId: String(callId),
      title: callData.hs_call_title || 'Chamada sem título',
      durationMs: durationMs,
      hasAudio: hasAudio,
      recordingUrl: callData.hs_call_recording_url,
      ownerId: ownerId,
      ownerEmail: ownerEmail.toLowerCase(),
      ownerName: ownerName,
      hsCallStatus: callData.hs_call_status,
      processingStatus: 'QUEUED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      callTimestamp: admin.firestore.FieldValue.serverTimestamp() // Idealmente pegar do HubSpot (hs_createdate)
    };

    await callRef.set(payloadToSave);
    console.log(`✅ Chamada ${callId} enfileirada para análise!`);

    return { status: 'accepted', callId: callId };

  } catch (error: any) {
    console.error(`❌ Erro no processamento do Webhook para ${callId}:`, error?.response?.data || error.message);
    return { status: 'error', reason: 'HubSpot API Error' };
  }
}