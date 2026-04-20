import admin from 'firebase-admin';
import { db } from '../firebase.js';

type FirestoreDoc = FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>;

const { FieldValue } = admin.firestore;

const SDRS_COLLECTION = 'sdrs';
const CALLS_ANALYSIS_COLLECTION = 'calls_analysis';
const BATCH_LIMIT = 450;

function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function isFakeSdr(data: Record<string, unknown>): boolean {
    const email = normalizeString(data.email).toLowerCase();
    const name = normalizeString(data.name).toLowerCase();

    return email.includes('@teste.com') || name.includes('teste');
}

function isFakeCallAnalysis(data: Record<string, unknown>): boolean {
    const ownerEmail = normalizeString(data.ownerEmail).toLowerCase();

    if (!ownerEmail) return true;
    if (ownerEmail.includes('@teste.com')) return true;
    if (ownerEmail === 'alfa@empresa.com') return true;
    if (!ownerEmail.endsWith('@nibo.com.br')) return true;

    return false;
}

async function deleteDocsInBatches(
    docs: FirestoreDoc[],
    collectionName: string,
    describeDoc: (doc: FirestoreDoc) => string
): Promise<number> {
    let deletedCount = 0;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
        const chunk = docs.slice(i, i + BATCH_LIMIT);
        const batch = db.batch();

        for (const doc of chunk) {
            console.log(`[CLEANUP] Removendo ${collectionName}/${doc.id} -> ${describeDoc(doc)}`);
            batch.delete(doc.ref);
        }

        await batch.commit();
        deletedCount += chunk.length;
        console.log(`[CLEANUP] Batch concluído em ${collectionName}: ${chunk.length} documento(s) removido(s).`);
    }

    return deletedCount;
}

async function cleanupSdrs(): Promise<number> {
    console.log(`\n🧹 [CLEANUP] Verificando coleção: ${SDRS_COLLECTION}`);

    const snapshot = await db.collection(SDRS_COLLECTION).get();
    const fakeDocs = snapshot.docs.filter((doc) => isFakeSdr(doc.data()));

    if (fakeDocs.length === 0) {
        console.log(`[CLEANUP] Nenhum SDR fake encontrado em ${SDRS_COLLECTION}.`);
        return 0;
    }

    return deleteDocsInBatches(fakeDocs, SDRS_COLLECTION, (doc) => {
        const data = doc.data();
        return `email=${normalizeString(data.email)} | name=${normalizeString(data.name)}`;
    });
}

async function cleanupCallsAnalysis(): Promise<number> {
    console.log(`\n🧹 [CLEANUP] Verificando coleção: ${CALLS_ANALYSIS_COLLECTION}`);

    const snapshot = await db.collection(CALLS_ANALYSIS_COLLECTION).get();
    const fakeDocs = snapshot.docs.filter((doc) => isFakeCallAnalysis(doc.data()));

    if (fakeDocs.length === 0) {
        console.log(`[CLEANUP] Nenhuma call fake encontrada em ${CALLS_ANALYSIS_COLLECTION}.`);
        return 0;
    }

    return deleteDocsInBatches(fakeDocs, CALLS_ANALYSIS_COLLECTION, (doc) => {
        const data = doc.data();
        return `ownerEmail=${normalizeString(data.ownerEmail)} | ownerName=${normalizeString(data.ownerName)} | callId=${doc.id}`;
    });
}

async function runCleanupFakes(): Promise<void> {
    const startedAt = Date.now();

    console.log('🚀 [CLEANUP] Iniciando limpeza de dados falsos...');

    try {
        const deletedSdrs = await cleanupSdrs();
        const deletedCalls = await cleanupCallsAnalysis();

        console.log('\n✅ [CLEANUP] Limpeza concluída com sucesso.');
        console.log(`[CLEANUP] Total removido em ${SDRS_COLLECTION}: ${deletedSdrs}`);
        console.log(`[CLEANUP] Total removido em ${CALLS_ANALYSIS_COLLECTION}: ${deletedCalls}`);
        console.log(`[CLEANUP] Tempo total: ${Date.now() - startedAt}ms`);
    } catch (error) {
        console.error('🚨 [CLEANUP] Erro fatal durante a limpeza:', error);
        process.exitCode = 1;
    }
}

runCleanupFakes();