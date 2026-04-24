import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { fetchCall, fetchOwnerDetails, type CallData } from './hubspot.js';
import { AnalysisOrchestrator } from './analysis.orchestrator.js';
import { AnalysisRepository } from '../infrastructure/database/analysis.repository.js';
import { MetricsService } from './metrics.service.js';
import { AnalysisPolicy } from '../domain/analysis/analysis.policy.js';
import {
  CURRENT_ANALYSIS_VERSION,
  type OwnerDetails,
} from '../domain/analysis/analysis.types.js';
import {
  CallStatus,
  FailureReason,
} from '../domain/analysis/analysis.types.js';
import { RETRY_INTERVAL_MINUTES } from '../constants/call-processing.js';
import { withTimeout } from '../utils/timeout.js';
import { MIN_TRANSCRIPT_LENGTH } from '../domain/analysis/analysis.policy.js';

export interface ProcessCallResult {
  success: boolean;
  status?: CallStatus;
  reason?: string;
}

/**
 * 🏛️ ORQUESTRADOR DE PROCESSAMENTO: Coordena o ciclo de vida completo de uma chamada.
 * Desde a aquisição do lease até a persistência final e atualização de métricas.
 */
export class CallProcessingOrchestrator {
  /**
   * Mapeia os metadados de HubSpot + Owner para o payload base de persistência.
   * Garante que nenhum dado de identificação seja perdido em qualquer ramo do fluxo.
   */
  private static mapCallMetadata(call: CallData, owner: OwnerDetails) {
    const safeDate = call.timestamp ? new Date(call.timestamp) : new Date();
    const normalizedDate = Number.isNaN(safeDate.getTime()) ? new Date() : safeDate;

    return {
      callId: String(call.id),
      portalId: call.portalId ? String(call.portalId) : null,
      title: call.title || 'Ligação sem título',
      ownerId: call.ownerId || null,
      ownerName: owner.ownerName || 'Não identificado',
      ownerEmail: owner.ownerEmail || null,
      teamId: owner.teamId || null,
      teamName: owner.teamName || 'Sem equipe',
      durationMs: Number(call.durationMs || 0),
      wasConnected: Boolean(call.wasConnected),
      callTimestamp: Timestamp.fromDate(normalizedDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  /**
   * Orquestra o fluxo completo de processamento de uma chamada.
   */
  static async processCall(
    callId: string,
    workerId: string = 'unknown_worker'
  ): Promise<ProcessCallResult> {
    if (!callId) {
      throw new Error('callId não informado.');
    }

    // 1. Aquisição de Lease via Repositório (Garante exclusividade de processamento)
    const claimSuccess = await AnalysisRepository.claimCallLease(callId, workerId);

    if (!claimSuccess) {
      console.log(`[IGNORE] 🛡️ Call ${callId} já processada ou em andamento por outro worker.`);
      return { success: true, reason: 'ALREADY_PROCESSED_OR_CLAIMED' };
    }

    console.log(`\n[PROCESS] 🚀 Iniciando Orquestração da Call ${callId}...`);

    try {
      // 2. Sincronização com HubSpot (Infraestrutura / External Service)
      const call = await withTimeout(fetchCall(callId), 15_000, 'fetchCall');
      const owner: OwnerDetails = await withTimeout(
        fetchOwnerDetails(call.ownerId || null),
        10_000,
        'fetchOwnerDetails'
      );

      // Mapeamento de metadados — propagado em todos os pontos de saída
      const metadata = this.mapCallMetadata(call, owner);

      await AnalysisRepository.updateCall(callId, {
        ...metadata,
        lastStage: 'HUBSPOT_SYNC_DONE',
        lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Validação de Política (Domínio)
      const sdrRegistry = await AnalysisRepository.getSdrRegistry(owner.ownerEmail || '');
      const policy = AnalysisPolicy.isCallAllowed(call, owner, sdrRegistry);

      if (!policy.allowed) {
        console.log(`[GATEKEEPER] 🛡️ Call ${callId} ignorada. Motivo: ${policy.reason}`);
        await AnalysisRepository.updateCall(callId, {
          ...metadata, // ✅ Metadados preservados mesmo em SKIPPED
          processingStatus: CallStatus.SKIPPED,
          skipReason: policy.reason,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastStage: `SKIPPED_${policy.reason}`,
          lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
          leaseOwner: admin.firestore.FieldValue.delete(),
          leaseUntil: admin.firestore.FieldValue.delete(),
        });

        return {
          success: true,
          status: CallStatus.SKIPPED,
          reason: policy.reason,
        };
      }

      // 4. Recuperação de dados locais para controle de reprocessamento
      const callData = await AnalysisRepository.getCallData(callId);
      const isReprocess = Boolean(callData?.analyzedAt);
      const previousNota = Number(callData?.nota_spin || 0);

      // 5. Transcrição (via Orquestrador de Análise)
      let finalTranscript = '';
      let transcriptSource: string | null = null;

      if (callData?.hasTranscript && callData?.transcript) {
        finalTranscript = callData.transcript as string;
        transcriptSource = (callData.transcriptSource as string | null | undefined) || 'HUBSPOT';
      } else if (callData?.hasAudio && callData?.recordingUrl) {
        await AnalysisRepository.updateCall(callId, {
          lastStage: 'TRANSCRIBING',
          lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        call.recordingUrl = callData.recordingUrl as string;

        finalTranscript = await withTimeout(
          AnalysisOrchestrator.transcribeRecording(call),
          120_000,
          'transcribeRecording'
        );
        transcriptSource = 'AI_GENERATED';
      } else {
        // Sem áudio disponível — agenda retentativa
        const nextRetryDate = new Date();
        nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

        await AnalysisRepository.updateCall(callId, {
          ...metadata, // ✅ Metadados preservados em PENDING_AUDIO
          processingStatus: CallStatus.PENDING_AUDIO,
          nextRetryAt: Timestamp.fromDate(nextRetryDate),
          lastStage: 'PENDING_AUDIO',
          lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
          leaseOwner: admin.firestore.FieldValue.delete(),
          leaseUntil: admin.firestore.FieldValue.delete(),
        });

        return {
          success: true,
          status: CallStatus.PENDING_AUDIO,
          reason: 'WAITING_FOR_HUBSPOT_AUDIO',
        };
      }

      // Validação de tamanho mínimo de transcrição
      if (!finalTranscript || finalTranscript.trim().length < MIN_TRANSCRIPT_LENGTH) {
        const failReason = !finalTranscript
          ? FailureReason.TRANSCRIPT_EMPTY
          : FailureReason.TRANSCRIPT_TOO_SHORT;

        await AnalysisRepository.updateCall(callId, {
          ...metadata, // ✅ Metadados preservados em FAILED
          transcript: finalTranscript || '',
          transcriptSource,
          processingStatus: CallStatus.FAILED,
          failureReason: failReason,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastStage: 'FAILED_TRANSCRIPT_VALIDATION',
          lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
          leaseOwner: admin.firestore.FieldValue.delete(),
          leaseUntil: admin.firestore.FieldValue.delete(),
        });

        return {
          success: false,
          status: CallStatus.FAILED,
          reason: failReason,
        };
      }

      // 6. Análise via IA (via Orquestrador de Análise)
      call.transcript = finalTranscript;
      await AnalysisRepository.updateCall(callId, {
        lastStage: 'ANALYZING_GEMINI',
        lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const { analysis, rawPrompt, rawResponse, transcriptHash } = await withTimeout(
        AnalysisOrchestrator.analyzeCall(call, owner),
        90_000,
        'analyzeCall'
      );

      // 7. Persistência de Estatísticas Diárias
      await AnalysisRepository.updateDailyStats(
        { ownerEmail: owner.ownerEmail, ownerName: owner.ownerName },
        analysis,
        { isUpdate: isReprocess, previousNota }
      );

      // 8. Persistência Final do Documento da Chamada
      await AnalysisRepository.updateCall(callId, {
        ...metadata, // ✅ Metadados sempre presentes em DONE
        transcript: finalTranscript,
        transcriptSource,
        processingStatus: CallStatus.DONE,
        analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Campos de análise expandidos
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
        // Cache e versionamento
        analysisResult: analysis,
        lastAnalysisVersion: CURRENT_ANALYSIS_VERSION,
        lastTranscriptHash: transcriptHash,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        rawPrompt,
        rawResponse,
        // Limpeza de campos de erro anteriores
        failureReason: admin.firestore.FieldValue.delete(),
        errorMessage: admin.firestore.FieldValue.delete(),
        retryable: admin.firestore.FieldValue.delete(),
        nextRetryAt: admin.firestore.FieldValue.delete(),
        leaseOwner: admin.firestore.FieldValue.delete(),
        leaseUntil: admin.firestore.FieldValue.delete(),
        lastStage: 'DONE',
        lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 9. Trigger de Métricas (MetricsService)
      try {
        if (owner.ownerEmail) {
          await MetricsService.updateSDRMetrics(owner.ownerEmail);
          await MetricsService.updateGlobalSummary();
        }
      } catch (metricsError) {
        console.error('⚠️ [ORCHESTRATOR] Erro ao atualizar métricas:', metricsError);
      }

      return { success: true, status: CallStatus.DONE };

    } catch (error: any) {
      console.error(`❌ [ORCHESTRATOR ERROR] Falha crítica na call ${callId}:`, error);

      const nextRetryDate = new Date();
      nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

      await AnalysisRepository.updateCall(callId, {
        processingStatus: CallStatus.ERROR,
        failureReason: FailureReason.PROCESSING_EXCEPTION,
        errorMessage: error.message || 'Unexpected error',
        retryable: true,
        retryStage: 'ANALYSIS',
        nextRetryAt: Timestamp.fromDate(nextRetryDate),
        leaseOwner: admin.firestore.FieldValue.delete(),
        leaseUntil: admin.firestore.FieldValue.delete(),
        lastStage: 'ERROR',
        lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  }
}
