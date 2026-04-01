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
  updateDailyStats,
  updateSdrGlobalStats 
} from "./analysis.service.js";

const ALLOWED_TEAMS = ["Time William", "Equipe Alex", "Time Lucas", "Time Amanda"];
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

    // 🚩 REGISTRO DE VOLUME: Se a equipe é permitida, já registramos o VOLUME no cofre
    if (isAllowed && !isBlocked) {
        const mockInitialAnalysis = {
            status_final: 'NAO_IDENTIFICADO',
            nota_spin: null
        };
        await updateDailyStats(basePayload, mockInitialAnalysis);
    }

    // Marcamos como "PROCESSING" temporariamente
    await callRef.set({ 
      processingStatus: "PROCESSING", 
      updatedAt: FieldValue.serverTimestamp() 
    }, { merge: true });

    // --- LOGICA DE LIMPEZA: Filtros de Equipe ---
    if (isBlocked && !teamName.toUpperCase().includes("SDR")) { 
      console.log(`[CLEANUP] 🧹 Equipe bloqueada: ${teamName}. Removendo registro.`);
      await callRef.delete();
      return { success: false, reason: "TEAM_BLOCKED_CLEANED" };
    }

    if (!isAllowed) {
      console.log(`[CLEANUP] 🧹 Equipe não monitorada: ${teamName}. Removendo registro.`);
      await callRef.delete();
      return { success: false, reason: "TEAM_NOT_MONITORED_CLEANED" };
    }

    // --- LOGICA DE LIMPEZA: Tempo Mínimo ---
    const DURATION_LIMIT = 60000; 
    const duration = Number(call.durationMs || 0);

    if (duration < DURATION_LIMIT) {
      console.log(`[CLEANUP] 🧹 Call ${callId} muito curta (${duration/1000}s). Removendo registro.`);
      await callRef.delete();
      return { success: false, reason: "CALL_TOO_SHORT_CLEANED" };
    }

    // --- BUSCA DE ÁUDIO (Retry Loop) ---
    for (let attempt = 1; attempt <= CONFIG.REFETCH_ATTEMPTS && !call.recordingUrl; attempt++) {
      console.log(`[RETRY] ⏳ Tentativa ${attempt} de buscar áudio para ${callId}...`);
      await sleep(CONFIG.REFETCH_WAIT_MS);
      call = await fetchCall(callId);
    }

    // --- LOGICA DE LIMPEZA: Sem Áudio ---
    if (!call.recordingUrl) {
      console.log(`[CLEANUP] 🧹 Sem URL de áudio após retentativas: ${callId}. Removendo registro.`);
      await callRef.delete();
      return { success: false, reason: "NO_AUDIO_CLEANED" };
    }

    // --- ANÁLISE ---
    const transcript = await transcribeRecordingFromHubSpot(call);
    
    // --- LOGICA DE LIMPEZA: Transcrição Insuficiente ---
    if (!transcript || transcript.length < 100) {
      console.log(`[CLEANUP] 🧹 Transcrição insuficiente para ${callId}. Removendo registro.`);
      await callRef.delete();
      return { success: false, reason: "INSUFFICIENT_CONTENT_CLEANED" };
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

    // 🚩 NOVO: Atualiza o Placar Consolidado do SDR após salvar como DONE
    await updateSdrGlobalStats(basePayload.ownerName, Number(analysis.nota_spin || 0));

    console.log(`[SUCCESS] 🎉 Call ${callId} finalizada e salva no Cofre.`);
    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    console.error(`[ERROR] ❌ Erro na Call ${callId}:`, error.message);
    // --- LOGICA DE LIMPEZA: Erro na IA/Processamento ---
    console.log(`[CLEANUP] 🧹 Erro no processamento. Removendo registro incompleto: ${callId}`);
    await callRef.delete();
    throw error;
  }
}