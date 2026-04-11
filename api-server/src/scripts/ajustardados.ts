import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import dotenv from 'dotenv';
dotenv.config();

async function rebuildLeaderboard() {
  console.log("🚀 Iniciando Reconstrução Total do Placar...");

  // 1. Busca todas as chamadas analisadas com sucesso
  console.log("⏳ Lendo histórico de chamadas (calls_analysis)...");
  const callsSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .where('processingStatus', '==', 'DONE')
    .get();

  if (callsSnapshot.empty) {
    console.log("❌ Nenhuma chamada analisada encontrada.");
    return;
  }

  console.log(`📊 Processando ${callsSnapshot.size} chamadas...`);

  // 2. Agregação em Memória (Garante mesclagem perfeita)
  const leaderboardMap = new Map();

  callsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const email = (data.ownerEmail || "").toLowerCase().trim();
    const name = data.ownerName || "SDR Desconhecido";
    const score = Number(data.nota_spin);

    if (!email || isNaN(score)) return;

    if (!leaderboardMap.has(email)) {
      leaderboardMap.set(email, {
        ownerName: name,
        ownerEmail: email,
        totalCalls: 0,
        totalScore: 0
      });
    }

    const stats = leaderboardMap.get(email);
    stats.totalCalls += 1;
    stats.totalScore += score;
  });

  // 3. Limpeza da coleção antiga (sdr_stats)
  console.log("🧹 Limpando placar antigo...");
  const oldStats = await db.collection('sdr_stats').get();
  const deleteBatch = db.batch();
  oldStats.docs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();

  // 4. Gravação do novo placar saneado
  console.log("💾 Gravando novo placar oficial...");
  const saveBatch = db.batch();
  
  leaderboardMap.forEach((stats, email) => {
    const averageScore = stats.totalScore / stats.totalCalls;
    const safeId = email.replace(/[^a-zA-Z0-9]/g, "_");
    
    const docRef = db.collection('sdr_stats').doc(safeId);
    saveBatch.set(docRef, {
      ...stats,
      averageScore: Number(averageScore.toFixed(2)),
      lastUpdated: new Date()
    });
    
    console.log(`✅ Adicionado: ${stats.ownerName} (${stats.totalCalls} calls | Média: ${averageScore.toFixed(2)})`);
  });

  await saveBatch.commit();
  console.log("\n=================================");
  console.log("🏁 RECONSTRUÇÃO CONCLUÍDA COM SUCESSO!");
  console.log(`SDRs processados: ${leaderboardMap.size}`);
  console.log("=================================\n");
  
  process.exit(0);
}

rebuildLeaderboard().catch(console.error);