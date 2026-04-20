import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { updateDailyStats } from '../services/analysis.service.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;

async function seedTestData() {
  console.log('🚀 [SEED] Iniciando criação de massa estratégica no Firestore...');

  // Adicionado callTimestamp em cada item para permitir ordenação no frontend
  const calls = [
    {
      ownerName: 'SDR Alfa',
      ownerEmail: 'alfa@empresa.com',
      produto_principal: 'Nibo Obrigações Plus',
      rota: 'Rota A',
      nota_spin: 9.5,
      insights_estrategicos: [{ label: 'Domínio Estratégico', value: 'Excelente' }],
      processingStatus: "DONE",
      callTimestamp: admin.firestore.Timestamp.now()
    },
    {
      ownerName: 'SDR Alfa',
      ownerEmail: 'alfa@empresa.com',
      produto_principal: 'Nibo WhatsApp',
      rota: 'Rota B',
      nota_spin: 6.5,
      insights_estrategicos: [{ label: 'Falta Implicação', value: 'Regular' }],
      processingStatus: "DONE",
      callTimestamp: admin.firestore.Timestamp.now()
    },
    {
      ownerName: 'SDR Alfa',
      ownerEmail: 'alfa@empresa.com',
      produto_principal: 'Nibo Emissor',
      rota: 'Rota C',
      nota_spin: 3.0,
      insights_estrategicos: [{ label: 'Pitch Prematuro', value: 'Crítico' }],
      processingStatus: "DONE",
      callTimestamp: admin.firestore.Timestamp.now()
    },
    {
      ownerName: 'SDR Alfa',
      ownerEmail: 'alfa@empresa.com',
      produto_principal: 'Nibo Gestão',
      rota: 'Rota D',
      nota_spin: 1.0, 
      insights_estrategicos: [{ label: 'Limpeza de Média', value: 'Descarte' }],
      processingStatus: "DONE",
      callTimestamp: admin.firestore.Timestamp.now()
    },
    {
      ownerName: 'SDR Beta',
      ownerEmail: 'beta@empresa.com',
      produto_principal: 'Nibo Obrigações Plus',
      rota: 'Rota A',
      nota_spin: 8.5,
      insights_estrategicos: [{ label: 'Aderência ao Script', value: 'Alta' }],
      processingStatus: "DONE",
      callTimestamp: admin.firestore.Timestamp.now()
    }
  ];

  try {
    const collection = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis');

    for (const data of calls) {
      console.log(`\n📦 Inserindo: ${data.produto_principal} (${data.ownerName})`);

      // 🏛️ Criando o documento com os metadados e o novo callTimestamp
      const docRef = await collection.add({
        ...data,
        lastAnalysisVersion: "V10_SEED",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      const callData = { id: docRef.id, ...data };
      
      // O updateDailyStats agora receberá o objeto contendo o callTimestamp
      await updateDailyStats(callData as any, data as any, false);

      console.log(`✅ Sucesso! Doc: ${docRef.id} | Nota: ${data.nota_spin}`);
    }

    console.log('\n✨ [SEED] Concluído! O Dashboard deve estar vivo agora.');
    process.exit(0);
  } catch (error: any) {
    console.error("🚨 Erro fatal no Seed:", error.message);
    process.exit(1);
  }
}

seedTestData();