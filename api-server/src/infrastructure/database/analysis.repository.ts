// src/infrastructure/database/analysis.repository.ts
import admin from 'firebase-admin';
import { FieldValue, Timestamp, Transaction } from 'firebase-admin/firestore';
import { db } from '../../firebase.js';
import {
  BUSINESS_TIMEZONE,
  type DailyStatsCallData,
  type AnalysisResult,
  type UpdateDailyStatsOptions,
  type DashboardStatsSummary,
  type SdrDoc,
  type AggregatedStatsDoc,
  type DbTransaction,
} from '../../domain/analysis/analysis.types.js';
import {
  CALLS_COLLECTION,
  DASHBOARD_STATS_COLLECTION,
  SDR_STATS_COLLECTION,
  SDR_REGISTRY_COLLECTION,
} from '../../domain/analysis/analysis.constants.js';
import {
  getValidNote,
  getNoteDelta,
} from '../../domain/analysis/analysis.schemas.js';
import {
  RankingLogic,
} from '../../domain/analysis/ranking.logic.js';
import {
  CallStatus,
} from '../../domain/analysis/analysis.types.js';
import {
  CALL_LEASE_MINUTES,
} from '../../domain/analysis/analysis.policy.js';
import { sanitizeText } from '../../utils.js';

/**
 * 🏛️ INFRAESTRUTURA: Repositório do Firestore para Análises.
 * Puramente responsável por persistir e recuperar dados. Sem regras de negócio.
 */
export class AnalysisRepository {
  /**
   * Obtém o ID do dia de negócio atual formatado (YYYY-MM-DD).
   */
  private static getBusinessDayId(date: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(date);
  }

  /**
   * Atualiza as estatísticas diárias de um SDR no Firestore.
   */
  static async updateDailyStats(
    callData: DailyStatsCallData,
    analysis: Pick<AnalysisResult, 'status_final' | 'nota_spin' | 'rota'>,
    options: UpdateDailyStatsOptions = {}
  ): Promise<void> {
    try {
      const dayId = this.getBusinessDayId();
      const statsRef = db.collection(DASHBOARD_STATS_COLLECTION).doc(dayId);
      const sdrKey = callData.ownerEmail || 'Desconhecido';
      const rota = analysis.rota || 'NAO_IDENTIFICADA';

      const currentNote = getValidNote(analysis);
      const noteDelta = getNoteDelta(currentNote, options);

      // Estrutura de atualização multidimensional
      const updatePayload: Record<string, unknown> = {
        // 1. Estatísticas por SDR
        [`sdr_ranking.${sdrKey}.total`]: FieldValue.increment(options.isUpdate ? 0 : 1),
        [`sdr_ranking.${sdrKey}.sum_notes`]: FieldValue.increment(noteDelta),
        [`sdr_ranking.${sdrKey}.ownerName`]: callData.ownerName || 'SDR',
        [`sdr_ranking.${sdrKey}.ownerEmail`]: sdrKey,
        [`sdr_ranking.${sdrKey}.routes.${rota}.total`]: FieldValue.increment(options.isUpdate ? 0 : 1),
        [`sdr_ranking.${sdrKey}.routes.${rota}.sum_notes`]: FieldValue.increment(noteDelta),

        // 2. Estatísticas por ROTA
        [`routes.${rota}.total_calls`]: FieldValue.increment(options.isUpdate ? 0 : 1),
        [`routes.${rota}.sum_notes`]: FieldValue.increment(noteDelta),

        // 3. Metadados globais do dia
        last_update: FieldValue.serverTimestamp(),
      };

      await statsRef.set(updatePayload, { merge: true });
    } catch (error) {
      console.error('❌ [REPOSITORY ERROR] updateDailyStats:', error);
      throw error;
    }
  }

