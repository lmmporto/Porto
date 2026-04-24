import { db } from '../firebase.js';
import admin from 'firebase-admin';

async function syncAllSDRs() {
  console.log("🚀 Iniciando sincronização total de SDRs...");
  
  const sdrsSnap = await db.collection('sdrs').get();
  console.log(`📊 Encontrados ${sdrsSnap.docs.length} SDRs para processar.`);

  for (const sdrDoc of sdrsSnap.docs) {
    const sdrId = sdrDoc.id; // Ex: amaranta_vieira@nibo_com_br
    
    // 1. Reverter ID para formato original (dots) para lookup no registry e calls
    const originalEmail = sdrId.replace(/_/g, '.'); 
    
    // 2. Buscar equipe no registry usando o email com pontos
    const registrySnap = await db.collection('sdr_registry').doc(originalEmail).get();
    const registryData = registrySnap.exists ? registrySnap.data() : null;
    const teamName = registryData?.team || registryData?.squad || registryData?.teamName || 'Equipe não definida';

    // 3. Contar chamadas reais
    const callsSnap = await db.collection('calls_analysis')
      .where('ownerEmail', '==', originalEmail)
      .get();
    
    const realTotalCalls = callsSnap.docs.length;

    console.log(`SDR: ${sdrId} | Equipe: ${teamName} | Chamadas: ${realTotalCalls}`);

    // 4. Atualizar documento do SDR
    await db.collection('sdrs').doc(sdrId).set({
      teamName: teamName,
      total_calls: realTotalCalls,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // 5. Atualizar o Global Summary
  const finalSdrsSnap = await db.collection('sdrs').get();
  const totalCallsSum = finalSdrsSnap.docs.reduce((acc, doc) => acc + (doc.data().total_calls || 0), 0);
  const totalScoreSum = finalSdrsSnap.docs.reduce((acc, doc) => acc + (doc.data().real_average || 0) * (doc.data().total_calls || 0), 0);
  const globalAverage = totalCallsSum > 0 ? totalScoreSum / totalCallsSum : 0;

  await db.collection('dashboard_stats').doc('global_summary').set({
    total_calls: totalCallsSum,
    media_geral: parseFloat(globalAverage.toFixed(2)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`✅ Sincronização concluída! Total de chamadas no sistema: ${totalCallsSum}`);
  process.exit(0);
}

syncAllSDRs().catch(err => {
  console.error("❌ Erro na sincronização:", err);
  process.exit(1);
});
