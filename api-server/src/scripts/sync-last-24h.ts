import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { fetchCall, fetchOwnerDetails } from '../services/hubspot.js';
import { 
  analyzeCallWithGemini, 
  updateDailyStats, 
  updateSdrGlobalStats,
  transcribeRecordingFromHubSpot 
} from '../services/analysis.service.js';
import { hubspot } from '../clients.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;
const TARGET_VERSION = "V10_MESTRE_MENTOR";

async function syncLast24Hours() {
  console.log("📡 [SYNC] Iniciando varredura das últimas 24h no HubSpot...");

  try {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    const searchResponse = await hubspot.post("/crm/v3/objects/calls/search", {
      filterGroups: [{
        filters: [
          { propertyName: "hs_timestamp", operator: "GTE", value: twentyFourHoursAgo },
          { propertyName: "hs_call_duration", operator: "GTE", value: "110000" } 
        ]
      }],
      sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
      properties: ["hs_call_title", "hs_call_duration", "hs_timestamp"],
      limit: 100
    });

    const results = searchResponse.data.results || [];
    console.log(`🔎 Encontradas ${results.length} chamadas candidatas.`);

    for (const hsCall of results) {
      const callId = hsCall.id;
      const callRef = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis').doc(callId);
      
      const doc = await callRef.get();
      if (doc.exists && doc.data()?.lastAnalysisVersion === TARGET_VERSION) {
        console.log(`⏭️ [SKIP] ${callId} já processada.`);
        continue;
      }

      try {
        console.log(`\n🛠️ Processando: ${callId}`);
        const callData = await fetchCall(callId);
        const ownerDetails = await fetchOwnerDetails(callData.ownerId);

        // 1. Garantia de Transcrição
        if (!callData.transcript || callData.transcript.length < 100) {
          if (callData.recordingUrl) {
            const newTranscript = await transcribeRecordingFromHubSpot(callData);
            if (newTranscript) {
              callData.transcript = newTranscript;
              callData.hasTranscript = true;
            }
          } else {
            console.warn(`⚠️ [SKIP] Chamada ${callId} sem áudio.`);
            continue;
          }
        }

        // 2. Análise Estruturada
        const result = await analyzeCallWithGemini(callData, ownerDetails);

        // 3. Tratamento de Data (O Ponto de Ouro para o BI)
        const actualCallDate = callData.timestamp ? new Date(callData.timestamp) : new Date();
        const safeDate = isNaN(actualCallDate.getTime()) ? new Date() : actualCallDate;

        // 4. Persistência Atômica e Enriquecida
        const payloadToSave = {
          ...callData,
          ...result.analysis,
          ownerName: ownerDetails.ownerName || "SDR Desconhecido",
          ownerEmail: ownerDetails.ownerEmail || "desconhecido@nibo.com.br",
          analysisResult: result.analysis,
          lastAnalysisVersion: TARGET_VERSION,
          processingStatus: "DONE",
          callTimestamp: safeDate,             // 🚩 Data real da ligação
          updatedAt: FieldValue.serverTimestamp() // 🚩 Data do processamento
        };

        await callRef.set(payloadToSave, { merge: true });

        // 5. Atualização de Métricas Diárias baseadas na DATA DA LIGAÇÃO
        // 🏛️ ARQUITETO: Note que passamos a data real para o updateDailyStats
        await updateDailyStats(payloadToSave, result.analysis, true);

        // 6. Atualização Global de SDR
        const notaFinal = result.analysis.nota_spin !== null ? Number(result.analysis.nota_spin) : null;
        if (notaFinal !== null && !isNaN(notaFinal)) {
          await updateSdrGlobalStats(
            payloadToSave.ownerEmail, 
            payloadToSave.ownerName, 
            notaFinal
          );
        }

        console.log(`✅ [SUCCESS] ${callId} finalizada (${safeDate.toISOString()})`);

      } catch (err: any) {
        console.error(`❌ [ERROR] ${callId}:`, err.message);
        await callRef.set({ 
          processingStatus: "ERROR", 
          lastError: err.message,
          updatedAt: FieldValue.serverTimestamp() 
        }, { merge: true });
      }
    }
  } catch (error: any) {
    console.error("🚨 [SYNC FATAL]:", error.message);
  }
}
syncLast24Hours();