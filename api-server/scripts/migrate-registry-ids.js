import { db } from '../src/firebase.js';

async function migrateRegistryToUnderscores() {
  console.log('🚀 Iniciando migração de sdr_registry para IDs com underscores...');
  
  const snapshot = await db.collection('sdr_registry').get();
  let migratedCount = 0;
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const id = doc.id;
    if (id.includes('.')) {
      const newId = id.replace(/\./g, '_');
      const data = doc.data();
      
      console.log(`🔄 Migrando [${id}] -> [${newId}]`);
      
      // Cria o novo documento
      await db.collection('sdr_registry').doc(newId).set(data);
      migratedCount++;
      
      // Deleta o antigo
      await db.collection('sdr_registry').doc(id).delete();
      deletedCount++;
    }
  }

  console.log(`\n✅ Migração concluída!`);
  console.log(`📦 Documentos recriados: ${migratedCount}`);
  console.log(`🗑️ Documentos antigos removidos: ${deletedCount}`);
}

migrateRegistryToUnderscores().catch(err => {
  console.error("❌ Erro na migração:", err);
  process.exit(1);
});
