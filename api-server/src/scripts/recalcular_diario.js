import 'dotenv/config';
import { db } from '../firebase.js';
import { CONFIG } from '../config.js';

async function recalcularDiario() {
  console.log('📅 [FAXINA] Reconstruindo o cofre diário com fuso horário de Brasília...');

  const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .where('processingStatus', '==', 'DONE')
    .get();

  const dailyData = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const ownerName = data.ownerName || "Desconhecido";
    const nota = Number(data.nota_spin || 0);
    
    const firestoreDate = data.updatedAt || data.analyzedAt || data.createdAt;
    if (!firestoreDate) return;

    // 🚩 FORÇA FUSO BRASÍLIA (Mesmo formato que o updateDailyStats usa)
    const dateObj = firestoreDate.toDate();
    const dateStr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(dateObj).split('/').reverse().join('-');

    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { total_calls: 0, valid_calls: 0, sum_notes: 0, sdr_ranking: {} };
    }

    if (!dailyData[dateStr].sdr_ranking[ownerName]) {
      dailyData[dateStr].sdr_ranking[ownerName] = { total: 0, valid_count: 0, sum_notes: 0 };
    }

    dailyData[dateStr].total_calls += 1;
    dailyData[dateStr].valid_calls += 1;
    dailyData[dateStr].sum_notes += nota;
    dailyData[dateStr].sdr_ranking[ownerName].total += 1;
    dailyData[dateStr].sdr_ranking[ownerName].valid_count += 1;
    dailyData[dateStr].sdr_ranking[ownerName].sum_notes += nota;
  });

  for (const [date, payload] of Object.entries(dailyData)) {
    console.log(`📝 [HISTORICO] Sobrescrevendo dia: ${date}`);
    // 🚩 SEM MERGE: Isso apaga o lixo antigo e deixa o documento limpo
    await db.collection('dashboard_stats').doc(date).set({
      ...payload,
      updatedAt: new Date()
    });
  }

  console.log('✅ [FAXINA] Mês reconstruído e limpo!');
}

recalcularDiario().catch(console.error);