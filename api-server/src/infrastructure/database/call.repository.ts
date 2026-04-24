// api-server/src/infrastructure/database/call.repository.ts
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../firebase.js';
import { AnalysisRepository } from './analysis.repository.js';
import { CallStatus, FailureReason } from '../../domain/analysis/analysis.types.js';
import {
  CALLS_COLLECTION,
  RETRY_INTERVAL_MINUTES,
} from '../../domain/analysis/analysis.constants.js';

export class CallRepository {

  /**
   * Tenta adquirir o lease de processamento.
   * Delega para AnalysisRepository.claimCallLease (implementação atômica já existente).
   */
  static async claim(callId: string, workerId: string): Promise<boolean> {
    return AnalysisRepository.claimCallLease(callId, workerId);
  }

  /**
   * Busca o documento completo de uma call.
   * Delega para AnalysisRepository.getCallData.
   */
  static async findById(callId: string): Promise<Record<string, unknown> | null> {
    return AnalysisRepository.getCallData(callId);
  }

  /**
   * Busca o registro do SDR pelo email.
   * Delega para AnalysisRepository.getSdrRegistry.
   */
  static async getSdrRegistry(email: string): Promise<Record<string, unknown> | null> {
    return AnalysisRepository.getSdrRegistry(email);
  }

  /**
   * Atualiza somente o stage atual (uso frequente durante o processamento).
   */
  static async updateStage(callId: string, stage: string): Promise<void> {
    await db.collection(CALLS_COLLECTION).doc(callId).update({
      lastStage: stage,
      lastStageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Persiste o resultado DONE completo.
   * Copie EXATAMENTE o payload do callRef.set(...) do bloco DONE em processCall.ts.
   * Não resuma. Não omita campos. Mova integralmente.
   */
  static async markDone(
    callId: string,
    basePayload: Record<string, unknown>,
    analysisPayload: Record<string, unknown>
  ): Promise<void> {
    await db.collection(CALLS_COLLECTION).doc(callId).set(
      {
        ...basePayload,
        leaseOwner: FieldValue.delete(),
        leaseUntil: FieldValue.delete(),
        ...analysisPayload,
        processingStatus: CallStatus.DONE,
        analyzedAt: FieldValue.serverTimestamp(),
        processedAt: FieldValue.serverTimestamp(),
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
  }

  /**
   * Marca a call como SKIPPED.
   * Copie EXATAMENTE o payload do callRef.set(...) do bloco SKIPPED em processCall.ts.
   */
  static async markSkipped(
    callId: string,
    basePayload: Record<string, unknown>,
    reason: string
  ): Promise<void> {
    await db.collection(CALLS_COLLECTION).doc(callId).set(
      {
        ...basePayload,
        leaseOwner: FieldValue.delete(),
        leaseUntil: FieldValue.delete(),
        processingStatus: CallStatus.SKIPPED,
        skipReason: reason,
        processedAt: FieldValue.serverTimestamp(),
        lastStage: `SKIPPED_${reason}`,
        lastStageAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Marca a call como PENDING_AUDIO para retry posterior.
   * Copie EXATAMENTE o payload do bloco PENDING_AUDIO em processCall.ts.
   */
  static async markPendingAudio(
    callId: string,
    basePayload: Record<string, unknown>
  ): Promise<void> {
    const nextRetryDate = new Date();
    nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

    await db.collection(CALLS_COLLECTION).doc(callId).set(
      {
        ...basePayload,
        leaseOwner: FieldValue.delete(),
        leaseUntil: FieldValue.delete(),
        processingStatus: CallStatus.PENDING_AUDIO,
        nextRetryAt: Timestamp.fromDate(nextRetryDate),
        lastStage: 'PENDING_AUDIO',
        lastStageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Marca a call como FAILED (transcrição inválida).
   * Copie EXATAMENTE o payload do bloco FAILED em processCall.ts.
   */
  static async markFailedTranscript(
    callId: string,
    basePayload: Record<string, unknown>,
    reason: FailureReason,
    transcript: string,
    transcriptSource: string | null
  ): Promise<void> {
    await db.collection(CALLS_COLLECTION).doc(callId).set(
      {
        ...basePayload,
        leaseOwner: FieldValue.delete(),
        leaseUntil: FieldValue.delete(),
        transcript,
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
  }

  /**
   * Marca a call como ERROR (exceção inesperada).
   * Copie EXATAMENTE o payload do catch final em processCall.ts.
   */
  static async markError(callId: string, message: string): Promise<void> {
    const nextRetryDate = new Date();
    nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

    await db.collection(CALLS_COLLECTION).doc(callId).set(
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
  }

  /**
   * Busca calls por status para o worker consumir.
   * QUEUED: ordena por updatedAt asc, sem filtro de nextRetryAt.
   * PENDING_AUDIO / ERROR / RETRY: filtra por nextRetryAt <= now.
   */
  static async findByStatus(
    status: CallStatus | CallStatus[],
    opts: {
      limit?: number;
      nextRetryAtBefore?: FirebaseFirestore.Timestamp;
    } = {}
  ): Promise<FirebaseFirestore.QuerySnapshot> {
    let query: FirebaseFirestore.Query = db.collection(CALLS_COLLECTION);

    if (Array.isArray(status)) {
      query = query.where('processingStatus', 'in', status);
    } else {
      query = query.where('processingStatus', '==', status);
    }

    if (opts.nextRetryAtBefore) {
      query = query
        .where('nextRetryAt', '<=', opts.nextRetryAtBefore)
        .orderBy('nextRetryAt', 'asc');
    } else {
      query = query.orderBy('updatedAt', 'asc');
    }

    return query.limit(opts.limit ?? 10).get();
  }

  /**
   * Busca calls presas em PROCESSING com updatedAt > 1 hora atrás.
   * Usada pelo worker para recuperar chamadas órfãs após crash ou timeout.
   */
  static async findStaleProcessing(
    staleBefore: FirebaseFirestore.Timestamp,
    limit = 10
  ): Promise<FirebaseFirestore.QuerySnapshot> {
    return db
      .collection(CALLS_COLLECTION)
      .where('processingStatus', '==', CallStatus.PROCESSING)
      .where('updatedAt', '<=', staleBefore)
      .orderBy('updatedAt', 'asc')
      .limit(limit)
      .get();
  }
}
