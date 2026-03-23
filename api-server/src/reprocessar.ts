import { processCall } from "./services/processCall.js";

async function dispararTeste() {
  const ID_DA_CALL = "106771143735"; // O ID da Tarcilla que você me mandou
  
  console.log(`🚀 Forçando reprocessamento da Call: ${ID_DA_CALL}...`);
  
  try {
    const resultado = await processCall(ID_DA_CALL);
    
    if (resultado.success) {
      console.log("✅ Sucesso! A call foi reprocessada.");
      console.log(`Status final: ${resultado.status_final}`);
      console.log("Agora vá ao Firebase e procure pelos campos rawPrompt e rawResponse.");
    } else {
      console.log("⚠️ A call foi pulada. Motivo:", resultado.reason);
    }
  } catch (error) {
    console.error("❌ Erro ao processar:", error);
  } finally {
    process.exit(0);
  }
}

dispararTeste();