  /**
   * Atualiza as estatísticas globais e do SDR de forma atômica.
   * Delega todos os cálculos para o RankingLogic (Domínio).
   */
  static async updateSdrGlobalStats(
    email: string,
    name: string,
    nota: number,
    transaction?: DbTransaction
  ): Promise<void> {
    const sdrId = email.replace(/[.$#[\]/]/g, '_');
    const dayId = this.getBusinessDayId();

    const sdrRef = db.collection(SDR_STATS_COLLECTION).doc(sdrId);
    const dailyRef = db.collection(DASHBOARD_STATS_COLLECTION).doc(dayId);
    const globalRef = db.collection(DASHBOARD_STATS_COLLECTION).doc('global_summary');

    const logic = async (t: Transaction) => {
      const [sdrSnap, dailySnap, globalSnap] = (await Promise.all([
        t.get(sdrRef),
        t.get(dailyRef),
        t.get(globalRef),
      ])) as admin.firestore.DocumentSnapshot[];

      const sdrData = (sdrSnap.exists ? sdrSnap.data() : {}) as SdrDoc;
      const dailyData = (dailySnap.exists ? dailySnap.data() : {}) as AggregatedStatsDoc;
      const globalData = (globalSnap.exists ? globalSnap.data() : {}) as AggregatedStatsDoc;

      // Delega os cálculos para o Domínio (RankingLogic)
      const sdrUpdate = RankingLogic.calculateSdrUpdate(sdrData, name, email, nota);
      const dailyUpdate = RankingLogic.calculateAggregatedUpdate(dailyData, nota);
      const globalUpdate = RankingLogic.calculateAggregatedUpdate(globalData, nota);

      t.set(sdrRef, { ...sdrUpdate, last_update: FieldValue.serverTimestamp() }, { merge: true });
      t.set(dailyRef, { ...dailyUpdate, last_update: FieldValue.serverTimestamp() }, { merge: true });
      t.set(globalRef, { ...globalUpdate, last_update: FieldValue.serverTimestamp() }, { merge: true });
    };

    if (transaction) {
      await logic(transaction);
      return;
    }

    await db.runTransaction(logic);
  }

  /**
   * Lista análises do Firestore com filtros.
   */
  static async listAnalyses(
    filters: { ownerEmail?: string },
    limitCount = 10
  ): Promise<{
    calls: Array<Record<string, unknown>>;
    lastVisible?: string;
  }> {
    let query: FirebaseFirestore.Query = db
      .collection(CALLS_COLLECTION)
      .orderBy('callTimestamp', 'desc');

    if (filters.ownerEmail) {
      query = query.where('ownerEmail', '==', filters.ownerEmail);
    }

    const snapshot = await query.limit(limitCount).get();

    return {
      calls: snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      lastVisible: snapshot.docs.at(-1)?.id,
    };
  }

  /**
   * Obtém o resumo global consolidado.
   */
  static async getGlobalSummary(): Promise<DashboardStatsSummary | null> {
    const summaryDoc = await db
      .collection(DASHBOARD_STATS_COLLECTION)
      .doc('global_summary')
      .get();

    if (!summaryDoc.exists) return null;
    return summaryDoc.data() as DashboardStatsSummary;
  }

  /**
   * Persiste o resultado da análise estratégica de equipe.
   */
  static async updateStrategyPersist(
    status: 'completed' | 'failed',
    data?: any
  ): Promise<void> {
    const summaryRef = db
      .collection(DASHBOARD_STATS_COLLECTION)
      .doc('global_summary');

    if (status === 'completed') {
      await summaryRef.set(
        {
          leitura_consolidada: {
            ...data,
            status: 'completed',
            updatedAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );
    } else {
      await summaryRef.set(
        {
          'leitura_consolidada.status': 'failed',
          'leitura_consolidada.updatedAt': new Date().toISOString(),
        },
        { merge: true }
      );
    }
  }

  /**
   * Tenta adquirir um lease para processar uma chamada de forma atômica.
   * Garante que dois workers não processem a mesma chamada simultaneamente.
   */
  static async claimCallLease(callId: string, workerId: string): Promise<boolean> {
    const callRef = db.collection(CALLS_COLLECTION).doc(callId);

    return await db.runTransaction(async (transaction) => {
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
  }

  /**
   * Obtém os dados de uma chamada do Firestore.
   */
  static async getCallData(callId: string): Promise<Record<string, unknown> | null> {
    const doc = await db.collection(CALLS_COLLECTION).doc(callId).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) : null;
  }

  /**
   * Atualiza os dados de uma chamada no Firestore de forma resiliente.
   * Usa .set(data, { merge: true }) para evitar erros se o documento não existir.
   */
  static async updateCall(callId: string, data: Record<string, unknown>): Promise<void> {
    await db.collection(CALLS_COLLECTION).doc(callId).set(data, { merge: true });
  }

  /**
   * Obtém os dados do registro de um SDR (tabela de permissões).
   */
  static async getSdrRegistry(email: string): Promise<Record<string, unknown> | null> {
    const cleanId = email.replace(/\./g, '_');
    const doc = await db.collection(SDR_REGISTRY_COLLECTION).doc(cleanId).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) : null;
  }

  static async updateGapSummary(
    ownerEmail: string | null | undefined,
    ownerName: string | null | undefined,
    gaps: string[],
    strengths: string[] = []
  ): Promise<void> {
    if (!gaps.length) return;

    const dayId = this.getBusinessDayId();
    const dailyRef = db.collection(DASHBOARD_STATS_COLLECTION).doc(dayId);
    const globalRef = db.collection(DASHBOARD_STATS_COLLECTION).doc('global_summary');

    const updatePayload: Record<string, unknown> = {
      last_update: FieldValue.serverTimestamp(),
    };

    for (const gap of gaps) {
      updatePayload[`recurrent_gaps.${gap}.count`] = FieldValue.increment(1);
      updatePayload[`recurrent_gaps.${gap}.label`] = gap;
    }

    for (const strength of strengths) {
      const safeStrength = sanitizeText(strength).slice(0, 80);
      if (!safeStrength) continue;

      updatePayload[`top_strengths.${safeStrength}.count`] = FieldValue.increment(1);
      updatePayload[`top_strengths.${safeStrength}.label`] = safeStrength;
    }

    if (ownerEmail) {
      const safeOwner = ownerEmail.replace(/[.$#[\]/]/g, '_');
      for (const gap of gaps) {
        updatePayload[`sdr_gap_summary.${safeOwner}.${gap}.count`] = FieldValue.increment(1);
        updatePayload[`sdr_gap_summary.${safeOwner}.${gap}.ownerEmail`] = ownerEmail;
        updatePayload[`sdr_gap_summary.${safeOwner}.${gap}.ownerName`] = ownerName || 'SDR';
      }
    }

    await Promise.all([
      dailyRef.set(updatePayload, { merge: true }),
      globalRef.set(updatePayload, { merge: true }),
    ]);
  }
}
