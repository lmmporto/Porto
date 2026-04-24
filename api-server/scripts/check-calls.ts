import { db } from '../src/firebase.js';

async function checkSpecificCalls(ids: string[]) {
  console.log(`🔍 Investigando chamadas: ${ids.join(', ')}`);
  
  const callsRef = db.collection('calls_analysis');
  
  for (const id of ids) {
    const doc = await callsRef.doc(id).get();
    if (!doc.exists) {
      console.log(`\n❌ [${id}] Documento não encontrado em 'calls_analysis'.`);
      
      // Tentar buscar na fila de reprocessamento
      const reproDoc = await db.collection('reprocessing_queue').doc(id).get();
      if (reproDoc.exists) {
        console.log(`  - 📥 Encontrado na 'reprocessing_queue'. Dados:`, reproDoc.data());
      }
      continue;
    }

    const data = doc.data() || {};
    console.log(`\n📄 [${id}] Status: ${data.processingStatus || 'N/A'}`);
    console.log(`   - Owner: ${data.ownerName} (${data.ownerEmail})`);
    console.log(`   - Team: ${data.teamName || 'Não gravado'}`);
    console.log(`   - Duração: ${data.durationMs / 1000}s`);
    console.log(`   - Motivo de falha (se houver): ${data.failureReason || 'Nenhum'}`);
    console.log(`   - Tem transcrição? ${data.hasTranscript ? 'Sim' : 'Não'}`);
    console.log(`   - Tem áudio? ${data.hasAudio ? 'Sim' : 'Não'}`);
    console.log(`   - Atualizado em: ${data.updatedAt?.toDate()?.toLocaleString() || 'N/A'}`);
    
    // Validar Gatekeeper logicamente
    const registrySnap = await db.collection('sdr_registry').doc(data.ownerEmail?.replace(/\./g, '_') || '').get();
    const registryData = registrySnap.exists ? registrySnap.data() : null;
    console.log(`   - No Registro? ${registrySnap.exists ? 'Sim' : 'Não'}`);
    console.log(`   - Time no Registro: ${registryData?.assignedTeam || 'N/A'}`);
    console.log(`   - Ativo no Registro? ${registryData?.isActive ? 'Sim' : 'Não'}`);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Uso: npx tsx scripts/check-calls.ts ID1 ID2 ...");
} else {
  checkSpecificCalls(args).catch(err => {
    console.error("❌ Erro na investigação:", err);
    process.exit(1);
  });
}
