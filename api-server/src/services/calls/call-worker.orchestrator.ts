// api-server/src/services/calls/call-worker.orchestrator.ts
import cron from 'node-cron';
import admin from 'firebase-admin';
import { CallRepository } from '../../infrastructure/database/call.repository.js';
import { WorkerLockRepository } from '../../infrastructure/database/worker-lock.repository.js';
import { CallProcessingOrchestrator } from '../call-processing.orchestrator.js';
import { PendingAudioRefreshOrchestrator } from './pending-audio-refresh.orchestrator.js';
import { CallStatus } from '../../domain/analysis/analysis.types.js';
import { db } from '../../firebase.js';
import { CALLS_COLLECTION } from '../../domain/analysis/analysis.constants.js';

const WORKER_ID = `worker_${Math.random().toString(36).substring(2, 9)}`;
const lock = new WorkerLockRepository(WORKER_ID);

let isRunning = false;
let heartbeatInterval: NodeJS.Timeout | null = null;

const checkAndProcessCalls = async (): Promise<void> => {
  if (isRunning) {
    console.log('⏳ [Worker] Execução já em andamento nesta instância. Ignorando novo ciclo.');
    return;
  }

  isRunning = true;
  let lockAcquired = false;

  try {
    lockAcquired = await lock.acquire();
    if (!lockAcquired) {
      console.log('⏳ [Worker] Instância paralela detectada. Lock retido por outro worker.');
      return; // o finally ainda roda aqui — mas isRunning precisa ser resetado
    }

    console.log(`⚙️ [Worker] Iniciando verificação de filas... (ID: ${WORKER_ID})`);

    console.log(`[Worker] Configurando heartbeat...`);
    heartbeatInterval = setInterval(() => {
      lock.heartbeat('POLLING').catch((e) => {
        console.error('❌ [Worker] Falha no heartbeat:', e?.message || e);
      });
    }, 60_000);

    console.log(`[Worker] Calculando timestamp...`);
    const now = admin.firestore.Timestamp.now();

    // FILA 0: RECUPERAÇÃO — calls presas em PROCESSING há mais de 1 hora
    try {
      const oneHourAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
      const staleSnapshot = await CallRepository.findStaleProcessing(oneHourAgo, 10);
      if (!staleSnapshot.empty) {
        console.log(`🔁 [Worker] Encontradas ${staleSnapshot.size} chamadas presas em PROCESSING. Revertendo para QUEUED...`);
        const batch = db.batch();
        for (const doc of staleSnapshot.docs) {
          batch.set(
            doc.ref,
            {
              processingStatus: CallStatus.QUEUED,
              leaseOwner: admin.firestore.FieldValue.delete(),
              leaseUntil: admin.firestore.FieldValue.delete(),
              lastStage: 'RECOVERED_FROM_STALE_PROCESSING',
              lastStageAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`🔁 [Worker] Call ${doc.id} revertida de PROCESSING → QUEUED.`);
        }
        await batch.commit();
      }
    } catch (error: any) {
      console.error('❌ [Worker] Erro ao recuperar chamadas presas em PROCESSING:', error?.message || error);
    }

    console.log(`[Worker] Iniciando FILA 1 - QUEUED...`);
    // FILA 1: QUEUED — novas chamadas
    try {
      console.log(`[Worker] Chamando findByStatus QUEUED...`);
      const snapshot = await Promise.race([
        CallRepository.findByStatus(CallStatus.QUEUED, { limit: 10 }),
        new Promise<FirebaseFirestore.QuerySnapshot>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_QUEUED')), 8_000)
        ),
      ]);
      console.log(`[Worker] FILA 1 respondeu. Empty: ${snapshot.empty}`);
      if (!snapshot.empty) {
        console.log(`🚀 [Worker] Processando ${snapshot.size} novas chamadas.`);
        for (const doc of snapshot.docs) {
          try {
            await lock.heartbeat('PROCESSING_QUEUED', doc.id);
            await CallProcessingOrchestrator.processCall(doc.id, WORKER_ID);
          } catch (e: any) {
            console.error(`❌ [Worker] Falha isolada na call ${doc.id}:`, e?.message || e);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ [Worker] Erro ao buscar chamadas QUEUED:', error?.message || error);
    }

    // FILA 2: PENDING_AUDIO — aguardando áudio do HubSpot
    console.log(`[Worker] Iniciando FILA 2 - PENDING_AUDIO...`);
    try {
      console.log(`[Worker] Chamando findByStatus PENDING_AUDIO...`);
      const snapshot = await Promise.race([
        CallRepository.findByStatus(CallStatus.PENDING_AUDIO, {
          limit: 10,
          nextRetryAtBefore: now,
          includeNullRetry: true,
        }),
        new Promise<FirebaseFirestore.QuerySnapshot>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_PENDING_AUDIO')), 5_000)
        ),
      ]);

      console.log(`[Worker] FILA 2 respondeu. Empty: ${snapshot.empty}`);

      if (!snapshot.empty) {
        console.log(`⚙️ [Worker] Encontradas ${snapshot.size} chamadas PENDING_AUDIO.`);
        for (const doc of snapshot.docs) {
          try {
            await lock.heartbeat('REFRESHING_AUDIO', doc.id);
            await PendingAudioRefreshOrchestrator.refresh(doc.id);
          } catch (e: any) {
            console.error(`❌ [Worker] Falha no refresh da call ${doc.id}:`, e?.message || e);
            // Persiste o erro de refresh sem derrubar o ciclo
            // Copie EXATAMENTE o bloco callsRef.doc(doc.id).set({ lastRefreshError... })
            // do worker.service.ts original
            await db.collection(CALLS_COLLECTION).doc(doc.id).set(
              {
                lastRefreshError: e?.message || String(e),
                lastRefreshErrorAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      }
    } catch (error: any) {
      console.error('❌ [Worker] Erro ao buscar chamadas PENDING_AUDIO:', error?.message || error);
    }

    // FILA 3: RETRY_ANALYSIS / ERROR — retentativas
    console.log(`[Worker] Iniciando FILA 3 - RETRY/ERROR...`);
    try {
      console.log(`[Worker] Chamando findByStatus RETRY/ERROR...`);
      const snapshot = await Promise.race([
        CallRepository.findByStatus(
          [CallStatus.RETRY_ANALYSIS, CallStatus.ERROR],
          { limit: 5, nextRetryAtBefore: now }
        ),
        new Promise<FirebaseFirestore.QuerySnapshot>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_RETRY')), 5_000)
        ),
      ]);

      console.log(`[Worker] FILA 3 respondeu. Empty: ${snapshot.empty}`);

      const toRetry = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return (
          data.processingStatus === CallStatus.RETRY_ANALYSIS ||
          data.retryable === true
        );
      });

      if (toRetry.length > 0) {
        console.log(`🔄 [Worker] Retentando ${toRetry.length} análises.`);
        for (const doc of toRetry) {
          try {
            await lock.heartbeat('RETRYING_ANALYSIS', doc.id);
            await CallProcessingOrchestrator.processCall(doc.id, WORKER_ID);
          } catch (e: any) {
            console.error(`❌ [Worker] Falha na retentativa ${doc.id}:`, e?.message || e);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ [Worker] Erro ao buscar chamadas para retentativa:', error?.message || error);
    }

    console.log('[Worker] Atualizando heartbeat para FINISHED...');
    await lock.heartbeat('FINISHED');
    console.log('[Worker] Heartbeat FINISHED atualizado com sucesso.');

  } catch (error) {
    console.error('❌ [Worker] Erro geral ao verificar chamadas:', error);
    await lock.logError(error);
  } finally {
    console.log('[Worker] Entrando no bloco finally. Limpando intervalo de heartbeat...');
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    isRunning = false;
    
    if (lockAcquired) {
      console.log('[Worker] Liberando o lock no banco...');
      await lock.release().catch((e) => {
        console.error('❌ [Worker] Falha ao liberar lock:', e?.message || e);
      });
      console.log('✅ [Worker] Lock liberado. Ciclo finalizado com sucesso.');
    } else {
      console.log('✅ [Worker] Ciclo finalizado (sem lock retido).');
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
