import 'dotenv/config';
import { db } from '../firebase.js';
import { CONFIG } from '../config.js';
import {
  fetchCall,
  fetchOwnerDetails,
  getOwnerIdByEmail
} from '../services/hubspot.js';
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

/**
 * ============================================================
 * AJUSTE MANUAL FÁCIL DO PERÍODO
 * ============================================================
 * Troque apenas este número abaixo quando quiser mudar a janela:
 *
 * 48 = últimas 48 horas
 * 24 = últimas 24 horas
 * 72 = últimas 72 horas
 * etc.
 */
const LOOKBACK_HOURS = 48;

/**
 * ============================================================
 * AJUSTE MANUAL FÁCIL DE FILTROS
 * ============================================================
 */
const MIN_DURATION_MS = 119000;
const SEARCH_LIMIT_PER_SDR = 100;
const REQUIRE_RECORDING_URL = true;

function hasAudioRecording(call: any): boolean {
  return Boolean(call?.properties?.hs_call_recording_url);
}

function getDurationMs(call: any): number {
  const raw = call?.properties?.hs_call_duration;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLookbackTimestamp(hours: number): string {
  return String(Date.now() - hours * 60 * 60 * 1000);
}

async function syncMissingCallsFromPeriod() {
  console.log('📡 [SYNC] Iniciando busca de chamadas ausentes no banco...');
  console.log(
    '🔑 Verificando credenciais: HUBSPOT_TOKEN está',
    CONFIG.HUBSPOT_TOKEN ? 'PRESENTE' : 'AUSENTE'
  );
  console.log(`🕒 [SYNC] Janela de busca configurada para últimas ${LOOKBACK_HOURS} horas.`);

  try {
    const fromTimestamp = getLookbackTimestamp(LOOKBACK_HOURS);
    const collectionName = CONFIG.CALLS_COLLECTION || 'calls_analysis';

    for (const email of ELITE_SDRS) {
      try {
        const ownerId = await getOwnerIdByEmail(email);

        if (!ownerId) {
          console.warn(`⚠️ [SYNC] Owner não encontrado para ${email}. Pulando...`);
          continue;
        }

        console.log(`👤 [SYNC] SDR ${email} -> ownerId ${ownerId}. Buscando chamadas...`);

        const filters: any[] = [
          { propertyName: 'hubspot_owner_id', operator: 'EQ', value: ownerId },
          { propertyName: 'hs_timestamp', operator: 'GTE', value: fromTimestamp },
          { propertyName: 'hs_call_duration', operator: 'GTE', value: String(MIN_DURATION_MS) }
        ];

        if (REQUIRE_RECORDING_URL) {
          filters.push({
            propertyName: 'hs_call_recording_url',
            operator: 'HAS_PROPERTY'
          });
        }

        const searchResponse = await hubspot.post('/crm/v3/objects/calls/search', {
          filterGroups: [{ filters }],
          sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
          properties: [
            'hs_call_title',
            'hs_call_body',
            'hs_call_duration',
            'hs_timestamp',
            'hubspot_owner_id',
            'hs_call_recording_url',
            'hs_createdate',
            'hs_lastmodifieddate'
          ],
          limit: SEARCH_LIMIT_PER_SDR
        });

        const results = searchResponse.data.results || [];
        console.log(`🔎 [${email}] ${results.length} chamadas retornadas pelo HubSpot.`);

        for (const hsCall of results) {
          const callId = hsCall.id;
          const durationMs = getDurationMs(hsCall);
          const hasAudio = hasAudioRecording(hsCall);

          console.log(
            `[SYNC] Verificando Call ${callId}: Áudio encontrado? ${hasAudio ? 'Sim' : 'Não'} | Duração: ${Math.floor(durationMs / 1000)}s`
          );

          if (durationMs < MIN_DURATION_MS) {
            console.log(`⏭️ [SKIP] ${callId} com duração insuficiente.`);
            continue;
          }

          if (REQUIRE_RECORDING_URL && !hasAudio) {
            console.log(`⏭️ [SKIP] ${callId} sem gravação.`);
            continue;
          }

          const callRef = db.collection(collectionName).doc(callId);
          const existingDoc = await callRef.get();

          /**
           * REGRA PRINCIPAL:
           * Se a call já existe no banco, não processa de novo.
           * Isso evita duplicidade e não apaga nada antigo.
           */
          if (existingDoc.exists) {
            console.log(`⏭️ [SKIP] ${callId} já existe no Firestore.`);
            continue;
          }

          try {
            console.log(`🛠️ [PROCESS] Iniciando processamento da call ${callId}...`);

            const callData = await fetchCall(callId);
            const ownerDetails = await fetchOwnerDetails(callData.ownerId);

            if (!ownerDetails?.ownerEmail || !ELITE_SDRS.includes(ownerDetails.ownerEmail.toLowerCase())) {
              console.log(
                `⏭️ [SKIP] ${callId} pertence a ${ownerDetails?.ownerEmail || 'owner desconhecido'}, fora da lista alvo.`
              );
              continue;
            }

            /**
             * GARANTIA DE TRANSCRIÇÃO
             * Se não veio transcript suficiente, tenta gerar a partir do áudio.
             * A transcrição fica salva no documento para uso futuro.
             */
            if (!callData.transcript || callData.transcript.length < 100) {
              if (callData.recordingUrl) {
                console.log(`🎙️ [TRANSCRIBE] Gerando transcrição para ${callId}...`);
                const newTranscript = await transcribeRecordingFromHubSpot(callData);

                if (newTranscript && newTranscript.trim().length >= 100) {
                  callData.transcript = newTranscript;
                  callData.hasTranscript = true;
                  console.log(`✅ [TRANSCRIBE] Transcrição salva em memória para ${callId}.`);
                } else {
                  console.warn(`⚠️ [SKIP] ${callId} sem transcrição útil após tentativa.`);
                  continue;
                }
              } else {
                console.warn(`⚠️ [SKIP] ${callId} sem áudio para transcrever.`);
                continue;
              }
            }

            const actualCallDate = callData.timestamp ? new Date(callData.timestamp) : new Date();
            const safeDate = isNaN(actualCallDate.getTime()) ? new Date() : actualCallDate;

            console.log(`🧠 [ANALYSIS] Enviando ${callId} para análise...`);
            const result = await analyzeCallWithGemini(callData, ownerDetails);

            /**
             * PAYLOAD COMPLETO
             * Mantém transcript, metadados da call, resultado da análise,
             * owner e timestamps.
             */
            const payloadToSave = {
              ...callData,
              ...result.analysis,
              analysisResult: result.analysis,

              ownerId: callData.ownerId || ownerDetails.ownerId || null,
              ownerName: ownerDetails.ownerName || 'SDR Desconhecido',
              ownerEmail: ownerDetails.ownerEmail || email,

              hasTranscript: Boolean(callData.transcript && callData.transcript.length >= 100),
              transcriptLength: callData.transcript ? callData.transcript.length : 0,

              lastAnalysisVersion: TARGET_VERSION,
              processingStatus: 'DONE',

              callTimestamp: safeDate,
              source: 'hubspot_sync_missing_calls_48h',

              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            };

            /**
             * IMPORTANTE:
             * merge:true evita apagar campos futuros/adicionais.
             * Como a doc não existe, cria tudo.
             * Se por algum motivo existir algo parcial, complementa sem destruir.
             */
            await callRef.set(payloadToSave, { merge: true });

            await updateDailyStats(payloadToSave, result.analysis, true);

            const notaFinal =
              result.analysis?.nota_spin !== null && result.analysis?.nota_spin !== undefined
                ? Number(result.analysis.nota_spin)
                : null;

            if (notaFinal !== null && !Number.isNaN(notaFinal)) {
              await updateSdrGlobalStats(
                payloadToSave.ownerEmail,
                payloadToSave.ownerName,
                notaFinal
              );
            }

            console.log(`✅ [SUCCESS] ${callId} salva com transcrição e análise.`);
          } catch (err: any) {
            console.error(`❌ [ERROR] ${callId}:`, err?.message || err);

            await callRef.set(
              {
                processingStatus: 'ERROR',
                lastError: err?.message || String(err),
                updatedAt: FieldValue.serverTimestamp()
              },
              { merge: true }
            );
          }
        }
      } catch (err: any) {
        console.error(`❌ [SYNC][${email}] Erro ao buscar/processar chamadas:`, err?.message || err);
      }
    }

    console.log('🏁 [SYNC] Finalizado.');
  } catch (error: any) {
    console.error('🚨 [SYNC FATAL]:', error?.message || error);
  }
}

syncMissingCallsFromPeriod();