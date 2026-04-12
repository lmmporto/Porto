
import 'dotenv/config';
import { db } from "../firebase.js";

async function auditStats() {
  console.log("🔍 Auditando coleção 'sdr_stats'...");
  
  const snapshot = await db.collection('sdr_stats')
    .orderBy('averageScore', 'desc')
    .get();

  if (snapshot.empty) {
    console.log("❌ Coleção 'sdr_stats' está vazia!");
    return;
  }

  console.log(`✅ Encontrados ${snapshot.size} SDRs no ranking.`);
  
  snapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`
    ${i + 1}. Nome: ${data.ownerName}
       E-mail: ${data.ownerEmail}
       Nota Média: ${data.averageScore}
       Total Chamadas: ${data.totalCalls}
    -----------------------------------`);
  });
}

auditStats().catch(console.error);