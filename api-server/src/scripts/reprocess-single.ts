import { db } from "../firebase.js";
import { processCall } from "../services/processCall.js";

async function reprocess() {
  const callId = "107124210586"; // ID da chamada que você mandou
  console.log(`🔄 Resetando chamada ${callId} para reanálise...`);
  
  await db.collection('calls_analysis').doc(callId).update({
    processingStatus: 'QUEUED',
    playbook_detalhado: null // Limpa o null anterior
  });
  
  console.log("✅ Chamada enfileirada. O Worker vai pegar em instantes.");
}

reprocess();