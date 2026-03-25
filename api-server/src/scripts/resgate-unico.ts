import { db } from "../firebase.js";
import { processCall } from "../services/processCall.js";

async function resgateUnico() {
  // 🎯 O ID DA LAISA QUE ESTÁ NO SEU PRINT
  const CALL_ID = "106869127553"; 
  const COLECAO = "calls_analysis";

  console.log(`\n🎯 INICIANDO RESGATE ÚNICO: ${CALL_ID}`);

  try {
    // 1. Verificar se ela existe no Firebase
    const doc = await db.collection(COLECAO).doc(CALL_ID).get();
    
    if (!doc.exists) {
      console.log("❌ Erro: Este ID não foi encontrado no Firebase.");
      return;
    }

    console.log(`✅ Documento encontrado! Status atual: ${doc.data()?.processingStatus}`);
    console.log("⏳ Processando agora (isso pode levar 1 minuto)...");

    // 2. Rodar o processamento real
    const result = await processCall(CALL_ID);

    if (result && result.status === "ANALYZED") {
      console.log("\n✨ SUCESSO ABSOLUTO!");
      console.log("📈 A nota já deve estar aparecendo no seu Dashboard.");
    } else {
      console.log("\n⏭️  MANTIDA EM SKIP.");
      console.log(`Motivo: ${result?.reason || "Não atingiu os critérios de análise."}`);
    }

  } catch (error: any) {
    console.error("\n❌ ERRO NO PROCESSO:", error.message);
  }
}

resgateUnico();