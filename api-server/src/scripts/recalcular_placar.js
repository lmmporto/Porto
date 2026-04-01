import 'dotenv/config';
import { db } from '../firebase.js';
import { CONFIG } from '../config.js';

async function recalcularPlacar() {
  console.log('📊 [RECALCULO] Buscando o histórico de chamadas analisadas...');

  // Puxa só o que já tá pronto
  const snapshot = await db.collection(CONFIG.CALLS_COLLECTION)
    .where('processingStatus', '==', 'DONE')
    .get();

  if (snapshot.empty) {
    console.log('⚠️ [RECALCULO] Nenhuma chamada concluída encontrada.');
    return;
  }

  const sdrData = {};

  // Soma as notas e conta as ligações de cada SDR na memória
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const ownerName = data.ownerName || "Desconhecido";
    const nota = Number(data.nota_spin || 0);

    if (!sdrData[ownerName]) {
      sdrData[ownerName] = { totalCalls: 0, totalScore: 0 };
    }

    sdrData[ownerName].totalCalls += 1;
    sdrData[ownerName].totalScore += nota;
  });

  console.log(`📈 [RECALCULO] Calculando médias para ${Object.keys(sdrData).length} SDRs...`);

  // Prepara o pacote para gravar tudo de uma vez no banco
  const batch = db.batch();

  for (const [ownerName, stats] of Object.entries(sdrData)) {
    // Cria um ID seguro sem acentos ou espaços (ex: joao_silva)
    const safeId = ownerName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const sdrRef = db.collection('sdr_stats').doc(safeId);

    const averageScore = Number((stats.totalScore / stats.totalCalls).toFixed(2));

    batch.set(sdrRef, {
      ownerName: ownerName,
      totalCalls: stats.totalCalls,
      totalScore: stats.totalScore,
      averageScore: averageScore,
      lastUpdated: new Date()
    });
  }

  // Dispara a gravação
  await batch.commit();
  console.log('✅ [RECALCULO] Placar global criado e atualizado com sucesso!');
}

recalcularPlacar().catch(console.error);