# refreshPendingAudioCall.ts

## Visão geral
- Caminho original: `api-server/src/services/refreshPendingAudioCall.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **service**
- Criticidade: **critical**
- Score de importância: **148**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **131**
- Imports detectados: **5**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como service no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: refreshPendingAudioCall. Funções/classes detectadas: refreshPendingAudioCall. Padrões de endpoint detectados: GET https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}. Dependências locais detectadas: ../config.js, ../constants/hubspot.js, ../firebase.js. Dependências externas detectadas: axios, firebase-admin. Variáveis de ambiente detectadas: HUBSPOT_TOKEN. Temas relevantes detectados: admin, analysis, auth, calls, crm, firebase, hubspot, queue, token, worker. Indícios de framework/arquitetura: firebase, axios.

## Dependências locais
- `../config.js`
- `../constants/hubspot.js`
- `../firebase.js`

## Dependências externas
- `axios`
- `firebase-admin`

## Todos os imports detectados
- `../config.js`
- `../constants/hubspot.js`
- `../firebase.js`
- `axios`
- `firebase-admin`

## Exports detectados
- `refreshPendingAudioCall`

## Funções e classes detectadas
- `refreshPendingAudioCall`

## Endpoints detectados
- `GET https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`

## Variáveis de ambiente detectadas
- `HUBSPOT_TOKEN`

## Temas relevantes
- `admin`
- `analysis`
- `auth`
- `calls`
- `crm`
- `firebase`
- `hubspot`
- `queue`
- `token`
- `worker`

## Indícios de framework/arquitetura
- `firebase`
- `axios`

## Código
```ts
import axios from 'axios';
import admin from 'firebase-admin';
import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { HUBSPOT_CALL_PROPERTIES } from '../constants/hubspot.js';

const MAX_AUDIO_FETCH_ATTEMPTS = 10;
const MIN_DURATION_MS = 110000; // 1:50 min

/**
 * 🏛️ ARQUITETO: Refresh, Filtro Qualitativo e Guarda de Recência
 * Esta função reconsulta o HubSpot e decide se a chamada segue para análise ou é descartada.
 */
export async function refreshPendingAudioCall(callId: string) {
  const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
  const docRef = db.collection(collectionName).doc(callId);

  try {
    // 1. 🏛️ ARQUITETO: Guarda de Sanidade - Ignora IDs não-numéricos
    if (!/^\d+$/.test(callId)) {
      console.warn(`⚠️ [SKIP] ID inválido detectado: "${callId}". Removendo ruído do banco.`);
      await docRef.delete();
      return;
    }

    const token = process.env.HUBSPOT_TOKEN;
    if (!token) throw new Error("HUBSPOT_TOKEN não configurado no .env");

    const docSnap = await docRef.get();
    if (!docSnap.exists) return;

    // 2. Busca os dados no HubSpot com tratamento para erro 404
    let response;
    try {
      response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e: any) {
      if (e.response?.status === 404) {
        console.error(`🚫 [404] Chamada ${callId} não existe no HubSpot. Deletando...`);
        await docRef.delete();
        return;
      }
      throw e;
    }

    const props = response.data.properties;

    // 3. 🏛️ ARQUITETO: GUARDA DE RECÊNCIA (Anti-Inundação de chamadas antigas)
    const hsTimestamp = props.hs_timestamp || props.hs_createdate;
    const callDate = hsTimestamp ? new Date(hsTimestamp) : new Date();
    const safeDate = isNaN(callDate.getTime()) ? new Date() : callDate;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (safeDate < twentyFourHoursAgo) {
      console.log(`⏭️ [OLD] Descarte por antiguidade: ${callId} (${safeDate.toLocaleDateString()}). Marcando como SKIPPED.`);
      await docRef.update({
        processingStatus: 'SKIPPED',
        reason: 'OLD_CALL_PURGE',
        callTimestamp: safeDate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return; 
    }

    // 4. 🚩 O FILTRO: Descarte por duração (Chamadas muito curtas)
    const durationMs = Number(props.hs_call_duration || 0);
    if (durationMs < MIN_DURATION_MS) {
      console.log(`⏭️ [SHORT] Chamada ${callId} curta demais (${Math.round(durationMs/1000)}s).`);
      await docRef.update({
        processingStatus: 'SKIPPED',
        reason: 'TOO_SHORT',
        durationMs: durationMs,
        callTimestamp: safeDate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return; 
    }

    // 5. Extração de Mídia e Transcrição
    const hubspotTranscript = String(props.hs_call_transcript || '').trim();
    const recordingUrl = String(props.hs_call_recording_url || '').trim();
    const hasTranscript = hubspotTranscript.length >= 100;
    const hasAudio = Boolean(recordingUrl);

    const currentAttempts = docSnap.data()?.audioFetchAttempts || 0;
    const newAttempts = currentAttempts + 1;

    // 6. Lógica de Polling de Áudio (Retentativas)
    if (!hasTranscript && !hasAudio && newAttempts >= MAX_AUDIO_FETCH_ATTEMPTS) {
      await docRef.update({
        processingStatus: 'FAILED_NO_AUDIO',
        failureReason: 'NO_AUDIO_AFTER_RETRIES',
        audioFetchAttempts: newAttempts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`🚫 [TIMEOUT] Chamada ${callId} sem mídia após ${MAX_AUDIO_FETCH_ATTEMPTS} tentativas.`);
      return;
    }

    // 7. Amadurecimento de Estado para a Fila de IA
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
    console.log(`✅ [${updateData.processingStatus}] Chamada ${callId} sincronizada.`);

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`❌ [WORKER ERROR] Falha em ${callId}: ${errorMsg}`);
  }
}
```
