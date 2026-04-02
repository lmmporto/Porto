import { db } from './src/firebase.ts';
import { CONFIG } from './src/config.ts';; // Importando para pegar o nome correto da coleção

async function cleanStains() {
  console.log("-----------------------------------------");
  console.log("🧹 INICIANDO LIMPEZA DE NOTAS INDEVIDAS");
  console.log("-----------------------------------------");

  let countCorrigidos = 0;

  try {
    // 1. Limpar as chamadas que caíram na ROTA C (NAO_SE_APLICA)
    const rotaCSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where('status_final', '==', 'NAO_SE_APLICA')
      .get();

    console.log(`🔍 Encontradas ${rotaCSnapshot.size} chamadas descartadas (Rota C).`);
    
    for (const doc of rotaCSnapshot.docs) {
      if (doc.data().nota_spin === 0) {
        await doc.ref.update({ nota_spin: null });
        console.log(`✅ ID ${doc.id} limpo (Rota C).`);
        countCorrigidos++;
      }
    }

    // 2. Limpar as chamadas que foram puladas por terem menos de 1 minuto (SKIPPED)
    const skippedSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where('processingStatus', '==', 'SKIPPED_SHORT_CALL')
      .get();

    console.log(`\n🔍 Encontradas ${skippedSnapshot.size} chamadas ignoradas por tempo curto.`);
    
    for (const doc of skippedSnapshot.docs) {
      if (doc.data().nota_spin === 0) {
        await doc.ref.update({ nota_spin: null });
        console.log(`✅ ID ${doc.id} limpo (Tempo Curto).`);
        countCorrigidos++;
      }
    }

    console.log("\n-----------------------------------------");
    console.log(`✨ LIMPEZA CONCLUÍDA! ${countCorrigidos} manchas removidas do histórico.`);
    console.log("-----------------------------------------");
    process.exit(0);

  } catch (error) {
    console.error("❌ ERRO DURANTE A LIMPEZA:", error);
    process.exit(1);
  }
}

cleanStains();