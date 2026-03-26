import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import { sleep } from "../utils.js";
import {
  fetchCall,
  fetchOwnerDetails,
  type CallData,
  type OwnerDetails,
} from "./hubspot.js";
import { 
  transcribeRecordingFromHubSpot, 
  analyzeCallWithGemini,
  updateDailyStats // ✅ Agora importado corretamente do arquivo de análise
} from "./analysis.service.js";

import type { SDRCall } from "../types.js";

const ALLOWED_TEAMS = ["Time William", "Equipe Alex", "Time Lucas", "Time Amanda", "SDR", "Pré-Venda"];
const BLOCKED_KEYWORDS = ["CX", "Suporte", "Atendimento", "Customer Success", "Financeiro", "GF"];

export async function processCall(callId: string): Promise<any> {
  if (!callId) throw new Error("callId não informado.");

  console.log(`\n[PROCESS] 🚀 Iniciando Call ${callId}...`);

  let call = await fetchCall(callId);
  const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);
  const teamName = owner.teamName || "Sem equipe";

  // --- FILTRO 1: EQUIPE ---
  const isAllowed = ALLOWED_TEAMS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));
  const isBlocked = BLOCKED_KEYWORDS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));

  if (isBlocked && !teamName.toUpperCase().includes("SDR")) { 
    return { success: true, reason: "TEAM_BLOCKED" };
  }

  if (!isAllowed) {
    return { success: true, reason: "TEAM_NOT_MONITORED" };
  }

  // --- FILTRO 2: TEMPO MÍNIMO (1 MINUTO) ---
  const DURATION_LIMIT = 60000; 
  const duration = Number(call.durationMs || 0);

  const basePayload = {
    callId: String(call.id),
    title: call.title || "Ligação sem título",
    ownerName: owner.ownerName || "Não identificado",
    teamName: teamName,
    durationMs: duration,
    wasConnected: call.wasConnected,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (duration > 0 && duration < DURATION_LIMIT) {
    console.log(`[SKIP] 🛑 Call ${callId} muito curta (${duration/1000}s).`);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SKIPPED_SHORT_CALL",
      nota_spin: 0
    }, { merge: true });
    return { success: true, reason: "CALL_TOO_SHORT" };
  }

  // --- BUSCA DE ÁUDIO ---
  for (let attempt = 1; attempt <= CONFIG.REFETCH_ATTEMPTS && !call.recordingUrl; attempt++) {
    await sleep(CONFIG.REFETCH_WAIT_MS);
    call = await fetchCall(callId);
  }

  if (!call.recordingUrl) {
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SKIPPED_FOR_AUDIT",
    }, { merge: true });
    return { success: true, reason: "NO_AUDIO_AVAILABLE" };
  }

  // --- ANÁLISE ---
  try {
    const transcript = await transcribeRecordingFromHubSpot(call);
    
    if (!transcript || transcript.length < 100) {
      await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
        ...basePayload,
        processingStatus: "EMPTY_TRANSCRIPT",
      }, { merge: true });
      return { success: true, reason: "INSUFFICIENT_CONTENT" };
    }

    call.transcript = transcript;
    const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

    // 🚩 COFRE DE SALDOS: Chama a função que você colocou no analysis.service
    await updateDailyStats(basePayload, analysis);

    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      transcript: transcript,
      processingStatus: "DONE",
      analyzedAt: FieldValue.serverTimestamp(),
      status_final: analysis.status_final,
      nota_spin: Number(analysis.nota_spin || 0),
      resumo: analysis.resumo,
      alertas: analysis.alertas,
      ponto_atencao: analysis.ponto_atencao,
      maior_dificuldade: analysis.maior_dificuldade,
      pontos_fortes: analysis.pontos_fortes,
      rawPrompt,
      rawResponse
    }, { merge: true });

    console.log(`[SUCCESS] 🎉 Call ${callId} finalizada.`);
    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    console.error(`[ERROR] ${callId}:`, error.message);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "FAILED_ANALYSIS",
      error: error.message
    }, { merge: true });
    throw error;
  }
}