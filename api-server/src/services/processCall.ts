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
import { transcribeRecordingFromHubSpot, analyzeCallWithGemini } from "./ai.js";

// 1. LISTA DE PESSOAS PERMITIDAS (Ajuste os nomes conforme aparecem no HubSpot)
const ALLOWED_OWNERS = ["Alex", "Amanda", "Lucas", "Will"];

async function markSkippedCall(
  call: CallData,
  reason: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await db
    .collection(CONFIG.CALLS_COLLECTION)
    .doc(String(call.id || (call as unknown as { callId?: string }).callId))
    .set(
      {
        callId: String(call.id),
        title: call.title || "Ligação sem título",
        ownerId: call.ownerId || null,
        processingStatus: "SKIPPED",
        skipReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
        ...extra,
      },
      { merge: true },
    );
}

export interface ProcessResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  callId: string;
  status_final?: string;
  error?: string;
  transcriptLength?: number;
}

export async function processCall(callId: string): Promise<ProcessResult> {
  if (!callId) throw new Error("callId não informado.");

  console.log(`[PROCESS] Iniciando Call ${callId}...`);

  let call = await fetchCall(callId);
  const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);

  const ownerExtra = {
    ownerId: owner.ownerId || null,
    ownerName: owner.ownerName || "Owner não identificado",
    ownerUserId: owner.userId || null,
    teamId: owner.teamId || null,
    teamName: owner.teamName || "Sem equipe",
    durationMs: Number(call.durationMs || 0),
  };

  // --- NOVOS FILTROS DE NEGÓCIO ---

  // Filtro 1: Apenas Alex, Amanda, Lucas ou Will
  const isAllowedOwner = ALLOWED_OWNERS.some(name => 
    owner.ownerName?.toLowerCase().includes(name.toLowerCase())
  );

  if (!isAllowedOwner) {
    console.log(`[PROCESS] Call ${callId} pulada: Owner "${owner.ownerName}" não está na lista permitida.`);
    await markSkippedCall(call, "OWNER_NOT_ALLOWED", ownerExtra);
    return { success: true, skipped: true, reason: "OWNER_NOT_ALLOWED", callId };
  }

  // Filtro 2: Duração Mínima
  if (call.durationMs && call.durationMs < CONFIG.MIN_DURATION_MS) {
    await markSkippedCall(call, "CALL_TOO_SHORT", ownerExtra);
    return { success: true, skipped: true, reason: "CALL_TOO_SHORT", callId };
  }

  // --- FIM DOS FILTROS ---

  for (
    let attempt = 1;
    attempt <= CONFIG.REFETCH_ATTEMPTS && !call.recordingUrl;
    attempt++
  ) {
    console.log(`[PROCESS] Aguardando URL da gravação (${attempt}/${CONFIG.REFETCH_ATTEMPTS})...`);
    await sleep(CONFIG.REFETCH_WAIT_MS);
    call = await fetchCall(callId);
  }

  if (!call.recordingUrl) {
    await markSkippedCall(call, "NO_RECORDING_URL", ownerExtra);
    return { success: true, skipped: true, reason: "NO_RECORDING_URL", callId };
  }

  console.log("[PROCESS] Transcrevendo áudio...");

  let transcript = "";
  try {
    transcript = await transcribeRecordingFromHubSpot(call);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await markSkippedCall(call, "TRANSCRIPTION_FAILED", {
      ...ownerExtra,
      recordingUrl: call.recordingUrl || null,
      transcriptionError: msg,
    });
    return { success: true, skipped: true, reason: "TRANSCRIPTION_FAILED", callId, error: msg };
  }

  call.transcript = transcript;
  call.transcriptSourceType = transcript ? "AUDIO_TRANSCRIPTION_GEMINI" : "FAILED";
  call.transcriptLength = transcript.length;

  if (!transcript) {
    await markSkippedCall(call, "EMPTY_TRANSCRIPT", { ...ownerExtra, recordingUrl: call.recordingUrl || null });
    return { success: true, skipped: true, reason: "EMPTY_TRANSCRIPT", callId };
  }

  if (call.transcriptLength < CONFIG.MIN_TEXT_LENGTH_FOR_ANALYSIS) {
    await markSkippedCall(call, "TRANSCRIPT_TOO_SHORT", {
      ...ownerExtra,
      recordingUrl: call.recordingUrl || null,
      transcriptLength: call.transcriptLength,
    });
    return { success: true, skipped: true, reason: "TRANSCRIPT_TOO_SHORT", callId, transcriptLength: call.transcriptLength };
  }

  console.log("[PROCESS] Analisando call com IA...");
  
  const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

  const payload = {
    callId: call.id,
    title: call.title || "Ligação sem título",
    ownerId: owner.ownerId || null,
    ownerName: owner.ownerName || "Owner não identificado",
    ownerUserId: owner.userId || null,
    teamId: owner.teamId || null,
    teamName: owner.teamName || "Sem equipe", // Aqui já vem a equipe principal vinda do seu fetchOwnerDetails
    durationMs: Number(call.durationMs || 0),
    recordingUrl: call.recordingUrl || null,
    processingStatus: "DONE",
    analyzedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    rawPrompt: rawPrompt || "Erro: Prompt não capturado",
    rawResponse: rawResponse || "Erro: Resposta não capturada",
    status_final: analysis.status_final,
    nota_spin: Number(analysis.nota_spin || 0),
    resumo: analysis.resumo || "Sem resumo disponível",
    alertas: Array.isArray(analysis.alertas) ? analysis.alertas : [],
    ponto_atencao: analysis.ponto_atencao || "",
    maior_dificuldade: analysis.maior_dificuldade || "",
    pontos_fortes: Array.isArray(analysis.pontos_fortes) ? analysis.pontos_fortes : [],
  };

  await db
    .collection(CONFIG.CALLS_COLLECTION)
    .doc(String(call.id))
    .set(payload, { merge: true });

  return {
    success: true,
    skipped: false,
    callId,
    status_final: analysis.status_final,
  };
}