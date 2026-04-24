import { db } from './src/firebase.ts';

async function fixTeams() {
  console.log("🚀 Iniciando sincronização de times...");
  const registry = await db.collection('sdr_registry').get();
  const batch = db.batch();
  let count = 0;
  
  for (const doc of registry.docs) {
    const data = doc.data();
    if (data.assignedTeam) {
      // Atualiza a coleção 'sdrs' para garantir que o ranking funcione
      const sdrRef = db.collection('sdrs').doc(doc.id);
      batch.set(sdrRef, { 
        teamName: data.assignedTeam,
        assignedTeam: data.assignedTeam 
      }, { merge: true });
      count++;
    }
  }
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Sincronização de ${count} times concluída!`);
  } else {
    console.log("⚠️ Nenhum registro com assignedTeam encontrado.");
  }
}

fixTeams().catch(console.error);
