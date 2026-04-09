import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { db } from "../firebase.js";
import { handleIncomingCall } from "../services/webhook.service.js";
import dotenv from 'dotenv';
import axios from 'axios';

async function debugCall() {
  const callId = "107693148236";
  console.log(`🔍 Debugando chamada: ${callId}`);

  // Simula o payload que o HubSpot enviaria
  const mockPayload = {
    callId: callId,
    objectId: callId,
    durationMs: 179000, // 2.9 minutos
    hasAudio: true
  };

  try {
    console.log("⏳ Chamando handleIncomingCall...");
    const result = await handleIncomingCall(mockPayload);
    console.log("✅ Resultado do processamento:", result);
  } catch (error) {
    console.error("❌ Erro no processamento:", error);
  }
}

debugCall();