import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { fetchCall, fetchOwnerDetails } from '../services/hubspot.js';
import { analyzeCallWithGemini, updateDailyStats, updateSdrGlobalStats, transcribeRecordingFromHubSpot } from '../services/analysis.service.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;
const TARGET_VERSION = "V10_MESTRE_MENTOR";

// 🚩 COLOQUE OS IDs DAS 5 LIGAÇÕES AQUI
const targetIds = [
  "106734989139"
  // ... adicione os outros 4 IDs aqui
];

async function reprocessSpecificCalls() {
  console.log(`🚀 [CLEANUP] Iniciando reprocessamento de ${targetIds.length} chamadas...`);

  for (const callId of targetIds) {
    try {
      console.log(`\n🛠️ Corrigindo: ${callId}`);

      // 1. Busca dados frescos do HubSpot (para pegar o timestamp original)
      const callData = await fetchCall(callId);
      const ownerDetails = await fetchOwnerDetails(callData.ownerId);

      // 2. Garante a transcrição
      if (!callData.transcript || callData.transcript.length < 100) {
        console.log("🎙️ Gerando transcrição ausente...");
        callData.transcript = await transcribeRecordingFromHubSpot(callData);
      }

      // 3. Roda a análise Mestre Mentor V10
      console.log("🧠 Rodando Mestre Mentor V10...");
      const result = await analyzeCallWithGemini(callData, ownerDetails);

      // 4. CORREÇÃO DA DATA: Transforma a string do HubSpot em Objeto Date do JS
      const correctedDate = callData.timestamp ? new Date(callData.timestamp) : new Date();

      // 5. Gravação "Flat" e Limpa no Firestore
      const payload = {
        ...callData,
        ...result.analysis,
        ownerName: ownerDetails.ownerName,
        ownerEmail: ownerDetails.ownerEmail,
        analysisResult: result.analysis,
        lastAnalysisVersion: TARGET_VERSION,
        processingStatus: "DONE",
        callTimestamp: correctedDate, // 🚩 O segredo do Invalid Date está aqui
        updatedAt: FieldValue.serverTimestamp()
      };

      await db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis').doc(callId).set(payload, { merge: true });

      // 6. Atualiza Estatísticas
      await updateDailyStats(payload, result.analysis, true);
      if (result.analysis.nota_spin !== null) {
        await updateSdrGlobalStats(ownerDetails.ownerEmail!, ownerDetails.ownerName, result.analysis.nota_spin);
      }

      console.log(`✅ Sucesso: ${callId} reprocessada com data: ${correctedDate.toISOString()}`);

    } catch (err: any) {
      console.error(`❌ Erro no ID ${callId}:`, err.message);
    }
  }
  console.log("\n✨ [CLEANUP] Finalizado.");
}

reprocessSpecificCalls();