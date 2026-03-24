import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./chave-firebase.json", "utf8"));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function consertar() {
  const docId = "106639502863"; // ID que vimos no seu print
  console.log("🛠️ Tentando atualizar o documento...");

  const docRef = db.collection('calls_analysis').doc(docId);
  
  await docRef.update({
    ownerName: "Ana Julia Cecchin", // Exatamente como no filtro
    processingStatus: "DONE",      // Para o Front-end validar
    wasConnected: true             // Garante que não caia no filtro de erro
  });

  // Verificação imediata
  const check = await docRef.get();
  console.log("✅ Dados no Banco agora:", JSON.stringify(check.data(), null, 2));
}

consertar().catch(console.error);