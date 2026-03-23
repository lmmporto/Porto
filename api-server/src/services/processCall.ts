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

// Importação atualizada para o novo nome do arquivo
import { transcribeRecordingFromHubSpot, analyzeCallWithGemini } from "./analysis.service.js";

// LISTA DE EQUIPES PERMITIDAS PARA ANÁLISE
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

  // PAYLOAD BASE: Registro universal de todas as tentativas no Funil
  // IMPORTANTE: Adicionamos 'wasConnected' e 'outcome' aqui para o Dashboard individual funcionar
  const basePayload = {
    callId: String(call.id),
    title: call.title || "Ligação sem título",
    ownerId: owner.ownerId || null,
    ownerName: owner.ownerName || "Owner não identificado",
    ownerUserId: owner.userId || null,
    teamId: owner.teamId || null,
    teamName: owner.teamName || "Sem equipe",
    outcome: call.disposition || "Sem resultado", 
    wasConnected: call.wasConnected, // Flag crucial para o filtro "Conectadas"
    durationMs: Number(call.durationMs || 0),
    recordingUrl: call.recordingUrl || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // --- FILTRO 1: EQUIPE MONITORADA? ---
  const isAllowedTeam = ALLOWED_TEAMS.some(team => 
    owner.teamName?.toLowerCase().includes(team.toLowerCase())
  );

  if (!isAllowedTeam) {
    console.log(`[LOG] Call ${callId} de equipe não monitorada: ${owner.teamName}`);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SKIPPED_TEAM",
    }, { merge: true });
    return { success: true, reason: "TEAM_NOT_MONITORED" };
  }

  // --- FILTRO 2: DURAÇÃO MÍNIMA (Geralmente 2 min para análise profunda) ---
  if (call.durationMs && call.durationMs < CONFIG.MIN_DURATION_MS) {
    console.log(`[LOG] Call ${callId} curta (${call.durationMs}ms) de ${owner.ownerName}`);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "SHORT_CALL",
    }, { merge: true });
    return { success: true, reason: "CALL_TOO_SHORT" };
  }

  // --- DAQUI PARA BAIXO: SÓ EQUIPES CERTAS + LIGAÇÕES LONGAS ---

  // Polling para aguardar a URL da gravação (HubSpot demora alguns segundos para liberar o áudio)
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
    // IA - Transcrição e Análise (Gemini 2.5)
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

    // SALVAMENTO FINAL COM IA
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "DONE",
      analyzedAt: FieldValue.serverTimestamp(),
      
      // Dados da IA 2.5 (SPIN Coach)
      status_final: analysis.status_final,
      nota_spin: Number(analysis.nota_spin || 0),
      resumo: analysis.resumo,
      alertas: analysis.alertas,
      ponto_atencao: analysis.ponto_atencao,
      maior_dificuldade: analysis.maior_dificuldade,
      pontos_fortes: analysis.pontos_fortes,
      perguntas_sugeridas: analysis.perguntas_sugeridas || [],
      analise_escuta: analysis.analise_escuta || "",
      
      // Metadados de Auditoria
      rawPrompt,
      rawResponse
    }, { merge: true });

    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    console.error(`[ERROR] Falha na análise da Call ${callId}:`, error.message);
    await db.collection(CONFIG.CALLS_COLLECTION).doc(callId).set({
      ...basePayload,
      processingStatus: "FAILED_ANALYSIS",
      error: error.message
    }, { merge: true });
    throw error;
  }
}