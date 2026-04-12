import { db } from "../firebase.js";
import { CONFIG } from "../config.js";
import dotenv from 'dotenv';
dotenv.config();

async function rebuildMonthlyStats() {
  console.log("🚀 Iniciando Reconstrução Mensal do Placar...");

  // 1. Busca todas as chamadas analisadas
  const callsSnapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .where('processingStatus', '==', 'DONE')
    .get();

  if (callsSnapshot.empty) {
    console.log("❌ Nenhuma chamada encontrada.");
    return;
  }

  console.log(`📊 Processando ${callsSnapshot.size} chamadas...`);

  // 2. Agregação por SDR + MÊS
  const monthlyMap = new Map();

  callsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const email = (data.ownerEmail || "").toLowerCase().trim();
    const name = data.ownerName || "SDR Desconhecido";
    const score = Number(data.nota_spin);
    
    // 🚩 EXTRAÇÃO DO MÊS: Pegamos a data da chamada
    const date = data.callTimestamp?.toDate() || new Date();
    const monthKey = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!email || isNaN(score)) return;

    // A chave do mapa agora considera o e-mail e o mês
    const compositeKey = `${email}_${monthKey}`;

    if (!monthlyMap.has(compositeKey)) {
      monthlyMap.set(compositeKey, {
        ownerName: name,
        ownerEmail: email,
        monthKey: monthKey,
        totalCalls: 0,
        totalScore: 0
      });
    }

    const stats = monthlyMap.get(compositeKey);
    stats.totalCalls += 1;
    stats.totalScore += score;
  });

  // 3. Gravação no Firestore (sdr_stats)
  console.log("💾 Gravando novos registros mensais...");
  const batch = db.batch();
  
  monthlyMap.forEach((stats, compositeKey) => {
    const averageScore = stats.totalScore / stats.totalCalls;
    // O ID do documento será: andriel_mateus_nibo_com_br_2024_04
    const safeId = compositeKey.replace(/[^a-zA-Z0-9_]/g, "_");
    
    const docRef = db.collection('sdr_stats').doc(safeId);
    batch.set(docRef, {
      ownerName: stats.ownerName,
      ownerEmail: stats.ownerEmail,
      totalCalls: stats.totalCalls,
      totalScore: stats.totalScore,
      averageScore: Number(averageScore.toFixed(2)),
      lastUpdated: new Date()
    });
    
    console.log(`✅ [${stats.monthKey}] ${stats.ownerName}: ${stats.totalCalls} calls`);
  });

  await batch.commit();
  console.log("\n=================================");
  console.log("🏁 PLACAR MENSAL RECONSTRUÍDO!");
  console.log("=================================\n");
  
  process.exit(0);
}

rebuildMonthlyStats().catch(console.error);