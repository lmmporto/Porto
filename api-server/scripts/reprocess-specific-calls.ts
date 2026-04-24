import dotenv from 'dotenv';
dotenv.config(); // Procura .env no CWD

import { db } from '../src/firebase.js';
import admin from 'firebase-admin';
import { fetchCall, fetchOwnerDetails } from '../src/services/hubspot.js';
import { CONFIG } from '../src/config.js';

const CALL_IDS_TO_REPROCESS = ['108493460994'];

async function reprocessSpecificCalls() {
  console.log(`\n🚀 [REPROCESS] Iniciando reprocessamento para ${CALL_IDS_TO_REPROCESS.length} chamadas específicas...`);

  for (const callId of CALL_IDS_TO_REPROCESS) {
    try {
      console.log(`\n🔍 [${callId}] Buscando dados frescos no HubSpot...`);
      
      // 1. Busca os dados mais recentes da chamada
      const callData = await fetchCall(callId);

      if (!callData || !callData.recordingUrl) {
        console.error(`❌ [${callId}] ERRO: Não foi possível encontrar a URL do áudio no HubSpot. Pulando.`);
        continue;
      }

      // Busca detalhes do owner para garantir o email correto
      const owner = await fetchOwnerDetails(callData.ownerId || null);

      if (!owner.ownerEmail) {
        console.error(`❌ [${callId}] ERRO: E-mail do owner não encontrado. Pulando.`);
        continue;
      }

      console.log(`✅ [${callId}] Dados obtidos: ${owner.ownerName} (${owner.ownerEmail})`);
      console.log(`🔗 [${callId}] Audio URL: ${callData.recordingUrl.substring(0, 50)}...`);

      // 2. Monta o payload para enfileirar
      // Usamos a coleção 'calls_analysis' e o status 'QUEUED' que o worker monitora
      const callRef = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis').doc(callId);

      const taskPayload = {
        callId: callId,
        ownerEmail: owner.ownerEmail,
        ownerName: owner.ownerName,
        recordingUrl: callData.recordingUrl,
        hasAudio: true,
        processingStatus: 'QUEUED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        reprocessedAt: admin.firestore.FieldValue.serverTimestamp(),
        reprocessReason: 'manual_request_v1.8.0'
      };

      // 3. Atualiza o documento para disparar o worker
      await callRef.set(taskPayload, { merge: true });
      console.log(`✨ [${callId}] SUCESSO: Chamada enviada para a fila (Status: QUEUED).`);

    } catch (error: any) {
      console.error(`💥 [${callId}] FALHA ao processar:`, error.message);
    }
  }

  console.log('\n✅ [FINISHED] Script de reprocessamento concluído.');
  process.exit(0);
}

reprocessSpecificCalls().catch(error => {
  console.error("❌ Erro fatal durante a execução do script:", error);
  process.exit(1);
});
