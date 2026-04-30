import admin from 'firebase-admin';
import { db } from '../src/firebase.js';
import { CallStatus } from '../src/domain/analysis/analysis.types.js';

/**
 * Script para reverter o descarte por antiguidade (OLD_CALL_PURGE)
 * de chamadas que foram marcadas incorretamente (limite anterior de 24h).
 * Agora o limite é 30 dias, então podemos recuperar essas chamadas.
 */
async function revertOldPurge() {
  console.log('🔍 Iniciando recuperação de chamadas descartadas por antiguidade...');

  const callsRef = db.collection('calls_analysis');
  
  // Busca chamadas marcadas com OLD_CALL_PURGE
  const snapshot = await callsRef
    .where('skipDetails', '==', 'OLD_CALL_PURGE')
    .where('processingStatus', 'in', ['SKIPPED', 'PENDING_AUDIO'])
    .get();

  if (snapshot.empty) {
    console.log('✅ Nenhuma chamada encontrada para recuperação.');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} calls to revert.`);

  const batch = db.batch();
  let count = 0;

  // Filtro de 30 dias (segurança adicional)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const callTimestamp = data.callTimestamp?.toDate() || new Date();

    if (callTimestamp >= thirtyDaysAgo) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      batch.set(doc.ref, {
        processingStatus: CallStatus.PENDING_AUDIO,
        skipReason: admin.firestore.FieldValue.delete(),
        skipDetails: admin.firestore.FieldValue.delete(),
        nextRetryAt: admin.firestore.Timestamp.fromDate(oneMinuteAgo), // Forçar processamento imediato
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      count++;
      console.log(`[RECOVERY] Call ${doc.id} (${callTimestamp.toLocaleDateString()}) -> PENDING_AUDIO`);
    } else {
      console.log(`[KEEP] Call ${doc.id} (${callTimestamp.toLocaleDateString()}) é realmente antiga (> 30 dias).`);
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`\n🎉 Sucesso! ${count} chamadas foram movidas de volta para PENDING_AUDIO.`);
  } else {
    console.log('\nℹ️ Nenhuma chamada elegível para reversão (todas são realmente mais antigas que 30 dias).');
  }

  process.exit(0);
}

revertOldPurge().catch(err => {
  console.error('❌ Erro fatal no script:', err);
  process.exit(1);
});
