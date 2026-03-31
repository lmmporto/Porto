import { db } from '../firebase.js';
import { CONFIG } from '../config.js';

async function limparBanco() {
  console.log('🧹 [FAXINA] Iniciando limpeza...');
  
  const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .where('processingStatus', '!=', 'DONE')
    .get();

  if (snapshot.empty) {
    console.log('✅ [FAXINA] Banco já está limpo!');
    return;
  }

  let count = 0;
  for (const doc of snapshot.docs) {
    console.log(`🗑️ [FAXINA] Removendo: ${doc.id}`);
    await doc.ref.delete();
    count++;
  }

  console.log(`✨ [FAXINA] Concluído! ${count} registros removidos.`);
}

limparBanco().catch(console.error);