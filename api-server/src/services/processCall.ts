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
  updateDailyStats 
} from "./analysis.service.js";

const ALLOWED_TEAMS = ["Time William", "Equipe Alex", "Time Lucas", "Time Amanda", "SDR", "Pré-Venda"];
const BLOCKED_KEYWORDS = ["CX", "Suporte", "Atendimento", "Customer Success", "Financeiro", "GF"];

export async function processCall(callId: string): Promise<any> {
  if (!callId) throw new Error("callId não informado.");

  const callRef = db.collection(CONFIG.CALLS_COLLECTION).doc(callId);

  // 🚩 1. PROTEÇÃO CONTRA DUPLICIDADE (Idempotência)
  const existingDoc = await callRef.get();
  if (existingDoc.exists) {
    const status = existingDoc.data()?.processingStatus;
    if (status === "DONE" || status === "PROCESSING") {
      console.log(`[IGNORE] 🛡️ Call ${callId} já processada ou em andamento (Status: ${status})`);
      return { success: true, reason: "ALREADY_PROCESSED" };
    }
  }

  console.log(`\n[PROCESS] 🚀 Iniciando Call ${callId}...`);

  try {
    // Busca dados iniciais
    let call = await fetchCall(callId);
    const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);
    const teamName = (owner.teamName || "Sem equipe").trim();

    // --- FILTRO 1: EQUIPE ---
    const isAllowed = ALLOWED_TEAMS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));
    const isBlocked = BLOCKED_KEYWORDS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));

    // 🚩 LOG DE DEBUG PARA VER O FILTRO DE EQUIPE EM AÇÃO
    console.log(`[DEBUG - TEAM_FILTER] Call ${callId} - Team: "${teamName}"`);

    const basePayload = {
      callId: String(call.id),
      portalId: String(call.portalId), 
      title: call.title || "Ligação sem título",
      ownerName: owner.ownerName || "Não identificado",
      teamName: teamName,
      durationMs: Number(call.durationMs || 0),
      wasConnected: call.wasConnected,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 🚩 ALTERAÇÃO SÊNIOR: Registro imediato do VOLUME no cofre
    if (isAllowed && !isBlocked) {
        const mockInitialAnalysis = {
            status_final: 'NAO_IDENTIFICADO',
            nota_spin: null
        };
        // Registra o total_calls e inicializa o ranking do SDR
        await updateDailyStats(basePayload, mockInitialAnalysis);
    }

    // Marcamos como "PROCESSING" para evitar que webhooks duplicados iniciem outro processo
    await callRef.set({ 
      processingStatus: "PROCESSING", 
      updatedAt: FieldValue.serverTimestamp() 
    }, { merge: true });

    // Lógica de Bloqueio
    if (isBlocked && !teamName.toUpperCase().includes("SDR")) { 
      console.log(`[IGNORE] 🚫 Equipe bloqueada: ${teamName}`);
      await callRef.set({ ...basePayload, processingStatus: "SKIPPED_TEAM_BLOCKED" }, { merge: true });
      return { success: true, reason: "TEAM_BLOCKED" };
    }

    if (!isAllowed) {
      console.log(`[IGNORE] ⚠️ Equipe não monitorada: ${teamName}`);
      await callRef.set({ ...basePayload, processingStatus: "SKIPPED_TEAM_NOT_MONITORED" }, { merge: true });
      return { success: true, reason: "TEAM_NOT_MONITORED" };
    }

    // --- FILTRO 2: TEMPO MÍNIMO (1 MINUTO) ---
    const DURATION_LIMIT = 60000; 
    const duration = Number(call.durationMs || 0);

    if (duration < DURATION_LIMIT) {
      console.log(`[SKIP] 🛑 Call ${callId} muito curta ou zerada (${duration/1000}s).`);
      await callRef.set({
        ...basePayload,
        processingStatus: "SKIPPED_SHORT_CALL",
        nota_spin: 0
      }, { merge: true });
      return { success: true, reason: "CALL_TOO_SHORT" };
    }

    // --- BUSCA DE ÁUDIO (Retry Loop) ---
    for (let attempt = 1; attempt <= CONFIG.REFETCH_ATTEMPTS && !call.recordingUrl; attempt++) {
      console.log(`[RETRY] ⏳ Tentativa ${attempt} de buscar áudio para ${callId}...`);
      await sleep(CONFIG.REFETCH_WAIT_MS);
      call = await fetchCall(callId);
    }

    if (!call.recordingUrl) {
      console.log(`[SKIP] 🔇 Sem URL de áudio após retentativas.`);
      await callRef.set({
        ...basePayload,
        processingStatus: "SKIPPED_NO_AUDIO",
      }, { merge: true });
      return { success: true, reason: "NO_AUDIO_AVAILABLE" };
    }

    // --- ANÁLISE ---
    const transcript = await transcribeRecordingFromHubSpot(call);
    
    if (!transcript || transcript.length < 100) {
      console.log(`[SKIP] 📝 Transcrição insuficiente para análise.`);
      await callRef.set({
        ...basePayload,
        processingStatus: "SKIPPED_EMPTY_TRANSCRIPT",
      }, { merge: true });
      return { success: true, reason: "INSUFFICIENT_CONTENT" };
    }

    call.transcript = transcript;
    const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

    // 🚩 COFRE DE SALDOS: Atualiza nota e status sem incrementar o TOTAL de novo
    await updateDailyStats(basePayload, analysis, true);

    await callRef.set({
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

    console.log(`[SUCCESS] 🎉 Call ${callId} finalizada e salva no Cofre.`);
    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    console.error(`[ERROR] ❌ Erro na Call ${callId}:`, error.message);
    await callRef.set({
      processingStatus: "FAILED_ANALYSIS",
      error: error.message,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    throw error;
  }
}