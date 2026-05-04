import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";

// Determinar o caminho correto do service account dependendo de onde o script é rodado
const keyPath1 = "./chave-firebase.json.json";
const keyPath2 = "./api-server/chave-firebase.json.json";
const serviceAccountPath = existsSync(keyPath1) ? keyPath1 : keyPath2;

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function resetPendingAudioToQueued() {
  console.log("🔍 Buscando chamadas com status PENDING_AUDIO...");
  
  const snapshot = await db.collection("calls_analysis")
    .where("processingStatus", "==", "PENDING_AUDIO")
    .get();

  if (snapshot.empty) {
    console.log("✅ Nenhuma chamada encontrada com status PENDING_AUDIO.");
    return;
  }

  console.log(`⚠️ Foram encontradas ${snapshot.size} chamadas travadas em PENDING_AUDIO. Iniciando reset...`);

  // Usar batch para otimizar as atualizações no banco (máximo de 500 operações por batch no Firestore)
  const batches = [];
  let currentBatch = db.batch();
  let operationCount = 0;

  for (const doc of snapshot.docs) {
    currentBatch.update(doc.ref, {
      processingStatus: "QUEUED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Remove qualquer rastro de bloqueio anterior para garantir que o worker pegue "limpo"
      leaseOwner: admin.firestore.FieldValue.delete(),
      leaseUntil: admin.firestore.FieldValue.delete()
    });

    operationCount++;

    if (operationCount === 500) {
      batches.push(currentBatch.commit());
      currentBatch = db.batch();
      operationCount = 0;
    }
  }

  // Comita as operações restantes
  if (operationCount > 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
  console.log(`🎉 Todas as ${snapshot.size} chamadas foram resetadas para QUEUED com sucesso! O Worker vai começar a processá-las no próximo ciclo.`);
}

resetPendingAudioToQueued()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Ocorreu um erro ao resetar as chamadas:", err);
    process.exit(1);
  });
