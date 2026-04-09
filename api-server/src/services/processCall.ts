import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import {
  fetchCall,
  fetchOwnerDetails,
  type CallData,
  type OwnerDetails,
} from "./hubspot.js";
import {
  transcribeRecordingFromHubSpot,
  analyzeCallWithGemini,
  updateDailyStats,
  updateSdrGlobalStats,
} from "./analysis.service.js";

const ALLOWED_TEAMS = ["Time William", "Equipe Alex", "Time Lucas", "Time Amanda"];
const BLOCKED_KEYWORDS = ["CX", "Suporte", "Atendimento", "Customer Success", "Financeiro", "GF"];

const MIN_TRANSCRIPT_LENGTH = 180;
const DURATION_LIMIT = 60000;

export async function processCall(callId: string): Promise<any> {
  if (!callId) {
    throw new Error("callId não informado.");
  }

  const callRef = db.collection(CONFIG.CALLS_COLLECTION).doc(callId);

  // Idempotência básica
  const existingDoc = await callRef.get();
  if (existingDoc.exists) {
    const status = existingDoc.data()?.processingStatus;
    if (status === "DONE" || status === "PROCESSING") {
      console.log(`[IGNORE] 🛡️ Call ${callId} já processada ou em andamento (Status: ${status})`);
      return { success: true, reason: "ALREADY_PROCESSED" };
    }
  }

  // Marca como PROCESSING sem depender de o doc já existir
  await callRef.set(
    {
      processingStatus: "PROCESSING",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`\n[PROCESS] 🚀 Iniciando Call ${callId}...`);

  try {
    // Busca dados atualizados do HubSpot
    const call = await fetchCall(callId);
    const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);
    const teamName = (owner.teamName || "Sem equipe").trim();

    const isAllowed = ALLOWED_TEAMS.some((t) =>
      teamName.toLowerCase().includes(t.toLowerCase())
    );
    const isBlocked = BLOCKED_KEYWORDS.some((t) =>
      teamName.toLowerCase().includes(t.toLowerCase())
    );

    console.log(`[DEBUG - TEAM_FILTER] Call ${callId} - Team: "${teamName}"`);

    const safeDate = call.timestamp ? new Date(call.timestamp) : new Date();
    const normalizedDate = Number.isNaN(safeDate.getTime()) ? new Date() : safeDate;

    const basePayload = {
      callId: String(call.id),
      portalId: call.portalId ? String(call.portalId) : null,
      title: call.title || "Ligação sem título",
      ownerId: call.ownerId || null,
      ownerName: owner.ownerName || "Não identificado",
      ownerEmail: owner.ownerEmail || null,
      teamName,
      durationMs: Number(call.durationMs || 0),
      wasConnected: Boolean(call.wasConnected),
      callTimestamp: admin.firestore.Timestamp.fromDate(normalizedDate),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Registra volume apenas para times elegíveis
    if (isAllowed && !isBlocked) {
      const mockInitialAnalysis = {
        status_final: "NAO_IDENTIFICADO",
        nota_spin: null,
      };
      await updateDailyStats(basePayload, mockInitialAnalysis);
    }

    // Filtro de time bloqueado
    if (isBlocked) {
      console.log(
        `[FAILED] ⚠️ Call ${callId} marcada como FAILED (Equipe bloqueada: ${teamName})`
      );
      await callRef.set(
        {
          ...basePayload,
          processingStatus: "FAILED",
          failureReason: "TEAM_BLOCKED",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { success: false, status: "FAILED", reason: "TEAM_BLOCKED" };
    }

    // Filtro de time não monitorado
    if (!isAllowed) {
      console.log(
        `[FAILED] ⚠️ Call ${callId} marcada como FAILED (Equipe não monitorada: ${teamName})`
      );
      await callRef.set(
        {
          ...basePayload,
          processingStatus: "FAILED",
          failureReason: "TEAM_NOT_MONITORED",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { success: false, status: "FAILED", reason: "TEAM_NOT_MONITORED" };
    }

    // Filtro de duração mínima
    const duration = Number(call.durationMs || 0);
    if (duration < DURATION_LIMIT) {
      console.log(
        `[FAILED] ⚠️ Call ${callId} marcada como FAILED (Muito curta: ${duration / 1000}s)`
      );
      await callRef.set(
        {
          ...basePayload,
          processingStatus: "FAILED",
          failureReason: "CALL_TOO_SHORT",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { success: false, status: "FAILED", reason: "CALL_TOO_SHORT" };
    }

    // Usa o documento consolidado do Firestore como fonte de verdade para transcript/áudio
    const docSnap = await callRef.get();
    if (!docSnap.exists) {
      throw new Error("CALL_DOCUMENT_NOT_FOUND");
    }

    const callData = docSnap.data() as CallData;

    let finalTranscript = "";
    let transcriptSource: string | null = null;

    // Prioridade 1: transcript já consolidada
    if (callData.hasTranscript && callData.transcript) {
      finalTranscript = callData.transcript;
      transcriptSource = callData.transcriptSource || "HUBSPOT";
      console.log(`✅ Usando transcrição existente para ${callId} (${transcriptSource})`);
    }
    // Prioridade 2: áudio disponível para IA
    else if (callData.hasAudio && callData.recordingUrl) {
      console.log(`🎙️ Transcrevendo áudio via IA para ${callId}`);
      call.recordingUrl = callData.recordingUrl;
      finalTranscript = await transcribeRecordingFromHubSpot(call);
      transcriptSource = "AI_GENERATED";
    }
    // Sem transcript e sem áudio
    else {
      console.log(`⚠️ [FAILED_NO_AUDIO] Sem transcrição ou áudio para ${callId}`);
      await callRef.set(
        {
          ...basePayload,
          processingStatus: "FAILED_NO_AUDIO",
          failureReason: "NO_AUDIO_OR_TRANSCRIPT",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        success: false,
        status: "FAILED_NO_AUDIO",
        reason: "NO_AUDIO_OR_TRANSCRIPT",
      };
    }

    // Falha de conteúdo: transcript vazia ou curta
    if (!finalTranscript || finalTranscript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      const reason =
        !finalTranscript || finalTranscript.trim().length === 0
          ? "TRANSCRIPT_EMPTY"
          : "TRANSCRIPT_TOO_SHORT";

      console.log(`⚠️ [FAILED] Conteúdo insuficiente para análise na call ${callId}.`);

      await callRef.set(
        {
          ...basePayload,
          transcript: finalTranscript || "",
          transcriptSource,
          processingStatus: "FAILED",
          failureReason: reason,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: false,
        status: "FAILED",
        reason,
      };
    }

    // Injeta transcript final no objeto da call para análise
    call.transcript = finalTranscript;

    const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

    // Atualiza o cofre com o resultado final
    await updateDailyStats(basePayload, analysis, true);

    // Salva tudo de forma terminal
    await callRef.set(
      {
        ...basePayload,
        transcript: finalTranscript,
        transcriptSource,
        processingStatus: "DONE",
        analyzedAt: FieldValue.serverTimestamp(),
        status_final: analysis.status_final,
        nota_spin: analysis.nota_spin !== null ? Number(analysis.nota_spin) : null,
        resumo: analysis.resumo,
        alertas: analysis.alertas,
        ponto_atencao: analysis.ponto_atencao,
        maior_dificuldade: analysis.maior_dificuldade,
        pontos_fortes: analysis.pontos_fortes,
        analise_escuta: analysis.analise_escuta,
        perguntas_sugeridas: analysis.perguntas_sugeridas,
        rawPrompt,
        rawResponse,
        failureReason: FieldValue.delete(),
        errorMessage: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Atualiza placar consolidado
    // Ajuste esta chamada se a assinatura real for diferente no seu analysis.service.ts
    await updateSdrGlobalStats(
      owner.ownerEmail || "",
      basePayload.ownerName,
      Number(analysis.nota_spin || 0)
    );

    console.log(`[SUCCESS] 🎉 Call ${callId} finalizada e salva no banco.`);
    return { success: true, status: "DONE" };
  } catch (error: any) {
    const message = error?.message || "Unexpected processing error";

    console.error(`[ERROR] ❌ Erro operacional na Call ${callId}:`, message);

    await callRef.set(
      {
        processingStatus: "ERROR",
        failureReason: "PROCESSING_EXCEPTION",
        errorMessage: message,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    throw error;
  }
}