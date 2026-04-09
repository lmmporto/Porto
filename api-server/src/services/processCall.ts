import admin from "firebase-admin";
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

  // 1. Marcar como em processamento ativo e lockar de outras threads
  await callRef.update({
    processingStatus: 'PROCESSING',
    updatedAt: FieldValue.serverTimestamp()
  });

  console.log(`\n[PROCESS] 🚀 Iniciando Call ${callId}...`);

  try {
    // Busca dados iniciais
    let call = await fetchCall(callId);
    const owner: OwnerDetails = await fetchOwnerDetails(call.ownerId || null);
    const teamName = (owner.teamName || "Sem equipe").trim();

    // --- FILTRO 1: EQUIPE ---
    const isAllowed = ALLOWED_TEAMS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));
    const isBlocked = BLOCKED_KEYWORDS.some(t => teamName.toLowerCase().includes(t.toLowerCase()));

    console.log(`[DEBUG - TEAM_FILTER] Call ${callId} - Team: "${teamName}"`);

    const basePayload = {
      callId: String(call.id),
      portalId: String(call.portalId), 
      title: call.title || "Ligação sem título",
      ownerName: owner.ownerName || "Não identificado",
      teamName: teamName,
      durationMs: Number(call.durationMs || 0),
      wasConnected: call.wasConnected,
      
      // 🚩 TRANSFORMAÇÃO DE DATA: HubSpot String -> Firestore Timestamp
      callTimestamp: admin.firestore.Timestamp.fromDate(new Date(call.timestamp)), 
      
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 🚩 REGISTRO DE VOLUME: Se a equipe é permitida, registramos o VOLUME no cofre
    if (isAllowed && !isBlocked) {
        const mockInitialAnalysis = {
            status_final: 'NAO_IDENTIFICADO',
            nota_spin: null
        };
        await updateDailyStats(basePayload, mockInitialAnalysis);
    }

    // O registro já foi blindado globalmente como PROCESSING antes do try
    // --- LOGICA DE LIMPEZA: Filtros de Equipe ---
      console.log(`[FAILED] ⚠️ Call ${callId} marcada como FAILED (Equipe bloqueada: ${teamName})`);
      await callRef.set({
        processingStatus: "FAILED",
        failureReason: "TEAM_BLOCKED",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: false, reason: "TEAM_BLOCKED" };
    }

    if (!isAllowed) {
      console.log(`[FAILED] ⚠️ Call ${callId} marcada como FAILED (Equipe não monitorada: ${teamName})`);
      await callRef.set({
        processingStatus: "FAILED",
        failureReason: "TEAM_NOT_MONITORED",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: false, reason: "TEAM_NOT_MONITORED" };
    }

    // --- LOGICA DE LIMPEZA: Tempo Mínimo ---
    const DURATION_LIMIT = 60000; 
    const duration = Number(call.durationMs || 0);

    if (duration < DURATION_LIMIT) {
      console.log(`[FAILED] ⚠️ Call ${callId} marcada como FAILED (Muito curta: ${duration/1000}s)`);
      await callRef.set({
        processingStatus: "FAILED",
        failureReason: "CALL_TOO_SHORT",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: false, reason: "CALL_TOO_SHORT" };
    }

    // --- ROTEAMENTO DE DADOS: Otimização de Transcrição ---
    // 1. Recuperar dados exatos consolidados no banco de dados
    const docSnap = await callRef.get();
    const callData = docSnap.data() as CallData;

    let finalTranscript = '';
    let source = '';

    // 2. Prioridade: Transcrição nativa do HubSpot
    if (callData.hasTranscript && callData.transcript) {
      finalTranscript = callData.transcript;
      source = callData.transcriptSource || 'HUBSPOT';
      console.log(`✅ Usando transcrição nativa do HubSpot para ${callId}`);
    } 
    // 3. Fallback: Transcrição por IA (se houver áudio)
    else if (callData.hasAudio && callData.recordingUrl) {
      console.log(`🎙️ Transcrevendo áudio via IA para ${callId}`);
      // Asseguramos callUrl atualizado ao método de IA
      call.recordingUrl = callData.recordingUrl;
      finalTranscript = await transcribeRecordingFromHubSpot(call);
      source = 'AI_GENERATED';
    } 
    // 4. Falha: Sem recursos para processar
    else {
      console.error(`❌ Falha: Sem transcrição ou áudio para ${callId}`);
      await callRef.set({ 
        processingStatus: 'FAILED_NO_AUDIO', 
        failureReason: 'NO_AUDIO_OR_TRANSCRIPT',
        updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });
      return { success: false, reason: "NO_AUDIO_OR_TRANSCRIPT" };
    }

    const MIN_TRANSCRIPT_LENGTH = 180;

    // --- LOGICA DE LIMPEZA: Transcrição Insuficiente ---
    if (!finalTranscript || finalTranscript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      console.log(`⚠️ [FAILED] Conteúdo insuficiente para análise na call ${callId}.`);

      await callRef.set({
        processingStatus: 'FAILED',
        failureReason: !finalTranscript || finalTranscript.trim().length === 0
          ? 'TRANSCRIPT_EMPTY'
          : 'TRANSCRIPT_TOO_SHORT',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return {
        success: false,
        status: 'FAILED',
        reason: !finalTranscript || finalTranscript.trim().length === 0
          ? 'TRANSCRIPT_EMPTY'
          : 'TRANSCRIPT_TOO_SHORT',
      };
    }

    call.transcript = finalTranscript;
    const { analysis, rawPrompt, rawResponse } = await analyzeCallWithGemini(call, owner);

    // 🚩 COFRE DE SALDOS: Atualiza nota e status
    await updateDailyStats(basePayload, analysis, true);

    // 🚩 SALVAMENTO FINAL: Garante que TUDO seja persistido
    await callRef.set({
      ...basePayload,
      transcript: finalTranscript,
      transcriptSource: source,
      processingStatus: "DONE",
      analyzedAt: FieldValue.serverTimestamp(),
      status_final: analysis.status_final,
      nota_spin: Number(analysis.nota_spin || 0),
      resumo: analysis.resumo,
      alertas: analysis.alertas,
      ponto_atencao: analysis.ponto_atencao,
      maior_dificuldade: analysis.maior_dificuldade,
      pontos_fortes: analysis.pontos_fortes,
      
      // 🚩 CAMPOS OBRIGATÓRIOS PARA O FRONTEND
      analise_escuta: analysis.analise_escuta,
      perguntas_sugeridas: analysis.perguntas_sugeridas,

      rawPrompt,
      rawResponse
    }, { merge: true });

    // 🚩 PLACAR CONSOLIDADO
    await updateSdrGlobalStats(basePayload.ownerName, Number(analysis.nota_spin || 0));

    console.log(`[SUCCESS] 🎉 Call ${callId} finalizada e salva no banco.`);
    return { success: true, status: "ANALYZED" };

  } catch (error: any) {
    const message = error?.message || 'Unexpected processing error';

    console.error(`[ERROR] ❌ Erro operacional na Call ${callId}:`, message);

    await callRef.set({
      processingStatus: 'ERROR',
      failureReason: 'PROCESSING_EXCEPTION',
      errorMessage: message,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    throw error;
  }
}