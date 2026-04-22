# webhook.service.ts

## Visão geral
- Caminho original: `api-server/src/services/webhook.service.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **service**
- Criticidade: **critical**
- Score de importância: **148**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **54**
- Imports detectados: **3**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como service no domínio backend. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: handleIncomingCall. Funções/classes detectadas: handleIncomingCall. Dependências locais detectadas: ../config.js, ../firebase.js. Dependências externas detectadas: firebase-admin. Temas relevantes detectados: admin, analysis, calls, firebase, hubspot, webhook, worker. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `../config.js`
- `../firebase.js`

## Dependências externas
- `firebase-admin`

## Todos os imports detectados
- `../config.js`
- `../firebase.js`
- `firebase-admin`

## Exports detectados
- `handleIncomingCall`

## Funções e classes detectadas
- `handleIncomingCall`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `analysis`
- `calls`
- `firebase`
- `hubspot`
- `webhook`
- `worker`

## Indícios de framework/arquitetura
- `firebase`

## Código
```ts
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
```
