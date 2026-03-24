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

// 1. Definição de quem entra no Dashboard (Vendas/SDR)
const ALLOWED_TEAMS = [
  "Time William",
  "Equipe Alex",
  "Time Lucas",
  "Time Amanda",
  "SDR", 
  "Vendas"
];

// 2. Definição de quem NUNCA entra (CX/Suporte/Financeiro)
const BLOCKED_KEYWORDS = ["CX", "Suporte", "Atendimento", "Customer Success", "Financeiro"];

export async function processCall(callId: string): Promise<any> {
  if (!callId) throw new Error("callId não informado.");

  console.log(`[PROCESS] Iniciando processamento da Call ${callId}...`);

  // Buscamos os dados da chamada e do proprietário no HubSpot
  let call = await fetchCall(callId);
  const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);
  const teamName = owner.teamName || "Sem equipe";

  // --- FILTRO 1: SEGURANÇA DE EQUIPE (Porta de Cadeia) ---
  const isAllowed = ALLOWED_TEAMS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));
  const isBlocked = BLOCKED_KEYWORDS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));

  if (isBlocked || !isAllowed) {
    console.log(`[IGNORE] Call ${callId} descartada. Equipe: ${teamName} (Não monitorada).`);
    return { success: true, reason: "TEAM_NOT_MONITORED_SILENT_IGNORE" };
  }

  // Se chegou aqui, preparamos o registro base para o Firebase
  const basePayload = {
    callId: String(call.id),
    title: call.title || "Ligação sem título",
    ownerId: owner.ownerId || null,
    ownerName: owner.ownerName || "Owner não identificado",
    ownerUserId: owner.userId || null,
    teamId: owner.teamId || null,
    teamName: teamName,
    outcome: call.disposition || "Sem resultado", 
    wasConnected: call.wasConnected, 
    durationMs: Number(call.durationMs || 0),
    recordingUrl: call.recordingUrl || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // --- FILTRO 2: TRAVA ANTI-CAIXA POSTAL (Nova!) ---
  // Se call.wasConnected for false, a ligação não teve conversa real (Douglas De Paula Finger case).
  // Registramos apenas como tentativa no Dashboard, sem nota SPIN.
  if (!call.wasConnected) {
    console.log(`[LOG] Call ${callId} não conectada (Caixa Postal ou < 20s). Salvando apenas como tentativa.`);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "NOT_CONNECTED", // Evita que a IA analise e dê nota 0.0
    }, { merge: true });
    
    return { success: true, reason: "CALL_NOT_CONNECTED_SKIPPED_AI" };
  }

  // --- FILTRO 3: DURAÇÃO MÍNIMA PARA IA ---
  // Se conectou, mas foi muito rápida (ex: "Alô? Não posso falar"), registramos mas não analisamos.
  if (call.durationMs && call.durationMs < CONFIG.MIN_DURATION_MS) {
    console.log(`[LOG] Call ${callId} muito curta para análise profunda.`);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SHORT_CALL",
    }, { merge: true });
    return { success: true, reason: "CALL_TOO_SHORT_FOR_AI" };
  }

  // --- FLUXO DE ANÁLISE PROFUNDA (Só para chamadas reais e longas) ---

  // Polling para aguardar o HubSpot liberar a URL do áudio
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
    // 1. Transcrição (Gemini 1.5 Flash)
    const transcript = await transcribeRecordingFromHubSpot(call);
    
    if (!transcript) {
      await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
        ...basePayload,
        processingStatus: "EMPTY_TRANSCRIPT",
      }, { merge: true });
      return { success: true, reason: "EMPTY_TRANSCRIPT" };
    }

    // 2. Análise de SPIN Selling (Gemini 2.5 Coach)
    call.transcript = transcript;
    const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

    // 3. Salvamento Final com Nota e Insights
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
    console.error(`[ERROR] Falha na IA da Call ${callId}:`, error.message);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "FAILED_ANALYSIS",
      error: error.message
    }, { merge: true });
    throw error;
  }
}