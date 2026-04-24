import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

// Simular inicialização do firebase como no server
const serviceAccount = JSON.parse(readFileSync("./api-server/chave-firebase.json.json", "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCalls(ids) {
  for (const id of ids) {
    console.log(`\n--- Checking Call ${id} ---`);
    const snap = await db.collection('calls_analysis').doc(id).get();
    if (!snap.exists) {
      console.log("Document NOT FOUND");
      continue;
    }
    const data = snap.data();
    console.log("Status:", data.processingStatus);
    console.log("Owner:", data.ownerName, `(${data.ownerEmail})`);
    console.log("Duration:", data.durationMs / 1000, "s");
    console.log("Has Transcript:", !!data.transcript);
    console.log("Has Audio:", !!data.recordingUrl);
    console.log("Updated At:", data.updatedAt?.toDate?.() || data.updatedAt);
    if (data.errorMessage) console.log("Error Message:", data.errorMessage);
  }
}

const callIds = ['108141188139', '108144735838'];
checkCalls(callIds).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
