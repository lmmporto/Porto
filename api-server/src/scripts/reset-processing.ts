import { db } from "../firebase.js";
import { CONFIG } from "../config.js";

async function resetProcessing() {
  console.log("🧹 Buscando chamadas travadas em PROCESSING...");
  
  const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .where('processingStatus', '==', 'PROCESSING')
    .get();

  if (snapshot.empty) {
    console.log("✅ Nenhuma chamada travada encontrada.");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { 
      processingStatus: 'QUEUED',
      updatedAt: new Date() // Reseta o tempo para o Worker pegar de novo
    });
    console.log(`🔓 Destravada: ${doc.id}`);
  });

  await batch.commit();
  console.log(`🏁 Sucesso! ${snapshot.size} chamadas voltaram para a fila.`);
  process.exit(0);
}

resetProcessing().catch(console.error);