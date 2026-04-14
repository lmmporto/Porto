import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import admin from 'firebase-admin';

async function cleanupFlood() {
  console.log("🧹 [CLEANUP] Iniciando operação de expurgo...");

  const collection = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis');
  
  // 🏛️ ARQUITETO: Definimos o que é "Novo". 
  // Qualquer ligação com data anterior a hoje que esteja na fila será eliminada.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Buscamos os culpados que estão entupindo a fila
    const snapshot = await collection
      .where("processingStatus", "in", ["PENDING_AUDIO", "QUEUED"])
      .get();

    console.log(`🔎 Encontrados ${snapshot.size} candidatos ao expurgo.`);

    let deletedCount = 0;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const callDate = data.callTimestamp ? data.callTimestamp.toDate() : null;

      // Se a ligação for antiga (antes de hoje), nós deletamos ou pulamos
      if (!callDate || callDate < today) {
        batch.delete(doc.ref);
        deletedCount++;
        operationCount++;

        // Firestore limita batches a 500 operações
        if (operationCount === 500) {
          await batch.commit();
          batch = db.batch();
          operationCount = 0;
          console.log(`... ${deletedCount} removidos ...`);
        }
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    console.log(`✅ [CLEANUP] Sucesso! ${deletedCount} chamadas antigas foram removidas da fila.`);
    console.log(`🚀 O sistema agora está limpo para as chamadas de hoje.`);

  } catch (error: any) {
    console.error("🚨 [CLEANUP FATAL]:", error.message);
  }
}

cleanupFlood();