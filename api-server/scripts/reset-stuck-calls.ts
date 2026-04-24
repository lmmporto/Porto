import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./api-server/chave-firebase.json.json", "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function resetCalls(ids) {
  for (const id of ids) {
    console.log(`Resetting Call ${id} to QUEUED...`);
    await db.collection('calls_analysis').doc(id).update({
      processingStatus: "QUEUED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      failureReason: admin.firestore.FieldValue.delete(),
      errorMessage: admin.firestore.FieldValue.delete()
    });
  }
}

const callIds = ['108141188139', '108144735838'];
resetCalls(callIds).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
