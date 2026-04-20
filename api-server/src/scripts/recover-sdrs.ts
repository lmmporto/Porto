import 'dotenv/config';
import { db } from '../firebase.js';
import { processCall } from '../services/processCall.js';
import { getOwnerIdByEmail } from '../services/hubspot.js';
import axios from 'axios';
import admin from 'firebase-admin';

const ELITE_SDRS = [
  'amaranta.vieira@nibo.com.br',
  'andriel.mateus@nibo.com.br',
  'bruno.rezende@nibo.com.br',
  'elder.fernando@nibo.com.br',
  'italo.xavier@nibo.com.br',
  'mateus.braga@nibo.com.br'
];

const MIN_DURATION_MS = 119000;
const DELAY_BETWEEN_CALLS = 15000;
const LOOKBACK_DAYS = 30;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resetCollections() {
  console.log('[RECOVERY] Resetando estatísticas e coleção de SDRs...');
  
  await db.collection('dashboard_stats').doc('global_summary').set({
    total_calls: 0,
    total_revenue_opportunity: 0,
    average_score: 0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const sdrsSnap = await db.collection('sdrs').get();
  const batch = db.batch();
  sdrsSnap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log('[RECOVERY] Limpeza concluída.');
}

async function run() {
  try {
    await resetCollections();

    const now = Date.now();
    const startTime = now - (LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    for (const email of ELITE_SDRS) {
      console.log(`[RECOVERY] Mapeando SDR: ${email}...`);
      const ownerId = await getOwnerIdByEmail(email);

      if (!ownerId) {
        console.error(`[RECOVERY] Não foi possível encontrar ID para ${email}`);
        continue;
      }

      console.log(`[RECOVERY] SDR ${email} mapeado para ID ${ownerId}. Buscando chamadas (Min 119s)...`);

      const searchResponse = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/calls/search',
        {
          filterGroups: [{
            filters: [
              { propertyName: 'hubspot_owner_id', operator: 'EQ', value: ownerId },
              { propertyName: 'hs_call_duration', operator: 'GTE', value: MIN_DURATION_MS.toString() },
              { propertyName: 'hs_timestamp', operator: 'GTE', value: startTime.toString() }
            ]
          }],
          sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
          limit: 10
        },
        { headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` } }
      );

      const calls = searchResponse.data.results || [];
      console.log(`[RECOVERY] Encontradas ${calls.length} chamadas válidas para ${email}.`);

      for (const call of calls) {
        try {
          console.log(`[RECOVERY] Processando Call ${call.id} para ${email}...`);
          await processCall(call.id);
          console.log(`[RECOVERY] Call ${call.id} finalizada. Aguardando ${DELAY_BETWEEN_CALLS/1000}s...`);
          await sleep(DELAY_BETWEEN_CALLS);
        } catch (err) {
          console.error(`[RECOVERY] Erro ao processar call ${call.id}:`, err);
        }
      }
    }
    console.log('[RECOVERY] Processo de recuperação de elite finalizado com sucesso.');
  } catch (error) {
    console.error('[RECOVERY] Erro crítico no script:', error);
  }
}

run();