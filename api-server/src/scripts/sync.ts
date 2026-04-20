import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import { fetchCall, fetchOwnerDetails, getOwnerIdByEmail } from '../services/hubspot.js';
import {
  analyzeCallWithGemini,
  updateDailyStats,
  updateSdrGlobalStats,
  transcribeRecordingFromHubSpot
} from '../services/analysis.service.js';
import { hubspot } from '../clients.js';
import admin from 'firebase-admin';

const { FieldValue } = admin.firestore;
const TARGET_VERSION = 'V10_MESTRE_MENTOR';

const ELITE_SDRS = [
  'amaranta.vieira@nibo.com.br',
  'andriel.mateus@nibo.com.br',
  'bruno.rezende@nibo.com.br',
  'elder.fernando@nibo.com.br',
  'italo.xavier@nibo.com.br',
  'mateus.braga@nibo.com.br'
];

async function syncLast24Hours() {
  console.log('📡 [SYNC] Iniciando varredura das últimas 24h no HubSpot...');
  console.log(
    '🔑 Verificando credenciais: HUBSPOT_TOKEN está',
    CONFIG.HUBSPOT_TOKEN ? 'PRESENTE' : 'AUSENTE'
  );

  try {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const email of ELITE_SDRS) {
      try {
        const ownerId = await getOwnerIdByEmail(email);

        if (!ownerId) {
          console.warn(`⚠️ [SYNC] Owner não encontrado para ${email}. Pulando...`);
          continue;
        }

        console.log(`👤 [SYNC] SDR ${email} mapeado para ownerId ${ownerId}. Buscando chamadas...`);

        const searchResponse = await hubspot.post('/crm/v3/objects/calls/search', {
          filterGroups: [
            {
              filters: [
                { propertyName: 'hubspot_owner_id', operator: 'EQ', value: ownerId },
                { propertyName: 'hs_timestamp', operator: 'GTE', value: String(twentyFourHoursAgo) },
                { propertyName: 'hs_call_duration', operator: 'GTE', value: '110000' }
              ]
            }
          ],
          sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
          properties: [
            'hs_call_title',
            'hs_call_duration',
            'hs_timestamp',
            'hubspot_owner_id',
            'hs_call_recording_url'
          ],
          limit: 100
        });

        const results = searchResponse.data.results || [];
        console.log(`🔎 [${email}] Encontradas ${results.length} chamadas candidatas.`);

        for (const hsCall of results) {
          const callId = hsCall.id;
          const callRef = db.collection(CONFIG.CALLS_COLLECTION || 'calls_analysis').doc(callId);

          const doc = await callRef.get();
          if (doc.exists && doc.data()?.lastAnalysisVersion === TARGET_VERSION) {
            console.log(`⏭️ [SKIP] ${callId} já processada.`);
            continue;
          }

          try {
            console.log(`\n🛠️ Processando: ${callId} | SDR: ${email}`);
            const callData = await fetchCall(callId);
            const ownerDetails = await fetchOwnerDetails(callData.ownerId);

            // Garantia extra: processar apenas chamadas dos SDRs permitidos
            if (!ELITE_SDRS.includes(ownerDetails.ownerEmail)) {
              console.log(
                `⏭️ [SKIP] ${callId} pertence a ${ownerDetails.ownerEmail}, fora da lista de SDRs alvo.`
              );
              continue;
            }

            // 1. Garantia de Transcrição
            if (!callData.transcript || callData.transcript.length < 100) {
              if (callData.recordingUrl) {
                const newTranscript = await transcribeRecordingFromHubSpot(callData);
                if (newTranscript) {
                  callData.transcript = newTranscript;
                  callData.hasTranscript = true;
                }
              } else {
                console.warn(`⚠️ [SKIP] Chamada ${callId} sem áudio.`);
                continue;
              }
            }

            // 2. Análise Estruturada
            const result = await analyzeCallWithGemini(callData, ownerDetails);

            // 3. Tratamento de Data
            const actualCallDate = callData.timestamp ? new Date(callData.timestamp) : new Date();
            const safeDate = isNaN(actualCallDate.getTime()) ? new Date() : actualCallDate;

            // 4. Persistência Atômica e Enriquecida
            const payloadToSave = {
              ...callData,
              ...result.analysis,
              ownerName: ownerDetails.ownerName || 'SDR Desconhecido',
              ownerEmail: ownerDetails.ownerEmail || email,
              analysisResult: result.analysis,
              lastAnalysisVersion: TARGET_VERSION,
              processingStatus: 'DONE',
              callTimestamp: safeDate,
              updatedAt: FieldValue.serverTimestamp()
            };

            await callRef.set(payloadToSave, { merge: true });

            // 5. Atualização de Métricas Diárias
            await updateDailyStats(payloadToSave, result.analysis, true);

            // 6. Atualização Global de SDR
            const notaFinal =
              result.analysis.nota_spin !== null ? Number(result.analysis.nota_spin) : null;

            if (notaFinal !== null && !isNaN(notaFinal)) {
              await updateSdrGlobalStats(
                payloadToSave.ownerEmail,
                payloadToSave.ownerName,
                notaFinal
              );
            }

            console.log(`✅ [SUCCESS] ${callId} finalizada (${safeDate.toISOString()})`);
          } catch (err: any) {
            console.error(`❌ [ERROR] ${callId}:`, err.message);
            await callRef.set(
              {
                processingStatus: 'ERROR',
                lastError: err.message,
                updatedAt: FieldValue.serverTimestamp()
              },
              { merge: true }
            );
          }
        }
      } catch (err: any) {
        console.error(`❌ [SYNC][${email}] Erro ao buscar/processar chamadas:`, err.message);
      }
    }
  } catch (error: any) {
    console.error('🚨 [SYNC FATAL]:', error.message);
  }
}

syncLast24Hours();