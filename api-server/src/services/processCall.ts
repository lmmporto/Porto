import admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import {
  fetchCall,
  fetchOwnerDetails,
  type CallData,
} from './hubspot.js';
import {
  transcribeRecordingFromHubSpot,
  analyzeCallWithGemini,
  updateDailyStats,
} from './analysis.service.js';
import {
  CURRENT_ANALYSIS_VERSION,
  type OwnerDetails,
} from '../domain/analysis/analysis.types.js';
import { MetricsService } from './metrics.service.js';
import {
  CallStatus,
  SkipReason,
  FailureReason,
  RETRY_INTERVAL_MINUTES,
} from '../constants/call-processing.js';
import {
  CALLS_COLLECTION,
  SDR_REGISTRY_COLLECTION,
} from '../domain/analysis/analysis.constants.js';
import {
  AnalysisPolicy,
  MIN_TRANSCRIPT_LENGTH,
  MIN_CALL_DURATION_MS,
  CALL_LEASE_MINUTES,
} from '../domain/analysis/analysis.policy.js';
import { withTimeout } from '../utils/timeout.js';


export interface ProcessCallResult {
  success: boolean;
  status?: CallStatus;
  reason?: string;
}

export async function processCall(
  callId: string,
  workerId: string = 'unknown_worker'
): Promise<ProcessCallResult> {
  if (!callId) {
    throw new Error('callId não informado.');
  }

  const callRef = db.collection(CALLS_COLLECTION).doc(callId);

  const claimSuccess = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(callRef);
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + CALL_LEASE_MINUTES * 60 * 1000);

    if (doc.exists) {
      const data = doc.data() || {};
      const status = data.processingStatus;
      const currentLeaseOwner = data.leaseOwner;
      const currentLeaseUntil = data.leaseUntil?.toDate?.();

      if (status === CallStatus.DONE) {
        return false;
      }

      if (
        status === CallStatus.PROCESSING &&
        currentLeaseOwner &&
        currentLeaseOwner !== workerId &&
        currentLeaseUntil &&
        currentLeaseUntil > now
      ) {
        return false;
      }
    }

    transaction.set(
      callRef,
      {
        processingStatus: CallStatus.PROCESSING,
        leaseOwner: workerId,
        leaseUntil: Timestamp.fromDate(leaseUntil),
        processingStartedAt: FieldValue.serverTimestamp(),
        lastWorkerId: workerId,
        lastStage: 'CLAIM_ACQUIRED',
        lastStageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  });

  if (!claimSuccess) {
    console.log(`[IGNORE] 🛡️ Call ${callId} já processada ou em andamento.`);
    return {
      success: true,
      reason: 'ALREADY_PROCESSED_OR_CLAIMED',
    };
  }

  console.log(`\n[PROCESS] 🚀 Iniciando Call ${callId}...`);

  try {
    const call = await withTimeout(fetchCall(callId), 15_000, 'fetchCall');

    const owner: OwnerDetails = await withTimeout(
      fetchOwnerDetails(call.ownerId || null),
      10_000,
      'fetchOwnerDetails'
    );

    const teamName = (owner.teamName || 'Sem equipe').trim();

    await callRef.update({
      lastStage: 'HUBSPOT_SYNC_DONE',
      lastStageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const safeDate = call.timestamp ? new Date(call.timestamp) : new Date();
    const normalizedDate = Number.isNaN(safeDate.getTime())
      ? new Date()
      : safeDate;

    const basePayload = {
      callId: String(call.id),
      portalId: call.portalId ? String(call.portalId) : null,
      title: call.title || 'Ligação sem título',
      ownerId: call.ownerId || null,
      ownerName: owner.ownerName || 'Não identificado',
      ownerEmail: owner.ownerEmail || null,
      durationMs: Number(call.durationMs || 0),
      wasConnected: Boolean(call.wasConnected),
      callTimestamp: Timestamp.fromDate(normalizedDate),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const releaseLeasePayload = {
      leaseOwner: FieldValue.delete(),
      leaseUntil: FieldValue.delete(),
    };

    const cleanId = (owner.ownerEmail || '').replace(/\./g, '_');
    const sdrRegistrySnap = await db
      .collection(SDR_REGISTRY_COLLECTION)
      .doc(cleanId)
      .get();
    const sdrRegistry = sdrRegistrySnap.exists ? sdrRegistrySnap.data() : null;

    const policy = AnalysisPolicy.isCallAllowed(call, owner, sdrRegistry as any);

    if (!policy.allowed) {
      console.log(`[GATEKEEPER] 🛡️ Call ${callId} ignorada. Motivo: ${policy.reason}`);
      await callRef.set(
        {
          ...basePayload,
          ...releaseLeasePayload,
          processingStatus: CallStatus.SKIPPED,
          skipReason: policy.reason,
          processedAt: FieldValue.serverTimestamp(),
          lastStage: `SKIPPED_${policy.reason}`,
          lastStageAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        status: CallStatus.SKIPPED,
        reason: policy.reason,
      };
    }

    const docSnap = await callRef.get();

    if (!docSnap.exists) {
      throw new Error('CALL_DOCUMENT_NOT_FOUND');
    }

    const callData = docSnap.data() as CallData & {
      analyzedAt?: unknown;
      nota_spin?: number;
      ownerEmail?: string;
      hasTranscript?: boolean;
      transcript?: string;
      transcriptSource?: string;
      hasAudio?: boolean;
      recordingUrl?: string;
    };

    const isReprocess = Boolean(callData.analyzedAt);
    const previousNota = Number(callData.nota_spin || 0);

    const sdrEmail = callData.ownerEmail || owner.ownerEmail;


    let finalTranscript = '';
    let transcriptSource: string | null = null;

    if (callData.hasTranscript && callData.transcript) {
      finalTranscript = callData.transcript;
      transcriptSource = callData.transcriptSource || 'HUBSPOT';
    } else if (callData.hasAudio && callData.recordingUrl) {
      await callRef.update({
        lastStage: 'TRANSCRIBING',
        lastStageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      call.recordingUrl = callData.recordingUrl;

      finalTranscript = await withTimeout(
        transcribeRecordingFromHubSpot(call),
        120_000,
        'transcribeRecordingFromHubSpot'
      );

      transcriptSource = 'AI_GENERATED';
    } else {
      const nextRetryDate = new Date();
      nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

      await callRef.set(
        {
          ...basePayload,
          ...releaseLeasePayload,
          processingStatus: CallStatus.PENDING_AUDIO,
          nextRetryAt: Timestamp.fromDate(nextRetryDate),
          lastStage: 'PENDING_AUDIO',
          lastStageAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        status: CallStatus.PENDING_AUDIO,
        reason: 'WAITING_FOR_HUBSPOT_AUDIO',
      };
    }

    if (!finalTranscript || finalTranscript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      const reason = !finalTranscript
        ? FailureReason.TRANSCRIPT_EMPTY
        : FailureReason.TRANSCRIPT_TOO_SHORT;

      await callRef.set(
        {
          ...basePayload,
          ...releaseLeasePayload,
          transcript: finalTranscript || '',
          transcriptSource,
          processingStatus: CallStatus.FAILED,
          failureReason: reason,
          processedAt: FieldValue.serverTimestamp(),
          lastStage: 'FAILED_TRANSCRIPT_VALIDATION',
          lastStageAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: false,
        status: CallStatus.FAILED,
        reason,
      };
    }

    call.transcript = finalTranscript;

    await callRef.update({
      lastStage: 'ANALYZING_GEMINI',
      lastStageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const { analysis, rawPrompt, rawResponse, transcriptHash } = await withTimeout(
      analyzeCallWithGemini(call, owner),
      90_000,
      'analyzeCallWithGemini'
    );

    await updateDailyStats(basePayload, analysis, {
      isUpdate: isReprocess,
      previousNota,
    });

    await callRef.set(
      {
        ...basePayload,
        ...releaseLeasePayload,

        transcript: finalTranscript,
        transcriptSource,

        processingStatus: CallStatus.DONE,
        analyzedAt: FieldValue.serverTimestamp(),

        status_final: analysis.status_final,
        rota: analysis.rota,
        produto_principal: analysis.produto_principal,
        objecoes: analysis.objecoes,
        insights_estrategicos: analysis.insights_estrategicos,
        nota_spin: analysis.nota_spin !== null ? Number(analysis.nota_spin) : null,
        resumo: analysis.resumo,
        alertas: analysis.alertas,
        ponto_atencao: analysis.ponto_atencao,
        maior_dificuldade: analysis.maior_dificuldade,
        pontos_fortes: analysis.pontos_fortes,
        analise_escuta: analysis.analise_escuta,
        perguntas_sugeridas: analysis.perguntas_sugeridas,
        playbook_detalhado: analysis.playbook_detalhado,

        analysisResult: analysis,
        lastAnalysisVersion: CURRENT_ANALYSIS_VERSION,
        lastTranscriptHash: transcriptHash,

        processedAt: FieldValue.serverTimestamp(),
        rawPrompt,
        rawResponse,

        failureReason: FieldValue.delete(),
        errorMessage: FieldValue.delete(),
        retryable: FieldValue.delete(),
        nextRetryAt: FieldValue.delete(),

        lastStage: 'DONE',
        lastStageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    try {
      if (owner.ownerEmail) {
        await MetricsService.updateSDRMetrics(owner.ownerEmail);
        await MetricsService.updateGlobalSummary();
      }
    } catch (metricsError) {
      console.error('⚠️ Erro ao atualizar métricas:', metricsError);
    }

    return {
      success: true,
      status: CallStatus.DONE,
    };
  } catch (error: any) {
    const message = error?.message || 'Unexpected processing error';

    const nextRetryDate = new Date();
    nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

    await callRef.set(
      {
        processingStatus: CallStatus.ERROR,
        failureReason: FailureReason.PROCESSING_EXCEPTION,
        errorMessage: message,
        retryable: true,
        retryStage: 'ANALYSIS',
        nextRetryAt: Timestamp.fromDate(nextRetryDate),
        leaseOwner: FieldValue.delete(),
        leaseUntil: FieldValue.delete(),
        lastStage: 'ERROR',
        lastStageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    throw error;
  }
}