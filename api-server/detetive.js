import { db } from "./src/firebase.js";

async function espiarSDR() {
  const nomeSDR = "Ana Julia Cecchin"; // Nome exato
  console.log(`🔍 Investigando chamadas de: ${nomeSDR}...`);

  const callsRef = db.collection('calls_analysis');
  const snapshot = await callsRef.where('ownerName', '==', nomeSDR).get();

  if (snapshot.empty) {
    console.log("❌ Nenhuma chamada encontrada com esse nome.");
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("-----------------------------------------");
    console.log(`📞 CallID: ${doc.id}`);
    console.log(`📝 Título: ${data.title}`);
    console.log(`⏱️ Duração: ${data.durationMs}ms`);
    console.log(`⭐ Nota Spin: ${data.nota_spin}`);
    console.log(`🏷️ Status Atual: ${data.processingStatus || "SEM STATUS"}`);
  });
}

espiarSDR().catch(console.error);