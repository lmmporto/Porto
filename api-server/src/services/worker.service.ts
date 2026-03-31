import { db } from '../firebase.js';
import { processCall } from './processCall.js';
import { CONFIG } from '../config.js';

export function startWorker() {
  console.log('🚀 [WORKER] Trabalhador iniciado, monitorando fila...');
  
  // Roda a cada 15 segundos para não estourar leitura do Firestore
  setInterval(async () => {
    try {
      const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
        .where('processingStatus', '==', 'QUEUED')
        .limit(3) // Processa de 3 em 3 para não sobrecarregar a memória
        .get();

      if (snapshot.empty) return;

      for (const doc of snapshot.docs) {
        console.log(`[WORKER] 🔥 Iniciando processamento automático: ${doc.id}`);
        // Removemos o await aqui se quiser processar em paralelo, 
        // mas mantemos para garantir ordem e não estourar limite da IA
        await processCall(doc.id).catch(e => console.error(`[WORKER ERROR] ${doc.id}:`, e));
      }
    } catch (error) {
      console.error('[WORKER] Erro no ciclo de busca:', error);
    }
  }, 15000); 
}