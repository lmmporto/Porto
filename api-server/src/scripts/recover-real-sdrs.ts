import { db } from '../firebase.js';
import { MetricsService } from '../services/metrics.service.js';

const SDR_REGISTRY_COLLECTION = 'sdr_registry';

function normalizeEmail(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isRealNiboEmail(email: string): boolean {
    return email.endsWith('@nibo.com.br');
}

async function runRecoverRealSdrs(): Promise<void> {
    const startedAt = Date.now();

    console.log('🚀 [RECOVERY] Iniciando repovoamento real dos SDRs...');

    try {
        const registrySnapshot = await db.collection(SDR_REGISTRY_COLLECTION).get();

        const realEmails = Array.from(
            new Set(
                registrySnapshot.docs
                    .map((doc) => normalizeEmail(doc.data().email))
                    .filter((email) => email.length > 0 && isRealNiboEmail(email))
            )
        ).sort();

        if (realEmails.length === 0) {
            console.log('[RECOVERY] Nenhum e-mail real encontrado em sdr_registry.');
            return;
        }

        console.log(`[RECOVERY] ${realEmails.length} SDR(s) real(is) encontrado(s) para recalcular.`);

        for (const email of realEmails) {
            try {
                process.stdout.write(`[RECOVERY] Calculando métricas para: ${email}... `);
                await MetricsService.updateSDRMetrics(email);
                process.stdout.write('OK\n');
            } catch (error) {
                console.error(`\n[RECOVERY] Falha ao calcular métricas para ${email}:`, error);
            }
        }

        console.log(`✅ [RECOVERY] Processo finalizado em ${Date.now() - startedAt}ms`);
    } catch (error) {
        console.error('🚨 [RECOVERY] Erro fatal:', error);
        process.exitCode = 1;
    }
}

runRecoverRealSdrs();