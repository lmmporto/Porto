import { db } from "./src/firebase.js"; // Importa direto do seu arquivo TS original

async function consertarTudo() {
  const nomeSDR = "Ana Julia Cecchin";
  console.log(`🔍 Buscando dados originais de: ${nomeSDR}...`);

  try {
    const callsRef = db.collection('calls_analysis');
    const snapshot = await callsRef.where('ownerName', '==', nomeSDR).get();

    if (snapshot.empty) {
      console.log("❌ Nenhuma chamada encontrada. Verifique o nome no Firebase.");
      return;
    }

    console.log(`📦 Encontradas ${snapshot.size} chamadas. Analisando...`);
    
    const batch = db.batch();
    let carimbados = 0;
    let movidosParaAudit = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const duration = data.durationMs || 0;
      const nota = data.nota_spin || 0;

      // LÓGICA: Se tem nota e é longa, mas o status sumiu -> DONE
      if (duration >= 120000 && nota > 0 && !data.processingStatus) {
        batch.update(doc.ref, { processingStatus: "DONE" });
        carimbados++;
        console.log(`✅ Recuperado: ${data.title} (Nota ${nota})`);
      } 
      // LÓGICA: Se é lixo e estava sujando a média -> SKIPPED_FOR_AUDIT
      else if ((duration < 120000 || data.wasConnected === false) && data.processingStatus !== "SKIPPED_FOR_AUDIT") {
        batch.update(doc.ref, { 
          processingStatus: "SKIPPED_FOR_AUDIT",
          nota_spin: 0 
        });
        movidosParaAudit++;
      }
    });

    if (carimbados > 0 || movidosParaAudit > 0) {
      await batch.commit();
      console.log("\n--- FAXINA CONCLUÍDA ---");
      console.log(`⭐ Notas Recuperadas: ${carimbados}`);
      console.log(`🧹 Zeros Escondidos: ${movidosParaAudit}`);
      console.log("🚀 Verifique o Dashboard agora!");
    } else {
      console.log("✨ O banco já estava correto. Nenhuma alteração feita.");
    }
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

consertarTudo();