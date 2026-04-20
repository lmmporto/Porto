import 'dotenv/config';
import { db } from '../firebase.js'; // 🚩 Importação obrigatória do banco de dados
import dotenv from 'dotenv';
/**
 * ⛏️ SCRIPT DE CURA DE DADOS (SYNC EMAILS)
 * Objetivo: Garantir que todas as chamadas na coleção 'calls_analysis' 
 * tenham o 'ownerEmail' correto baseado no 'sdr_registry'.
 */
async function syncAllCalls() {
  console.log('⛏️ [SYNC] Iniciando sincronização de e-mails...');

  try {
    // 1. Carrega o dicionário de SDRs (Nome -> Email)
    const registrySnapshot = await db.collection('sdr_registry').get();
    const sdrMap = new Map<string, string>();

    registrySnapshot.docs.forEach(d => {
      const data = d.data();
      if (data.name && data.email) {
        sdrMap.set(data.name, data.email);
      }
    });

    console.log(`🔎 [INFO] Dicionário carregado com ${sdrMap.size} SDRs.`);

    // 2. Busca todas as chamadas (ou em lotes se forem milhares)
    const callsSnapshot = await db.collection('calls_analysis').get();
    console.log(`🔎 [INFO] Analisando ${callsSnapshot.size} chamadas...`);

    let updatedCount = 0;

    for (const doc of callsSnapshot.docs) {
      const data = doc.data();
      const emailCorreto = sdrMap.get(data.ownerName);

      // 🚩 A LÓGICA DE CURA: Se o e-mail no banco for diferente do e-mail oficial, corrige.
      if (emailCorreto && data.ownerEmail !== emailCorreto) {
        await doc.ref.update({ ownerEmail: emailCorreto });
        console.log(`✅ [CORRIGIDO] Call ${doc.id}: ${data.ownerName} -> ${emailCorreto}`);
        updatedCount++;
      }
    }

    console.log(`✨ [FIM] Sincronização concluída. Total de documentos corrigidos: ${updatedCount}`);
  } catch (error: any) {
    console.error(`❌ [ERRO FATAL] Falha na sincronização:`, error.message);
  }
}

// Executa a função
syncAllCalls().catch(console.error);

//pnpm tsx src/scripts/sincronizar-calls-registro.ts