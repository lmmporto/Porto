import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./chave-firebase.json", "utf8"));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function recuperarOuro() {
  console.log("🏆 Buscando QUALQUER chamada com nota da Ana Julia...");
  const callsRef = db.collection('calls_analysis');
  
  // Buscamos TUDO da Ana Julia
  const snapshot = await callsRef.where('ownerName', '==', 'Ana Julia Cecchin').get();

  const batch = db.batch();
  let recuperados = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    // Se a nota for maior que zero, não importa o status atual, vamos forçar para DONE
    if ((data.nota_spin || 0) > 0 && data.processingStatus !== "DONE") {
      batch.update(doc.ref, { processingStatus: "DONE" });
      recuperados++;
      console.log(`✅ FORÇANDO DONE: ${data.title} (Nota ${data.nota_spin})`);
    }
  });

  if (recuperados > 0) {
    await batch.commit();
    console.log(`\n✨ SUCESSO! ${recuperados} notas foram recuperadas.`);
  } else {
    console.log("\n🤔 Estranho... não achei nenhuma nota maior que zero para ela.");
  }
}

recuperarOuro().catch(console.error);