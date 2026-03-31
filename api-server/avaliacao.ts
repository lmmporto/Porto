import { db } from "./src/firebase.js";
import { processCall } from "./src/services/processCall.js";
import { CONFIG } from "./src/config.js";

async function runRecovery() {
  console.log("-----------------------------------------");
  console.log("🚀 INICIANDO VARREDURA: FILTRO +2 MINUTOS");
  console.log("-----------------------------------------");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0); 

  try {
    const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
      .where("updatedAt", ">=", startOfToday)
      .get();

    // Filtro cirúrgico:
    // 1. Duração >= 120.000ms (2 minutos)
    // 2. Não possui nota (significa que a IA ainda não processou/finalizou)
    const toProcess = snapshot.docs.filter(doc => {
      const data = doc.data();
      const duration = Number(data.duration || 0); // Ajuste o campo 'duration' se for outro nome
      const hasNota = data.nota_spin !== null && data.nota_spin !== undefined;
      const isDone = data.processingStatus === "DONE";

      // Só processa se tiver +2min E NÃO tiver nota E NÃO estiver marcado como DONE
      return duration >= 120000 && !hasNota && !isDone;
    });

    console.log(`📊 Total de chamadas hoje: ${snapshot.size}`);
    console.log(`📋 Pendentes (>= 2min sem nota): ${toProcess.length} chamadas.`);
    console.log("-----------------------------------------");

    for (const doc of toProcess) {
      const data = doc.data();
      console.log(`\n🔄 Reprocessando: ${doc.id} (${(data.duration / 1000).toFixed(0)}s)`);
      
      try {
        const result = await processCall(doc.id);
        console.log(`✅ Resultado: ${result.reason || "ANÁLISE_CONCLUÍDA"}`);
      } catch (err) {
        console.error(`❌ Erro no ID ${doc.id}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log("\n✨ VARREDURA FINALIZADA!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

runRecovery();