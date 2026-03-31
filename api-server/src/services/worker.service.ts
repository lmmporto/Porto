import { db } from '../firebase.js';
import { processCall } from './processCall.js';
import { CONFIG } from '../config.js';
export function startWorker() {
  console.log('🚀 [WORKER] Trabalhador iniciado.');
  
  // 🚩 Ajustado para 1 minuto (60 segundos) conforme solicitado
  const intervaloDeDescanso = 1 * 60 * 1000; 

  const processarFila = async () => {
    try {
      const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
        .where('processingStatus', '==', 'QUEUED')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        console.log(`[WORKER] 🔥 Processando agora: ${doc.id}`);
        await processCall(doc.id).catch(e => console.error(`[WORKER ERROR] ${doc.id}:`, e));
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