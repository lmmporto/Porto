import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const BEATRIZ = {
  name: "Beatriz Rodrigues",
  email: "beatriz.rodrigues@nibo.com.br"
};

async function seedBeatriz() {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    console.log(`🌱 Semeando dados para ${BEATRIZ.name}...`);

    const calls = [
      {
        id: "fake_call_001",
        title: "Venda Fechada - Condomínio Solar",
        nota_spin: 9.5,
        status_final: "APROVADO",
        resumo: "Beatriz demonstrou domínio total do framework SPIN. Identificou a dor latente de gestão de inadimplência e conectou com a solução de automação de cobrança de forma magistral.",
        analise_escuta: "Aos 01:15, Beatriz ouviu o síndico reclamar do tempo gasto em planilhas e não interrompeu. Esperou o silêncio para perguntar: 'E quanto esse tempo custa para a sua saúde financeira?'. Aula de escuta ativa.",
        alertas: ["Aos 04:20, poderia ter reforçado o prazo de implementação."],
        ponto_atencao: "Manter o ritmo de fechamento, apenas garantir que o próximo passo de onboarding esteja claro.",
        pontos_fortes: ["Escuta ativa impecável", "Uso de perguntas de implicação", "Rapport imediato"],
        maior_dificuldade: "Nenhuma dificuldade crítica identificada.",
        durationMs: 480000, // 8 min
      },
      {
        id: "fake_call_002",
        title: "Prospecção - Indústria Metalúrgica",
        nota_spin: 4.2,
        status_final: "ATENCAO",
        resumo: "Abordagem inicial correta, mas Beatriz recuou diante da primeira objeção de preço. Faltou ancoragem de valor antes de falar de mensalidade.",
        analise_escuta: "Aos 00:45, o cliente disse que o software atual era 'grátis'. Beatriz aceitou a informação passivamente em vez de explorar as limitações do 'grátis'.",
        alertas: ["00:50 - SDR passiva na objeção de custo", "02:10 - Não qualificou o decisor final"],
        ponto_atencao: "Treinar contorno de objeção de preço usando ROI.",
        pontos_fortes: ["Cordialidade", "Clareza na fala"],
        maior_dificuldade: "Dificuldade em sustentar o valor do produto perante concorrentes gratuitos.",
        durationMs: 320000, // 5.3 min
      }
    ];

    const batch = db.batch();

    // 1. Inserir as chamadas
    calls.forEach(call => {
      const ref = db.collection('calls_analysis').doc(call.id);
      batch.set(ref, {
        ...call,
        ownerName: BEATRIZ.name,
        ownerEmail: BEATRIZ.email,
        processingStatus: "DONE",
        callTimestamp: Timestamp.now(), // Data de hoje
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        portalId: "1554114"
      });
    });

    // 2. Atualizar o ranking (sdr_stats)
    const statsRef = db.collection('sdr_stats').doc(BEATRIZ.name);
    batch.set(statsRef, {
      ownerName: BEATRIZ.name,
      ownerEmail: BEATRIZ.email,
      totalCalls: calls.length,
      totalScore: calls.reduce((acc, c) => acc + c.nota_spin, 0),
      averageScore: calls.reduce((acc, c) => acc + c.nota_spin, 0) / calls.length,
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();
    console.log("✅ Beatriz agora tem dados reais para teste!");
    process.exit(0);
  } catch (error) {
    console.error("🛑 Erro no seeding:", error);
    process.exit(1);
  }
}

seedBeatriz();