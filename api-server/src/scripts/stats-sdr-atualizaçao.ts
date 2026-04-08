import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

async function fixSdrStats() {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
        initializeApp({ credential: cert(serviceAccount) });
        const db = getFirestore();

        console.log("⏳ 1. Lendo o registro oficial de SDRs...");
        const registry = await db.collection('sdr_registry').get();
        const sdrMap = new Map();
        registry.docs.forEach(d => sdrMap.set(d.data().name, d.data().email));

        console.log("⏳ 2. Atualizando a coleção sdr_stats...");
        const statsSnapshot = await db.collection('sdr_stats').get();
        const batch = db.batch();
        let count = 0;

        for (const doc of statsSnapshot.docs) {
            // O sdr_stats usa o ownerName, vamos usá-lo para achar o e-mail
            const name = doc.data().ownerName || doc.id; 
            const email = sdrMap.get(name);

            if (email && doc.data().ownerEmail !== email) {
                batch.update(doc.ref, { ownerEmail: email });
                console.log(`✅ Atualizando: ${name} -> ${email}`);
                count++;
            } else if (!email) {
                console.warn(`⚠️ E-mail não encontrado no registro para: ${name}`);
            }
        }

        if (count > 0) {
            await batch.commit();
            console.log(`🎉 Sucesso! ${count} documentos corrigidos no sdr_stats.`);
        } else {
            console.log("👍 Nenhum documento precisava de correção.");
        }
        process.exit(0);
    } catch (error) {
        console.error("🛑 Erro:", error);
        process.exit(1);
    }
}

fixSdrStats();

//pnpm tsx src/scripts/fix-sdr-stats.ts