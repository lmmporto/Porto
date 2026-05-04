// api-server/src/infrastructure/database/sdr.repository.ts
import { FieldValue } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { db } from '../../firebase.js';
import { CallStatus } from '../../domain/analysis/analysis.types.js';
import {
  SDR_REGISTRY_COLLECTION,
  CALLS_COLLECTION,
} from '../../domain/analysis/analysis.constants.js';

// Nomes das coleções usados pelo MetricsService original
// (distintos das coleções do RankingLogic — não unificar agora)
const SDR_STATS_LEGACY_COLLECTION = 'sdrs';
const DASHBOARD_STATS_LEGACY_COLLECTION = 'dashboard_stats';

export class SdrRepository {

  static async findRegistryById(cleanId: string): Promise<FirebaseFirestore.DocumentSnapshot> {
    return db.collection(SDR_REGISTRY_COLLECTION).doc(cleanId).get();
  }

  /**
   * Busca as scores de calls DONE de um SDR específico.
   * Mova EXATAMENTE a query de findDoneCallScoresByEmail do metrics.service.ts.
   */
  static async findDoneCallScoresByEmail(email: string): Promise<{
    nota_spin: unknown;
    score_dominio: unknown;
    score_dor: unknown;
    score_proximo_passo: unknown;
  }[]> {
    const snapshot = await db
      .collection(CALLS_COLLECTION)
      .where('ownerEmail', '==', email)
      .where('processingStatus', '==', CallStatus.DONE)
      .select('nota_spin', 'score_dominio', 'score_dor', 'score_proximo_passo')
      .get();

    return snapshot.docs.map((doc: any) => doc.data());
  }

  /**
   * Busca todas as nota_spin de calls DONE (global).
   * Mova EXATAMENTE a query de updateGlobalSummary do metrics.service.ts.
   */
  static async findAllDoneScores(): Promise<number[]> {
    const snapshot = await db
      .collection(CALLS_COLLECTION)
      .where('processingStatus', '==', CallStatus.DONE)
      .select('nota_spin')
      .get();

    return snapshot.docs
      .map((doc: any) => Number(doc.data().nota_spin || 0))
      .filter((score: number) => Number.isFinite(score));
  }

  static async upsertSdr(cleanId: string, payload: object): Promise<void> {
    await db
      .collection(SDR_STATS_LEGACY_COLLECTION)
      .doc(cleanId)
      .set(payload, { merge: true });
  }

  static async upsertGlobalSummary(payload: object): Promise<void> {
    await db
      .collection(DASHBOARD_STATS_LEGACY_COLLECTION)
      .doc('global_summary')
      .set(payload, { merge: true });
  }

  /**
   * Busca emails ativos de um time.
   * Mova EXATAMENTE a query de getStatsByTeam do metrics.service.ts.
   */
  static async findActiveEmailsByTeam(teamName: string): Promise<string[]> {
    let q = db
      .collection(SDR_REGISTRY_COLLECTION)
      .where('isActive', '==', true);

    if (teamName !== 'all' && teamName !== 'Todos os squads') {
      q = q.where('assignedTeam', '==', teamName);
    }

    const snapshot = await q.get();

    return snapshot.docs
      .map((doc: any) => doc.data().email)
      .filter((email: any) => !!email);
  }

  /**
   * Busca calls DONE por lista de emails (em chunks de 30 para o limite do Firestore).
   * Mova EXATAMENTE a lógica de chunks + Promise.all do metrics.service.ts.
   */
  static async findCallsByEmails(emails: string[]): Promise<object[]> {
    const chunks: string[][] = [];
    for (let i = 0; i < emails.length; i += 30) {
      chunks.push(emails.slice(i, i + 30));
    }

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const snapshot = await db
          .collection(CALLS_COLLECTION)
          .where('ownerEmail', 'in', chunk)
          .where('processingStatus', '==', CallStatus.DONE)
          .get();
        return snapshot.docs.map((doc: any) => doc.data());
      })
    );

    return results.flat();
  }
}
