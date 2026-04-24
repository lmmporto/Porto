import { db } from '../src/firebase.js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function requeueRecentCalls() {
    console.log('🚀 Iniciando script de re-enfileiramento...');

    if (!db) {
        console.error("❌ Erro: Banco de dados não inicializado.");
        process.exit(1);
    }

    // 1. Calcular o timestamp de 24 horas atrás
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const firestoreTimestamp = admin.firestore.Timestamp.fromDate(twentyFourHoursAgo);

    console.log(`🔍 Buscando chamadas desde: ${twentyFourHoursAgo.toISOString()}`);

    // 2. Consultar as chamadas nas últimas 24 horas
    // Nota: Removido o filtro '!=' de analysisStatus para evitar a necessidade de índice composto
    const snapshot = await db.collection('calls_analysis')
        .where('createdAt', '>=', firestoreTimestamp)
        .get();

    if (snapshot.empty) {
        console.log('✅ Nenhuma chamada recente encontrada.');
        return;
    }

    // Filtragem manual rigorosa para evitar reprocessamento de chamadas já analisadas
    const callsToReprocess = snapshot.docs.filter(doc => {
        const data = doc.data();
        // Não reprocessa se já estiver 'DONE' ou se já tiver timestamp de análise
        return data.processingStatus !== 'DONE' && !data.analyzedAt;
    });

    if (callsToReprocess.length === 0) {
        console.log('✅ Todas as chamadas recentes já foram analisadas ou estão em estado final.');
        return;
    }

    console.log(`📦 Encontradas ${callsToReprocess.length} chamadas que aguardam análise.`);

    // 3. Adicionar cada chamada à fila de reprocessamento
    const queueRef = db.collection('reprocessing_queue');
    const batch = db.batch();

    callsToReprocess.forEach(doc => {
        const data = doc.data();
        const newTaskRef = queueRef.doc();
        batch.set(newTaskRef, {
            callId: doc.id,
            originalCreatedAt: data.createdAt || null,
            queuedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            reprocessingReason: 'MANUAL_REQUEUE_UNANALYZED'
        });
        console.log(`  - Agendando: ${doc.id} (Status atual: ${data.processingStatus || 'N/A'})`);
    });

    await batch.commit();

    console.log(`🎉 Sucesso! ${callsToReprocess.length} chamadas foram adicionadas à fila 'reprocessing_queue'.`);
}

requeueRecentCalls().catch(error => {
    console.error("❌ Erro durante o processo de re-enfileiramento:", error);
    process.exit(1);
});