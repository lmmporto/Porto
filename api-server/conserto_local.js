import admin from "firebase-admin";
import { readFileSync } from "fs";

// 1. Carrega a chave que você baixou
const serviceAccount = JSON.parse(
  readFileSync("./chave-firebase.json", "utf8")
);

// 2. Inicializa o Admin com a chave local
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function consertar() {
  const nomeSDR = "Ana Julia Cecchin";
  console.log(`🚀 Conectado! Buscando dados de: ${nomeSDR}...`);

  const callsRef = db.collection('calls_analysis');
  const snapshot = await callsRef.where('ownerName', '==', nomeSDR).get();

  if (snapshot.empty) {
    console.log("❌ Nenhuma chamada encontrada. Verifique o nome no Firebase.");
    return;
  }

  const batch = db.batch();
  let carimbados = 0;
  let limpados = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const duration = data.durationMs || 0;
    const nota = data.nota_spin || 0;

    // Se tem nota e é longa -> DONE
    if (duration >= 120000 && nota > 0 && !data.processingStatus) {
      batch.update(doc.ref, { processingStatus: "DONE" });
      carimbados++;
      console.log(`✅ Recuperado: ${data.title} (${nota})`);
    } 
    // Se é lixo (curta ou nota 0) -> SKIPPED_FOR_AUDIT
    else if ((duration < 120000 || data.wasConnected === false) && data.processingStatus !== "SKIPPED_FOR_AUDIT") {
      batch.update(doc.ref, { 
        processingStatus: "SKIPPED_FOR_AUDIT",
        nota_spin: 0 
      });
      limpados++;
      console.log(`🧹 Limpando: ${data.title}`);
    }
  });

  await batch.commit();
  console.log(`\n✨ FIM! Notas: ${carimbados} | Limpos: ${limpados}`);
}

consertar().catch(console.error);