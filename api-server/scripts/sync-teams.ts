import { db } from '../src/firebase.js';
import { MetricsService } from '../src/services/metrics.service.js';
async function syncAll() {
    console.log("🚀 Iniciando sincronização de times...");
    const registry = await db.collection('sdr_registry').get();

    for (const doc of registry.docs) {
        const email = doc.data().email;
        if (email) {
            console.log(`🔄 Sincronizando: ${email}`);
            await MetricsService.updateSDRMetrics(email);
        }
    }
    console.log("✅ Sincronização concluída!");
}

syncAll().catch(console.error);