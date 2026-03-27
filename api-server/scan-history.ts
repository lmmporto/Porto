import { db } from "./src/firebase.js";
import { processCall } from "./src/services/processCall.js";
import { CONFIG } from "./src/config.js";

async function runRecovery() {
  console.log("-----------------------------------------");
  console.log("🚀 INICIANDO VARREDURA RETROATIVA (72H)");
  console.log("-----------------------------------------");

  // 1. Calcular Janela de 3 dias
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  try {
    // 2. Buscar no Firebase o que foi registrado nos últimos 3 dias
    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where("updatedAt", ">=", threeDaysAgo)
      .get();

    // Filtramos apenas as que NÃO foram concluídas (DONE) ou que deram erro
    const toProcess = snapshot.docs.filter(doc => {
      const status = doc.data().processingStatus;
      return status !== "DONE" && status !== "PROCESSING";
    });

    console.log(`📊 Total na janela: ${snapshot.size} chamadas.`);
    console.log(`📋 Para reprocessar: ${toProcess.length} chamadas.`);
    console.log("-----------------------------------------");

    for (const doc of toProcess) {
      const data = doc.data();
      console.log(`\n🔄 Tentando resgatar: ${doc.id}`);
      console.log(`👤 SDR: ${data.ownerName || 'Desconhecido'} | Equipe: ${data.teamName || 'N/A'}`);
      
      try {
        // Roda a nova lógica do processCall
        const result = await processCall(doc.id);
        console.log(`✅ Resultado: ${result.reason || result.status || "OK"}`);
      } catch (err) {
        // Correção do erro de tipo 'unknown'
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`❌ Erro no ID ${doc.id}:`, errorMessage);
      }
    }

    console.log("\n-----------------------------------------");
    console.log("✨ VARREDURA FINALIZADA!");
    console.log("-----------------------------------------");
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro fatal na varredura:", error);
    process.exit(1);
  }
}

// Executa a função
runRecovery();