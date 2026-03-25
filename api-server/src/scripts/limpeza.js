import { db } from "../firebase.js"; // Caminho ajustado para dentro de api-server
import { Timestamp } from "firebase-admin/firestore";

async function faxinaGeralHistorica() {
  console.log("🚀 Iniciando FAXINA GERAL em todo o histórico...");

  const callsRef = db.collection('calls_analysis');
  const snapshot = await callsRef.get();
  
  console.log(`📦 Analisando ${snapshot.size} documentos...`);

  let atualizados = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    
    // CRITÉRIOS DE LIXO: Curto, não conectado ou sem análise real
    const isShort = (data.durationMs || 0) < 120000;
    const notConnected = data.wasConnected === false;
    const hasNoAnalysis = !data.resumo || data.nota_spin === 0;

    if ((isShort || notConnected || hasNoAnalysis) && data.processingStatus !== "SKIPPED_FOR_AUDIT") {
      batch.update(doc.ref, { 
        processingStatus: "SKIPPED_FOR_AUDIT", 
        nota_spin: 0,
        status_final: "NAO_IDENTIFICADO"
      });
      atualizados++;
    }
  });

  if (atualizados > 0) {
    await batch.commit();
    console.log(`✅ SUCESSO! ${atualizados} chamadas movidas para Auditoria.`);
  } else {
    console.log("✨ Tudo limpo. Nada para alterar.");
  }
}

faxinaGeralHistorica().catch(console.error);