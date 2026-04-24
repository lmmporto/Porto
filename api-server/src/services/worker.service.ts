import cron from 'node-cron';
import admin from 'firebase-admin';
import { db } from '../firebase.js';
import { CallProcessingOrchestrator } from './call-processing.orchestrator.js';
import { refreshPendingAudioCall } from './refreshPendingAudioCall.js';
import { CallStatus } from '../constants/call-processing.js';
import { CALLS_COLLECTION, SYSTEM_COLLECTION } from '../constants/collections.js';

let isRunning = false;
let heartbeatInterval: NodeJS.Timeout | null = null;

const WORKER_ID = `worker_${Math.random().toString(36).substring(2, 9)}`;
const LOCK_TIMEOUT_MS = 6 * 60 * 1000;

const acquireLock = async (): Promise<boolean> => {
  const lockRef = db.collection(SYSTEM_COLLECTION).doc('worker_lock');

  return await db.runTransaction(async (t) => {
    const doc = await t.get(lockRef);
    const now = new Date();

    if (doc.exists) {
      const data = doc.data();

      if (data?.lockedBy && data.lockedBy !== WORKER_ID) {
        const expiresAt = data.expiresAt?.toDate?.() || new Date(0);

        if (expiresAt > now) {
          return false;
        }
      }
    }

    t.set(
      lockRef,
      {
        lockedBy: WORKER_ID,
        workerId: WORKER_ID,
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
  });
};

const releaseLock = async (): Promise<void> => {
  const lockRef = db.collection(SYSTEM_COLLECTION).doc('worker_lock');

  await lockRef.set(
    {
      status: 'IDLE',
      lockedBy: null,
      workerId: WORKER_ID,
      expiresAt: admin.firestore.FieldValue.serverTimestamp(),
      lastStage: 'IDLE',
      currentCallId: null,
      lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};

const updateHeartbeat = async (
  lastStage: string,
  currentCallId?: string
): Promise<void> => {
  const lockRef = db.collection(SYSTEM_COLLECTION).doc('worker_lock');

  await lockRef.set(
    {
      workerId: WORKER_ID,
      lockedBy: WORKER_ID,
      lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
      lastStage,
      currentCallId: currentCallId || null,
    },
    { merge: true }
  );
};

/**
 * ⚙️ [Worker] Ciclo de processamento.
 *
 * Processa:
 * - chamadas novas em QUEUED
 * - chamadas aguardando áudio em PENDING_AUDIO
 * - retentativas em RETRY_ANALYSIS / ERROR
 */
const checkAndProcessCalls = async (): Promise<void> => {
  if (isRunning) {
    console.log('⏳ [Worker] Execução já em andamento nesta instância. Ignorando novo ciclo.');
    return;
  }

  isRunning = true;

  let lockAcquired = false;

  try {
    lockAcquired = await acquireLock();

    if (!lockAcquired) {
      console.log('⏳ [Worker] Instância paralela detectada. Lock retido por outro worker.');
      return;
    }

    console.log(`⚙️ [Worker] Iniciando verificação de filas... (ID: ${WORKER_ID})`);

    heartbeatInterval = setInterval(() => {
      updateHeartbeat('POLLING').catch((e) => {
        console.error('❌ [Worker] Falha no heartbeat:', e?.message || e);
      });
    }, 60_000);

    const callsRef = db.collection(CALLS_COLLECTION);
    const now = admin.firestore.Timestamp.now();

    // 1. Processa chamadas novas em fila (QUEUED)
    try {
      const queuedSnapshot = await callsRef
        .where('processingStatus', '==', CallStatus.QUEUED)
        .orderBy('updatedAt', 'asc')
        .limit(10)
        .get();

      if (!queuedSnapshot.empty) {
        console.log(`🚀 [Worker] Processando ${queuedSnapshot.size} novas chamadas.`);

        for (const doc of queuedSnapshot.docs) {
          try {
            await updateHeartbeat('PROCESSING_QUEUED', doc.id);
            await CallProcessingOrchestrator.processCall(doc.id, WORKER_ID);
          } catch (e: any) {
            console.error(
              `❌ [Worker] Falha isolada na call ${doc.id}:`,
              e?.message || e
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ [Worker] Erro ao buscar chamadas QUEUED:', error);
    }

    // 2. Processa chamadas aguardando áudio (PENDING_AUDIO)
    try {
      const pendingSnapshot = await callsRef
        .where('processingStatus', '==', CallStatus.PENDING_AUDIO)
        .where('nextRetryAt', '<=', now)
        .orderBy('nextRetryAt', 'asc')
        .limit(10)
        .get();

      if (!pendingSnapshot.empty) {
        console.log(
          `⚙️ [Worker] Encontradas ${pendingSnapshot.size} chamadas PENDING_AUDIO para reprocessar.`
        );

        for (const doc of pendingSnapshot.docs) {
          try {
            console.log(`⚙️ [Worker] Sincronizando áudio para: ${doc.id}`);
            await updateHeartbeat('REFRESHING_AUDIO', doc.id);
            await refreshPendingAudioCall(doc.id);
          } catch (e: any) {
            console.error(
              `❌ [Worker] Falha no refresh da call ${doc.id}:`,
              e?.message || e
            );

            await callsRef.doc(doc.id).set(
              {
                lastRefreshError: e?.message || String(e),
                lastRefreshErrorAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ [Worker] Erro ao buscar chamadas PENDING_AUDIO:', error);
    }

    // 3. Recupera chamadas em RETRY_ANALYSIS ou ERROR recuperáveis
    try {
      const retrySnapshot = await callsRef
        .where('processingStatus', 'in', [
          CallStatus.RETRY_ANALYSIS,
          CallStatus.ERROR,
        ])
        .where('nextRetryAt', '<=', now)
        .orderBy('nextRetryAt', 'asc')
        .limit(5)
        .get();

      const itemsToRetry = retrySnapshot.docs.filter((doc) => {
        const data = doc.data();

        if (data.processingStatus === CallStatus.RETRY_ANALYSIS) {
          return true;
        }

        return data.retryable === true;
      });

      if (itemsToRetry.length > 0) {
        console.log(
          `🔄 [Worker] Retentando ${itemsToRetry.length} análises (RETRY/ERROR).`
        );

        for (const doc of itemsToRetry) {
          try {
            await updateHeartbeat('RETRYING_ANALYSIS', doc.id);
            await CallProcessingOrchestrator.processCall(doc.id, WORKER_ID);
          } catch (e: any) {
            console.error(
              `❌ [Worker] Falha isolada na retentativa da call ${doc.id}:`,
              e?.message || e
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ [Worker] Erro ao buscar chamadas para retentativa:', error);
    }

    await updateHeartbeat('FINISHED');
  } catch (error) {
    console.error('❌ [Worker] Erro geral ao verificar chamadas:', error);

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
  } finally {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    isRunning = false;

    if (lockAcquired) {
      await releaseLock();
    }
  }
};

export const initializeWorkers = (): void => {
  cron.schedule('*/5 * * * *', checkAndProcessCalls);

  checkAndProcessCalls().catch((error) => {
    console.error('❌ [Worker] Falha na execução inicial do worker:', error);
  });

  console.log('🚀 [Worker] Cron job para processamento e retentativas inicializado.');
};

export const startWorker = initializeWorkers;