import { db } from '../firebase.js';
import { processCall } from './processCall.js';
import { refreshPendingAudioCall } from './refreshPendingAudioCall.js';
import { CONFIG } from '../config.js';
import type { CallData } from './hubspot.js';
export function startWorker() {
  console.log('🚀 [WORKER] Trabalhador iniciado.');
  
  // 🚩 Ajustado para 1 minuto (60 segundos) conforme solicitado
  const intervaloDeDescanso = 1 * 60 * 1000; 

  const processarFila = async () => {
    try {
      const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
        .where('processingStatus', 'in', ['QUEUED', 'PENDING_AUDIO'])
        .orderBy('updatedAt', 'asc')
        .limit(10)
        .get();

      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          const callData = doc.data() as CallData;
          const callId = doc.id;

          try {
            if (callData.processingStatus === 'PENDING_AUDIO') {
              console.log(`🔍 Verificando mídia para chamada: ${callId}`);
              await refreshPendingAudioCall(callId);
            } else if (callData.processingStatus === 'QUEUED') {
              console.log(`🚀 Processando chamada: ${callId}`);
              await processCall(callId);
            } else {
              console.warn(`⚠️ Estado desconhecido para chamada ${callId}: ${callData.processingStatus}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao processar chamada ${callId}:`, error);
            // Opcional: atualizar status para 'ERROR' no banco aqui
          }
        }
      }
    } catch (error) {
      console.error('[WORKER] Erro no ciclo:', error);
    }
  };

  // 1. Roda a primeira vez imediatamente ao subir o servidor
  processarFila();

  // 2. Agenda as próximas rodadas a cada 1 minuto
  setInterval(processarFila, intervaloDeDescanso);
}