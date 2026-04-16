import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;

async function seedTestData() {
  console.log('--- 🚀 [LOG] INÍCIO DO SCRIPT DE SEED ---');

  try {
    const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';
    console.log(`📂 [LOG] Coleção alvo: ${collectionName}`);

    const calls = [
      {
        ownerName: "Sarah Jordanna",
        ownerEmail: "sarah_jordanna@nibo.com.br",
        nota_spin: 5.5,
        produto_principal: "Nibo Obrigações Plus",
        rota: "Rota A",
        processingStatus: "DONE",
        callTimestamp: admin.firestore.Timestamp.now(),
        insights_estrategicos: [
          { label: "Exploração de Dor", value: "Baixa", type: "negative" },
          { label: "Aderência ao Script", value: "85%", type: "positive" }
        ]
      },
      {
        ownerName: 'SDR Alfa',
        ownerEmail: 'alfa@nibo.com.br',
        produto_principal: 'Nibo WhatsApp',
        rota: 'Rota B',
        nota_spin: 9.5,
        processingStatus: "DONE",
        callTimestamp: admin.firestore.Timestamp.now(),
        insights_estrategicos: [
          { label: 'Domínio Estratégico', value: 'Excelente', type: "positive" }
        ]
      }
    ];

    console.log(`📦 [LOG] Total de documentos para inserir: ${calls.length}`);

    for (const [index, data] of calls.entries()) {
      console.log(`\n⏳ [${index + 1}/${calls.length}] Inserindo: ${data.ownerName}`);

      const docRef = await db.collection(collectionName).add({
        ...data,
        lastAnalysisVersion: "V11_SEED_DEBUG",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`✅ [LOG] Criado ID: ${docRef.id}`);

      // Atualiza estatísticas diárias
      await updateDailyStats({ id: docRef.id, ...data } as any, data as any, false);
    }

    console.log('\n⚖️ [LOG] Atualizando dashboard_stats/global_summary...');

    await db.collection("dashboard_stats").doc("global_summary").set({
      total_calls: FieldValue.increment(calls.length),
      media_geral: 7.5,
      taxa_aprovacao: 70,
      last_update: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('⭐ [LOG] Sumário global atualizado.');
    console.log('✨ [SEED] Concluído com sucesso!');

    process.exit(0);

  } catch (error: any) {
    console.error("\n🚨 [ERRO FATAL]:");
    console.error(error.message);
    process.exit(1);
  }
}

// Execução do script
seedTestData().catch(err => {
  console.error("❌ Erro na execução:", err);
  process.exit(1);
});