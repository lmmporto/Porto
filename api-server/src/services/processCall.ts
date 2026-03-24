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

// IMPORTANTE: Ajuste o caminho abaixo para onde está o seu arquivo de types
// Se o arquivo está em src/types/index.ts, e este em src/services/processCall.ts, o caminho é ../types
import type { SDRCall } from "../types.js";

const ALLOWED_TEAMS = ["Time William", "Equipe Alex", "Time Lucas", "Time Amanda", "SDR", "Vendas"];
const BLOCKED_KEYWORDS = ["CX", "Suporte", "Atendimento", "Customer Success", "Financeiro"];

export async function processCall(callId: string): Promise<any> {
  if (!callId) throw new Error("callId não informado.");

  console.log(`[PROCESS] Iniciando Call ${callId}...`);

  let call = await fetchCall(callId);
  const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);
  const teamName = owner.teamName || "Sem equipe";

  // --- FILTRO 1: EQUIPE ---
  const isAllowed = ALLOWED_TEAMS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));
  const isBlocked = BLOCKED_KEYWORDS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));

  if (isBlocked || !isAllowed) {
    console.log(`[IGNORE] Equipe ${teamName} não monitorada.`);
    return { success: true, reason: "TEAM_NOT_MONITORED" };
  }

  // Payload Base (Dados comuns a todas as chamadas)
  const basePayload = {
    callId: String(call.id),
    title: call.title || "Ligação sem título",
    ownerName: owner.ownerName || "Não identificado",
    teamName: teamName,
    durationMs: Number(call.durationMs || 0),
    wasConnected: call.wasConnected,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // --- FILTRO 2: AUDITORIA (O "Lixo" que você quer manter no banco) ---
  const DURATION_LIMIT = 120000; // 2 minutos

  if (!call.wasConnected || (call.durationMs || 0) < DURATION_LIMIT) {
    console.log(`[AUDIT] Registrando tentativa de ${owner.ownerName} para volume.`);
    
    // SALVAMOS NO FIREBASE, mas com o status que o Front vai ignorar nas notas
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SKIPPED_FOR_AUDIT", // Marcar como rastro
      nota_spin: 0, 
    }, { merge: true });

    return { success: true, reason: "SAVED_AS_ATTEMPT_ONLY" };
  }

  // --- SE PASSOU PELO FILTRO: ANÁLISE PROFUNDA ---
  
  // Aguardar áudio
  for (let attempt = 1; attempt <= CONFIG.REFETCH_ATTEMPTS && !call.recordingUrl; attempt++) {
    await sleep(CONFIG.REFETCH_WAIT_MS);
    call = await fetchCall(callId);
  }

  if (!call.recordingUrl) {
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "NO_AUDIO",
    }, { merge: true });
    return { success: true, reason: "NO_RECORDING" };
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

    // SALVAMENTO FINAL (Status DONE = Contabiliza nota no Dashboard)
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

    console.log(`[SUCCESS] Call ${callId} analisada e salva.`);
    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    console.error(`[ERROR] Falha técnica na Call ${callId}:`, error.message);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "FAILED_ANALYSIS",
      error: error.message
    }, { merge: true });
    throw error;
  }
}