import { db } from '../src/firebase.js';
import admin from 'firebase-admin';

async function queueForReprocessing(ids: string[]) {
  console.log(`🚀 Adicionando chamadas à fila de reprocessamento: ${ids.join(', ')}`);
  
  const batch = db.batch();
  const reproRef = db.collection('reprocessing_queue');
  const callsRef = db.collection('calls_analysis');

  for (const id of ids) {
    // 1. Adiciona à fila de reprocessamento
    batch.set(reproRef.doc(id), {
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      retryCount: 0,
      priority: 1
    });

    // 2. Reseta o status na calls_analysis para permitir novo processamento
    // Importante: Tirar de FAILED_NO_AUDIO para PENDING ou similar
    batch.update(callsRef.doc(id), {
      processingStatus: 'QUEUED', // Ou PENDING, para o worker pegar
      failureReason: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`  - [${id}] Preparada.`);
  }

  await batch.commit();
  console.log('\n✅ Chamadas enviadas para a fila com sucesso! O worker deve processá-las em breve.');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Uso: npx tsx scripts/queue-reprocess.ts ID1 ID2 ...");
} else {
  queueForReprocessing(args).catch(err => {
    console.error("❌ Erro ao enfileirar:", err);
    process.exit(1);
  });
}
