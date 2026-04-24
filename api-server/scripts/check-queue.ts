import { db } from '../src/firebase.js';

async function checkQueue() {
  console.log('🔍 Verificando status da fila de processamento...');
  
  const callsRef = db.collection('calls_analysis');
  
  // Status que indicam "na fila" ou "pendente"
  const queueStatuses = ['QUEUED', 'PENDING', 'PROCESSING', 'ERROR', 'PENDING_AUDIO'];
  
  const stats: Record<string, number> = {};
  
  for (const status of queueStatuses) {
    const snap = await callsRef.where('processingStatus', '==', status).get();
    stats[status] = snap.size;
  }

  // Verificar reprocessing_queue se existir
  try {
    const reproSnap = await db.collection('reprocessing_queue').get();
    stats['REPROCESSING_QUEUE'] = reproSnap.size;
  } catch (e) {
    // Ignora se a coleção não existir
  }

  console.log('\n📊 Resumo da Fila:');
  Object.entries(stats).forEach(([status, count]) => {
    if (count > 0) {
      console.log(`- ${status}: ${count} chamadas`);
    }
  });

  const totalPending = Object.values(stats).reduce((a, b) => a + b, 0);
  
  if (totalPending === 0) {
    console.log('\n✅ Fila limpa! Nenhuma chamada pendente.');
  } else {
    console.log(`\n⏳ Total de ${totalPending} chamadas aguardando atenção.`);
    
    // Listar as 5 mais antigas em ERROR ou QUEUED
    const pendingSnap = await callsRef
      .where('processingStatus', 'in', ['ERROR', 'QUEUED', 'PENDING_AUDIO'])
      .orderBy('updatedAt', 'asc')
      .limit(5)
      .get();
      
    if (!pendingSnap.empty) {
      console.log('\n📅 Últimas 5 chamadas pendentes:');
      pendingSnap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`- ID: ${doc.id} | Status: ${d.processingStatus} | Atualizado: ${d.updatedAt?.toDate()?.toLocaleString() || 'N/A'}`);
      });
    }
  }
}

checkQueue().catch(err => {
  console.error("❌ Erro ao verificar fila:", err);
  process.exit(1);
});
