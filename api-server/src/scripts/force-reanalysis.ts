import dotenv from 'dotenv';
dotenv.config();
import { db } from "../firebase.js";
import { CONFIG } from "../config.js";

async function forceReanalysis() {
  console.log("🔄 Preparando reanálise forçada dos últimos 40 registros...");

  // 1. Busca as últimas 40 chamadas (independente do status atual)
  const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .orderBy("callTimestamp", "desc")
    .limit(40)
    .get();

  if (snapshot.empty) {
    console.log("❌ Nenhuma chamada encontrada para resetar.");
    return;
  }

  console.log(`📡 Encontrados ${snapshot.size} registros. Resetando para fila...`);

  const batch = db.batch();

  snapshot.docs.forEach(doc => {
    // 🚩 RESET TOTAL: Voltamos para QUEUED e limpamos campos antigos de análise
    // para garantir que a IA gere o novo formato do Playbook
    batch.update(doc.ref, {
      processingStatus: 'QUEUED',
      updatedAt: new Date(),
      // Removemos campos antigos para forçar a IA a reescrever no novo padrão
      playbook_detalhado: null, 
      alertas: null,
      nota_spin: null
    });
    console.log(`🔓 Na fila: ${doc.id} - ${doc.data().ownerName}`);
  });

  await batch.commit();
  console.log("\n=================================");
  console.log("✅ SUCESSO: 40 chamadas prontas para reanálise!");
  console.log("🚀 Ligue o servidor (pnpm dev) para o Worker começar.");
  console.log("=================================\n");
  
  process.exit(0);
}

forceReanalysis().catch(console.error);