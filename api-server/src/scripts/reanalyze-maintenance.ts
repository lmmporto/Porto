// src/scripts/reanalyze-maintenance.ts

import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { analyzeCallWithGemini, updateDailyStats, updateSdrGlobalStats } from '../services/analysis.service.js';
import { fetchOwnerDetails } from '../services/hubspot.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;

// 🏛️ ARQUITETO: Mudamos para V10 para INVALIDAR o cache da V8
const TARGET_VERSION = "V10_MESTRE_MENTOR";

async function runMaintenance() {
  console.log(`🚀 [MAINTENANCE] Forçando reanálise para a versão: ${TARGET_VERSION}`);

  try {
    const collection = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis');

    // Busca as 10 ligações que você quer testar
    const snapshot = await collection
      .where("processingStatus", "==", "DONE")
      .limit(5
      
      )
      .get();

    for (const doc of snapshot.docs) {
      const callData = { id: doc.id, ...doc.data() } as any;
      console.log(`\n🧠 Processando com Mestre Mentor: ${callData.id}`);

      try {
        const ownerDetails = await fetchOwnerDetails(callData.ownerId);
        
        // 🚩 Isso vai chamar o Gemini de verdade porque a versão V10 não existe no banco ainda
        const result = await analyzeCallWithGemini(callData, ownerDetails);

        // 🏛️ O ARQUITETO: Atualização "Flat" (Garante que a raiz e o objeto fiquem iguais)
        await collection.doc(doc.id).update({
          ...result.analysis, // Salva nota, resumo, etc na RAIZ do documento
          analysisResult: result.analysis, // Salva também no objeto para histórico
          lastAnalysisVersion: TARGET_VERSION,
          processingStatus: "DONE",
          updatedAt: FieldValue.serverTimestamp()
        });

        await updateDailyStats(callData, result.analysis, true);
        console.log(`✅ Sucesso! Nova Nota: ${result.analysis.nota_spin}`);

      } catch (err: any) {
        console.error(`❌ Erro em ${doc.id}:`, err.message);
      }
    }
  } catch (error: any) {
    console.error("🚨 Erro fatal:", error.message);
  }
}

runMaintenance();