import { db } from "../firebase.js";
import { processCall } from "../services/processCall.js";

async function resgateGeral() {
  const COLECAO = "calls_analysis"; 

  console.log(`\n🔍 Buscando chamadas para o Double-Check Geral na coleção: "${COLECAO}"...`);

  // Busca todas as chamadas da coleção
  const snapshot = await db.collection(COLECAO).get();

  if (snapshot.empty) {
    console.log("❌ Nenhuma chamada encontrada no Firebase.");
    return;
  }

  // Filtra as chamadas: vamos ignorar as que já deram "DONE" para não gastar dinheiro à toa reprocessando sucessos.
  const chamadasParaProcessar = snapshot.docs.filter(doc => {
    const status = doc.data().processingStatus;
    return status !== "DONE"; 
  });

  console.log(`✅ [ACHEI!] ${chamadasParaProcessar.length} chamadas identificadas para o resgate. Iniciando o rolo compressor...\n`);

  let contador = 1;
  for (const doc of chamadasParaProcessar) {
    console.log(`\n⏳ [${contador}/${chamadasParaProcessar.length}] Processando ID: ${doc.id}...`);
    
    try {
      await processCall(doc.id);
    } catch (error: any) {
      console.error(`❌ Erro crítico ao processar ${doc.id}:`, error.message);
    }
    
    contador++;
    
    // Pequeno respiro de 1 segundo entre as chamadas para não tomar bloqueio (Rate Limit) do HubSpot ou do Google
    await new Promise(res => setTimeout(res, 1000));
  }

  console.log(`\n🎉 RESGATE GERAL FINALIZADO COM SUCESSO! O lixo foi limpo e o ouro foi extraído.`);
}

resgateGeral();