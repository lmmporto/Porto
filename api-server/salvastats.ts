import admin from 'firebase-admin';
import 'dotenv/config';

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountRaw) {
  console.error("❌ ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON não encontrada no .env");
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(serviceAccountRaw);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (error) {
  console.error("❌ ERRO NO JSON DO ENV: Verifique se o conteúdo é um JSON válido.");
  process.exit(1);
}

const db = admin.firestore();

async function runNuclearRebuild(startDate: string, endDate: string) {
  try {
    console.log(`\n🚀 [NUCLEAR REBUILD] Iniciando: ${startDate} até ${endDate}`);
    console.log(`📂 Alvo: Coleção 'calls_analysis'`);

    // 🚩 CORREÇÃO: Apontando para o nome real da sua coleção no Firebase
    const callsSnapshot = await db.collection('calls_analysis').get();

    if (callsSnapshot.empty) {
      console.log("⚠️ A coleção 'calls_analysis' está vazia no seu banco de dados.");
      return;
    }

    console.log(`📊 Documentos totais encontrados: ${callsSnapshot.size}`);

    const statsByDay: Record<string, any> = {};
    let processedCount = 0;
    let skippedCount = 0;

    callsSnapshot.forEach(doc => {
      const call = doc.data();
      
      // Filtro Manual Resiliente
      const status = String(call.processingStatus || "").toUpperCase();
      if (status !== "DONE") {
        skippedCount++;
        return;
      }

      // Normalização de Data (updatedAt > analyzedAt > createdAt)
      const rawDate = call.updatedAt || call.analyzedAt || call.createdAt;
      if (!rawDate) return;

      const date = rawDate._seconds 
        ? new Date(rawDate._seconds * 1000) 
        : (rawDate.toDate ? rawDate.toDate() : new Date(rawDate));
      
      const dayStr = date.toISOString().split('T')[0];

      // Filtro de Período
      if (dayStr < startDate || dayStr > endDate) return;

      if (!statsByDay[dayStr]) {
        statsByDay[dayStr] = {
          total_calls: 0, valid_calls: 0, sum_notes: 0,
          count_aprovado: 0, count_atencao: 0, count_reprovado: 0,
          sdr_ranking: {}
        };
      }

      const sdr = (call.ownerName || "Desconhecido").trim();
      const nota = Number(call.nota_spin || 0);
      const statusFinal = String(call.status_final || "").toUpperCase();

      // Acumuladores Diários
      statsByDay[dayStr].total_calls++;
      statsByDay[dayStr].valid_calls++;
      statsByDay[dayStr].sum_notes += nota;

      if (statusFinal === 'APROVADO') statsByDay[dayStr].count_aprovado++;
      else if (statusFinal === 'ATENCAO') statsByDay[dayStr].count_atencao++;
      else if (statusFinal === 'REPROVADO') statsByDay[dayStr].count_reprovado++;

      // Estrutura de Ranking Achatada (Sincronizada com a API)
      if (!statsByDay[dayStr].sdr_ranking[sdr]) {
        statsByDay[dayStr].sdr_ranking[sdr] = { total: 0, valid_count: 0, sum_notes: 0 };
      }
      
      statsByDay[dayStr].sdr_ranking[sdr].total++;
      statsByDay[dayStr].sdr_ranking[sdr].valid_count++;
      statsByDay[dayStr].sdr_ranking[sdr].sum_notes += nota;
      
      processedCount++;
    });

    console.log(`✅ Filtragem concluída: ${processedCount} processadas, ${skippedCount} ignoradas.`);

    // 💾 Gravação no Cofre (dashboard_stats)
    for (const [day, data] of Object.entries(statsByDay)) {
      console.log(`💾 Gravando consolidado: ${day} (${data.total_calls} chamadas)...`);
      
      const finalPayload: any = {
        date: day,
        total_calls: data.total_calls,
        valid_calls: data.valid_calls,
        sum_notes: data.sum_notes,
        count_aprovado: data.count_aprovado,
        count_atencao: data.count_atencao,
        count_reprovado: data.count_reprovado,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Mapeamento de campos planos para o Firestore
      Object.entries(data.sdr_ranking).forEach(([name, stats]: [string, any]) => {
        finalPayload[`sdr_ranking.${name}.total`] = stats.total;
        finalPayload[`sdr_ranking.${name}.valid_count`] = stats.valid_count;
        finalPayload[`sdr_ranking.${name}.sum_notes`] = stats.sum_notes;
      });

      await db.collection('dashboard_stats').doc(day).set(finalPayload, { merge: true });
    }

    console.log("\n✨ MISSÃO CUMPRIDA. O Cofre de Saldos foi reconstruído com base em 'calls_analysis'.");
    process.exit(0);

  } catch (error) {
    console.error("❌ ERRO CRÍTICO:", error);
    process.exit(1);
  }
}

// Rodar para o período desejado
runNuclearRebuild("2024-01-01", "2026-12-31");