import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { analyzeCallWithGemini, updateDailyStats, updateSdrGlobalStats } from '../services/analysis.service.js';
import { fetchOwnerDetails } from '../services/hubspot.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;

// 🏛️ ARQUITETO: Versão alvo. 
// Certifique-se que é a mesma string que está no seu analysis.service.ts
const TARGET_VERSION = "V8_NEW_MODEL";

async function runMaintenance() {
  console.log("🚀 [MAINTENANCE] Iniciando Reprocessamento V8...");

  try {
    const collection = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis');

    // 1. BUSCAR CHAMADAS COM ERRO (Até 100)
    const errorSnapshot = await collection
      .where("processingStatus", "in", ["ERROR", "FAILED_NO_AUDIO", "QUEUED"])
      .limit(10)
      .get();

    // 2. BUSCAR 10 CHAMADAS COM NOTA BAIXA (Para aplicar o novo Coaching)
    const lowScoreSnapshot = await collection
      .where("processingStatus", "==", "DONE")
      .where("nota_spin", ">=", 3)
      .where("nota_spin", "<=", 4)
      .limit(2)
      .get();

    const allDocs = [...errorSnapshot.docs, ...lowScoreSnapshot.docs];
    console.log(`🔎 Encontradas ${allDocs.length} chamadas para reprocessar.`);

    for (const doc of allDocs) {
      const callData = { id: doc.id, ...doc.data() } as any;
      
      // 🏛️ O ARQUITETO: Removi a trava de "FIX" para forçar a IA a gerar o novo formato de Playbook.
      console.log(`\n🧠 Reprocessando: ${callData.id} | Nota Antiga: ${callData.nota_spin || 'N/A'}`);

      try {
        const ownerDetails = await fetchOwnerDetails(callData.ownerId);

        // Chama a IA (ela vai ignorar o cache interno porque vamos forçar a atualização)
        const result = await analyzeCallWithGemini(callData, ownerDetails);

        // Salva o novo resultado e a nova versão
        await collection.doc(doc.id).update({
          analysisResult: result.analysis,
          lastAnalysisVersion: TARGET_VERSION,
          processingStatus: "DONE",
          updatedAt: FieldValue.serverTimestamp()
        });

        // Atualiza os placares com a nova nota
        await updateDailyStats(callData, result.analysis, true);
        if (result.analysis.nota_spin !== null) {
          await updateSdrGlobalStats(callData.ownerEmail, callData.ownerName, result.analysis.nota_spin);
        }

        console.log(`✅ Sucesso! Nova Nota: ${result.analysis.nota_spin}`);
        
        // Pequeno delay para não estourar o limite de requisições por minuto da API gratuita
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err: any) {
        console.error(`❌ Falha na chamada ${doc.id}:`, err.message);
      }
    }

    console.log("\n✨ [MAINTENANCE] Reprocessamento concluído.");
  } catch (error: any) {
    console.error("🚨 [FATAL ERROR]:", error.message);
  }
}

runMaintenance();