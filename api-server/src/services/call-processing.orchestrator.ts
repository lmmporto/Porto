// api-server/src/services/call-processing.orchestrator.ts
import { Timestamp } from 'firebase-admin/firestore';
import { CallRepository } from '../infrastructure/database/call.repository.js';
import { HubspotCallService } from '../infrastructure/crm/hubspot-call.service.js';
import { MetricsService } from './metrics.service.js';
import { AnalysisPolicy } from '../domain/analysis/analysis.policy.js';
import {
  CallStatus,
  FailureReason,
  CURRENT_ANALYSIS_VERSION,
  type OwnerDetails,
} from '../domain/analysis/analysis.types.js';
import { MIN_TRANSCRIPT_LENGTH } from '../domain/analysis/analysis.policy.js';
import {
  transcribeRecordingFromHubSpot,
  analyzeCallWithGemini,
  updateDailyStats,
} from './analysis.service.js';
import { withTimeout } from '../utils/timeout.js';
import type { CallData } from './hubspot.js';

export interface ProcessCallResult {
  success: boolean;
  status?: CallStatus;
  reason?: string;
}

export class CallProcessingOrchestrator {

  static async processCall(
    callId: string,
    workerId: string = 'unknown_worker'
  ): Promise<ProcessCallResult> {
    if (!callId) {
      throw new Error('callId não informado.');
    }

    // PASSO 1: Adquirir lease (transação atômica via CallRepository → AnalysisRepository)
    const claimed = await CallRepository.claim(callId, workerId);
    if (!claimed) {
      console.log(`[IGNORE] 🛡️ Call ${callId} já processada ou em andamento.`);
      return { success: true, reason: 'ALREADY_PROCESSED_OR_CLAIMED' };
    }

    console.log(`\n[PROCESS] 🚀 Iniciando Call ${callId}...`);

    try {
      // PASSO 2: Buscar dados do HubSpot (com timeouts encapsulados)
      const { call, owner } = await HubspotCallService.fetchCallWithOwner(callId);

      await CallRepository.updateStage(callId, 'HUBSPOT_SYNC_DONE');

      // PASSO 3: Montar basePayload
      // Copie EXATAMENTE o objeto basePayload do processCall.ts original.
      const safeDate = call.timestamp ? new Date(call.timestamp) : new Date();
      const normalizedDate = Number.isNaN(safeDate.getTime()) ? new Date() : safeDate;

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
      };

      // PASSO 4: Verificar policy (gatekeeper)
      const sdrRegistry = await CallRepository.getSdrRegistry(owner.ownerEmail || '');

      const policy = AnalysisPolicy.isCallAllowed(call, owner, sdrRegistry as any);

      if (!policy.allowed) {
        console.log(`[GATEKEEPER] 🛡️ Call ${callId} ignorada. Motivo: ${policy.reason}`);
        await CallRepository.markSkipped(callId, basePayload, policy.reason!);
        return { success: true, status: CallStatus.SKIPPED, reason: policy.reason };
      }

      // PASSO 5: Buscar estado atual do documento (para reprocessamento)
      const callData = await CallRepository.findById(callId) as (CallData & {
        analyzedAt?: unknown;
        nota_spin?: number;
        ownerEmail?: string;
        hasTranscript?: boolean;
        transcript?: string;
        transcriptSource?: string;
        hasAudio?: boolean;
        recordingUrl?: string;
      } | null);

      if (!callData) {
        throw new Error('CALL_DOCUMENT_NOT_FOUND');
      }

      const isReprocess = Boolean(callData.analyzedAt);
      const previousNota = Number(callData.nota_spin || 0);

      // PASSO 6: Obter transcrição
      let finalTranscript = '';
      let transcriptSource: string | null = null;

      if (callData.hasTranscript && callData.transcript) {
        finalTranscript = callData.transcript;
        transcriptSource = callData.transcriptSource || 'HUBSPOT';

      } else if (callData.hasAudio && callData.recordingUrl) {
        await CallRepository.updateStage(callId, 'TRANSCRIBING');

        call.recordingUrl = callData.recordingUrl;

        finalTranscript = await withTimeout(
          transcribeRecordingFromHubSpot(call),
          120_000,
          'transcribeRecordingFromHubSpot'
        );
        transcriptSource = 'AI_GENERATED';

      } else {
        await CallRepository.markPendingAudio(callId, basePayload);
        return { success: true, status: CallStatus.PENDING_AUDIO, reason: 'WAITING_FOR_HUBSPOT_AUDIO' };
      }

      // PASSO 7: Validar transcrição
      if (!finalTranscript || finalTranscript.trim().length < MIN_TRANSCRIPT_LENGTH) {
        const reason = !finalTranscript
          ? FailureReason.TRANSCRIPT_EMPTY
          : FailureReason.TRANSCRIPT_TOO_SHORT;

        await CallRepository.markFailedTranscript(callId, basePayload, reason, finalTranscript || '', transcriptSource);
        return { success: false, status: CallStatus.FAILED, reason };
      }

      call.transcript = finalTranscript;

      // PASSO 8: Análise Gemini
      await CallRepository.updateStage(callId, 'ANALYZING_GEMINI');

      const { analysis, rawPrompt, rawResponse, transcriptHash } = await withTimeout(
        analyzeCallWithGemini(call, owner),
        90_000,
        'analyzeCallWithGemini'
      );

      // PASSO 9: Atualizar stats diárias
      await updateDailyStats(basePayload, analysis, {
        isUpdate: isReprocess,
        previousNota,
      });

      // PASSO 10: Persistir resultado DONE
      const analysisPayload = {
        transcript: finalTranscript,
        transcriptSource,
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
        rawPrompt,
        rawResponse,
      };

      await CallRepository.markDone(callId, basePayload, analysisPayload);

      // PASSO 11: Atualizar métricas (erro aqui não derruba o processamento)
      try {
        if (owner.ownerEmail) {
          await MetricsService.updateSDRMetrics(owner.ownerEmail);
          await MetricsService.updateGlobalSummary();
        }
      } catch (metricsError) {
        console.error('⚠️ Erro ao atualizar métricas:', metricsError);
      }

      return { success: true, status: CallStatus.DONE };

    } catch (error: any) {
      await CallRepository.markError(callId, error?.message || 'Unexpected processing error');
      throw error;
    }
  }
}
