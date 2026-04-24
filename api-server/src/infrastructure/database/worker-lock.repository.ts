// api-server/src/infrastructure/database/worker-lock.repository.ts
import admin from 'firebase-admin';
import { db } from '../../firebase.js';
import { SYSTEM_COLLECTION } from '../../constants/collections.js';

const LOCK_TIMEOUT_MS = 6 * 60 * 1000;

export class WorkerLockRepository {
  constructor(private readonly workerId: string) {}

  /**
   * Mova EXATAMENTE o corpo da função acquireLock() de worker.service.ts.
   * Substitua todas as referências à closure WORKER_ID por this.workerId.
   * Substitua todas as referências à closure LOCK_TIMEOUT_MS pela constante local.
   */
  async acquire(): Promise<boolean> {
    const lockRef = db.collection(SYSTEM_COLLECTION).doc('worker_lock');

    try {
      return await Promise.race([
        db.runTransaction(async (t) => {
          const doc = await t.get(lockRef);
          const now = new Date();

          if (doc.exists) {
            const data = doc.data();
            if (data?.lockedBy && data.lockedBy !== this.workerId) {
              const expiresAt = data.expiresAt?.toDate?.() || new Date(0);
              if (expiresAt > now) {
                return false;
              }
            }
          }

          t.set(
            lockRef,
            {
              lockedBy: this.workerId,
              workerId: this.workerId,
              lockedAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromMillis(
                now.getTime() + LOCK_TIMEOUT_MS
              ),
              lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
              lastStage: 'LOCK_ACQUIRED',
              currentCallId: null,
              status: 'RUNNING',
            },
            { merge: true }
          );

          return true;
        }),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('LOCK_ACQUIRE_TIMEOUT')), 10_000)
        ),
      ]);
    } catch (error: any) {
      if (error.message === 'LOCK_ACQUIRE_TIMEOUT') {
        console.error('❌ [Worker] Timeout ao tentar adquirir lock. Abortando ciclo.');
        return false;
      }
      throw error;
    }
  }

  /**
   * Mova EXATAMENTE o corpo da função releaseLock() de worker.service.ts.
   */
  async release(): Promise<void> {
    const lockRef = db.collection(SYSTEM_COLLECTION).doc('worker_lock');
    await lockRef.set(
      {
        status: 'IDLE',
        lockedBy: null,
        workerId: this.workerId,
        expiresAt: admin.firestore.FieldValue.serverTimestamp(),
        lastStage: 'IDLE',
        currentCallId: null,
        lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Mova EXATAMENTE o corpo da função updateHeartbeat() de worker.service.ts.
   */
  async heartbeat(lastStage: string, currentCallId?: string): Promise<void> {
    const lockRef = db.collection(SYSTEM_COLLECTION).doc('worker_lock');
    await lockRef.set(
      {
        workerId: this.workerId,
        lockedBy: this.workerId,
        lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        lastStage,
        currentCallId: currentCallId || null,
      },
      { merge: true }
    );
  }

  async logError(error: unknown): Promise<void> {
    await db
      .collection(SYSTEM_COLLECTION)
      .doc('worker_lock')
      .set(
        {
          lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          lastError: error instanceof Error ? error.message : String(error),
          lastStage: 'FAILED',
        },
        { merge: true }
      );
  }
}
