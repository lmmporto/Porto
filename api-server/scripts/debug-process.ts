import admin from "firebase-admin";
import { readFileSync } from "fs";
import { processCall } from "../src/services/processCall.ts";
import dotenv from "dotenv";

dotenv.config({ path: "./api-server/.env" });

const serviceAccount = JSON.parse(readFileSync("./api-server/chave-firebase.json.json", "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function debugProcess(id) {
  console.log(`\nStarting manual debug for Call ${id}...`);
  try {
    const result = await processCall(id);
    console.log("Result:", result);
  } catch (err) {
    console.error("Manual Process Failed:", err);
  }
}

const callId = '108141188139';
debugProcess(callId).then(() => process.exit(0));
