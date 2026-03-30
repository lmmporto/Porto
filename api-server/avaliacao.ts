import { db } from "./src/firebase.js";
import { processCall } from "./src/services/processCall.js";
import { CONFIG } from "./src/config.js";

async function runRecovery() {
  console.log("-----------------------------------------");
  console.log("🚀 INICIANDO VARREDURA DIÁRIA (HOJE)");
  console.log("-----------------------------------------");

  // 1. Calcular o início do dia atual (00:00:00)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); 

  try {
    // 2. Buscar no Firebase o que foi registrado hoje
    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where("updatedAt", ">=", startOfToday)
      .get();

    // Filtramos apenas as que NÃO foram concluídas (DONE) ou que já estão em processamento
    const toProcess = snapshot.docs.filter(doc => {
      const status = doc.data().processingStatus;
      return status !== "DONE" && status !== "PROCESSING";
    });

    console.log(`📅 Data de início: ${startOfToday.toLocaleString()}`);
    console.log(`📊 Total encontrado hoje: ${snapshot.size} chamadas.`);
    console.log(`📋 Pendentes para reprocessar: ${toProcess.length} chamadas.`);
    console.log("-----------------------------------------");

    for (const doc of toProcess) {
      const data = doc.data();
      console.log(`\n🔄 Tentando resgatar: ${doc.id}`);
      console.log(`👤 SDR: ${data.ownerName || 'Desconhecido'} | Equipe: ${data.teamName || 'N/A'}`);
      
      try {
        const result = await processCall(doc.id);
        console.log(`✅ Resultado: ${result.reason || result.status || "OK"}`);
      } catch (err) {
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

runRecovery();