import { db } from '../src/firebase.js';

async function migrateSdrRegistry() {
  console.log('🚀 Iniciando migração do sdr_registry...');
  
  const snapshot = await db.collection('sdr_registry').get();
  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const updates = {};

    // Garante que isActive exista
    if (data.isActive === undefined) {
      updates.isActive = true;
    }

    // Garante que assignedTeam exista
    if (!data.assignedTeam) {
      updates.assignedTeam = 'Time Lucas'; // Usando o time padrão do projeto
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      count++;
      console.log(`[PENDENTE] Atualizando SDR: ${doc.id} -> ${JSON.stringify(updates)}`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`\n✅ Migração concluída: ${count} documentos atualizados.`);
  } else {
    console.log('\n✨ Nenhum documento precisou de atualização.');
  }
}

migrateSdrRegistry().catch(err => {
  console.error("❌ Erro na migração:", err);
  process.exit(1);
});
