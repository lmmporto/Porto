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
import { transcribeRecordingFromHubSpot, analyzeCallWithGemini } from "./analysis.service.js";

const ALLOWED_TEAMS = [
  "Time William",
  "Equipe Alex",
  "Time Lucas",
  "Time Amanda"
];

export async function processCall(callId: string): Promise<any> {
  if (!callId) throw new Error("callId não informado.");

  console.log(`[PROCESS] Iniciando processamento da Call ${callId}...`);

  let call = await fetchCall(callId);
  const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);

  const basePayload = {
    callId: String(call.id),
    title: call.title || "Ligação sem título",
    ownerId: owner.ownerId || null,
    ownerName: owner.ownerName || "Owner não identificado",
    ownerUserId: owner.userId || null,
    teamId: owner.teamId || null,
    teamName: owner.teamName || "Sem equipe",
    outcome: call.disposition || "Sem resultado", 
    wasConnected: call.wasConnected, 
    durationMs: Number(call.durationMs || 0),
    recordingUrl: call.recordingUrl || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const isAllowedTeam = ALLOWED_TEAMS.some(team => 
    owner.teamName?.toLowerCase().includes(team.toLowerCase())
  );

  if (!isAllowedTeam) {
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SKIPPED_TEAM",
    }, { merge: true });
    return { success: true, reason: "TEAM_NOT_MONITORED" };
  }

  if (call.durationMs && call.durationMs < CONFIG.MIN_DURATION_MS) {
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SHORT_CALL",
    }, { merge: true });
    return { success: true, reason: "CALL_TOO_SHORT" };
  }

  for (let attempt = 1; attempt <= CONFIG.REFETCH_ATTEMPTS && !call.recordingUrl; attempt++) {
    await sleep(CONFIG.REFETCH_WAIT_MS);
    call = await fetchCall(callId);
  }

  if (!call.recordingUrl) {
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "NO_AUDIO",
    }, { merge: true });
    return { success: true, reason: "NO_RECORDING_URL" };
  }

  try {
    const transcript = await transcribeRecordingFromHubSpot(call);
    
    if (!transcript) {
      await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
        ...basePayload,
        processingStatus: "EMPTY_TRANSCRIPT",
      }, { merge: true });
      return { success: true, reason: "EMPTY_TRANSCRIPT" };
    }

    call.transcript = transcript;
    const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "DONE",
      analyzedAt: FieldValue.serverTimestamp(),
      status_final: analysis.status_final,
      nota_spin: Number(analysis.nota_spin || 0),
      resumo: analysis.resumo,
      alertas: analysis.alertas,
      ponto_atencao: analysis.ponto_atencao,
      maior_dificuldade: analysis.maior_dificuldade,
      pontos_fortes: analysis.pontos_fortes,
      perguntas_sugeridas: analysis.perguntas_sugeridas || [],
      analise_escuta: analysis.analise_escuta || "",
      rawPrompt,
      rawResponse
    }, { merge: true });

    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "FAILED_ANALYSIS",
      error: error.message
    }, { merge: true });
    throw error;
  }
}