import { db } from '../firebase.js';
import { processCall } from './processCall.js';
import { refreshPendingAudioCall } from './refreshPendingAudioCall.js';
import { CONFIG } from '../config.js';
import type { CallData } from './hubspot.js';

export function startWorker() {
  console.log('🚀 [WORKER] Trabalhador iniciado.');
  
  // Intervalo de 1 minuto
  const intervaloDeDescanso = 1 * 60 * 1000; 
  let isRunning = false; // 🚩 TRAVA DE CONCORRÊNCIA

  const processarFila = async () => {
    // Se a rodada anterior ainda não terminou (porque a IA demorou), ele aborta esta rodada
    if (isRunning) {
      console.log('⏳ [WORKER] Ocupado. Pulando ciclo atual...');
      return;
    }
    
    isRunning = true;

    try {
      const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
        .where('processingStatus', 'in', ['QUEUED', 'PENDING_AUDIO'])
        .orderBy('updatedAt', 'asc')
        .limit(10) // Puxamos 10, mas processaremos uma por uma
        .get();

      if (!snapshot.empty) {
        console.log(`[WORKER] 📥 Encontrados ${snapshot.size} itens na fila.`);

        for (const doc of snapshot.docs) {
          const callData = doc.data() as CallData;
          const callId = doc.id;

          try {
            // 🚩 RE-CHEGACEM DE STATUS: 
            // Como a execução agora é demorada, o status no banco pode ter mudado
            // (ex: outro processo ou você manualmente alterou o status no meio do loop)
            const freshDoc = await doc.ref.get();
            const freshStatus = freshDoc.data()?.processingStatus;

            if (freshStatus === 'PROCESSING' || freshStatus === 'DONE' || freshStatus === 'ERROR' || freshStatus === 'SKIPPED') {
              console.log(`[IGNORE] 🛡️ Call ${callId} status mudou para ${freshStatus}. Pulando...`);
              continue;
            }

            if (freshStatus === 'PENDING_AUDIO') {
              console.log(`🔍 Verificando mídia para chamada: ${callId}`);
              await refreshPendingAudioCall(callId); // 🚩 O 'AWAIT' AQUI É VITAL
            } else if (freshStatus === 'QUEUED') {
              console.log(`🚀 Processando chamada: ${callId}`);
              await processCall(callId); // 🚩 O 'AWAIT' AQUI É VITAL
            }
          } catch (error) {
            console.error(`❌ Erro ao processar chamada ${callId}:`, error);
          }
        }
        console.log(`[WORKER] ✅ Lote finalizado.`);
      }
    } catch (error) {
      console.error('[WORKER] Erro no ciclo principal:', error);
    } finally {
      isRunning = false; // 🚩 LIBERA O WORKER PARA A PRÓXIMA RODADA
    }
  };

  // 1. Roda a primeira vez
  processarFila();

  // 2. Agenda o loop
  setInterval(processarFila, intervaloDeDescanso);
}