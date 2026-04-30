import axios from 'axios';
import admin from 'firebase-admin';
import { db } from '../firebase.js';
import { HUBSPOT_CALL_PROPERTIES } from '../constants/hubspot.js';
import {
  CallStatus,
  FailureReason,
  SkipReason,
} from '../domain/analysis/analysis.types.js';
import {
  MAX_AUDIO_RETRIES,
  RETRY_INTERVAL_MINUTES,
} from '../domain/analysis/analysis.constants.js';
import { MIN_CALL_DURATION_MS } from '../domain/analysis/analysis.policy.js';
import { CALLS_COLLECTION } from '../constants/collections.js';

export interface RefreshPendingAudioCallResult {
  success: boolean;
  status?: CallStatus;
  reason?: string;
}

export async function refreshPendingAudioCall(
  callId: string
): Promise<RefreshPendingAudioCallResult> {
  const docRef = db.collection(CALLS_COLLECTION).doc(callId);

  try {
    if (!/^\d+$/.test(callId)) {
      console.warn(`⚠️ [SKIP] ID inválido detectado: "${callId}". Removendo ruído do banco.`);
      await docRef.delete();

      return {
        success: true,
        reason: 'INVALID_HUBSPOT_CALL_ID',
      };
    }

    const token = process.env.HUBSPOT_TOKEN;

    if (!token) {
      throw new Error('HUBSPOT_TOKEN não configurado no .env');
    }

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return {
        success: true,
        reason: 'CALL_DOCUMENT_NOT_FOUND',
      };
    }

    let response;

    try {
      response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/calls/${callId}?properties=${HUBSPOT_CALL_PROPERTIES}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.error(`🚫 [404] Chamada ${callId} não existe no HubSpot. Deletando...`);
        await docRef.delete();

        return {
          success: true,
          reason: 'HUBSPOT_CALL_NOT_FOUND',
        };
      }

      throw error;
    }

    const props = response.data.properties || {};

    const hsTimestamp = props.hs_timestamp || props.hs_createdate;
    const callDate = hsTimestamp ? new Date(hsTimestamp) : new Date();
    const safeDate = Number.isNaN(callDate.getTime()) ? new Date() : callDate;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (safeDate < thirtyDaysAgo) {
      console.log(
        `⏭️ [OLD] Descarte por antiguidade: ${callId} (${safeDate.toLocaleDateString()}).`
      );

      await docRef.set(
        {
          processingStatus: CallStatus.SKIPPED,
          skipReason: SkipReason.CALL_TOO_SHORT,
          skipDetails: 'OLD_CALL_PURGE',
          callTimestamp: admin.firestore.Timestamp.fromDate(safeDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        status: CallStatus.SKIPPED,
        reason: 'OLD_CALL_PURGE',
      };
    }

    const durationMs = Number(props.hs_call_duration || 0);

    if (durationMs < MIN_CALL_DURATION_MS) {
      console.log(
        `⏭️ [SHORT] Chamada ${callId} curta demais (${Math.round(durationMs / 1000)}s).`
      );

      await docRef.set(
        {
          processingStatus: CallStatus.SKIPPED,
          skipReason: SkipReason.CALL_TOO_SHORT,
          durationMs,
          callTimestamp: admin.firestore.Timestamp.fromDate(safeDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        status: CallStatus.SKIPPED,
        reason: SkipReason.CALL_TOO_SHORT,
      };
    }

    const hubspotTranscript = String(props.hs_call_transcript || '').trim();
    const recordingUrl = String(props.hs_call_recording_url || '').trim();

    const hasTranscript = hubspotTranscript.length >= 100;
    const hasAudio = Boolean(recordingUrl);

    const currentAttempts = Number(docSnap.data()?.audioRetryCount || 0);
    const newAttempts = currentAttempts + 1;

    if (!hasTranscript && !hasAudio && newAttempts >= MAX_AUDIO_RETRIES) {
      await docRef.set(
        {
          processingStatus: CallStatus.FAILED_NO_AUDIO,
          failureReason: FailureReason.NO_AUDIO_AFTER_RETRIES,
          audioRetryCount: newAttempts,
          lastAudioCheckAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `🚫 [TIMEOUT] Chamada ${callId} sem mídia após ${MAX_AUDIO_RETRIES} tentativas.`
      );

      return {
        success: false,
        status: CallStatus.FAILED_NO_AUDIO,
        reason: FailureReason.NO_AUDIO_AFTER_RETRIES,
      };
    }

    const updateData: Record<string, any> = {
      recordingUrl,
      hasAudio,
      hasTranscript,
      durationMs,
      audioRetryCount: newAttempts,
      callTimestamp: admin.firestore.Timestamp.fromDate(safeDate),
      lastAudioCheckAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRefreshError: admin.firestore.FieldValue.delete(),
      lastRefreshErrorAt: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (hasTranscript) {
      updateData.transcript = hubspotTranscript;
      updateData.transcriptSource = 'HUBSPOT';
      updateData.processingStatus = CallStatus.QUEUED;
      updateData.nextRetryAt = admin.firestore.FieldValue.delete();
    } else if (hasAudio) {
      updateData.processingStatus = CallStatus.QUEUED;
      updateData.nextRetryAt = admin.firestore.FieldValue.delete();
    } else {
      const nextRetryDate = new Date();
      nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

      updateData.processingStatus = CallStatus.PENDING_AUDIO;
      updateData.nextRetryAt = admin.firestore.Timestamp.fromDate(nextRetryDate);
    }

    await docRef.set(updateData, { merge: true });

    console.log(`✅ [${updateData.processingStatus}] Chamada ${callId} sincronizada.`);

    return {
      success: true,
      status: updateData.processingStatus,
    };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.statusText ||
      error.message ||
      String(error);

    console.error(`❌ [WORKER ERROR] Falha em ${callId}: ${errorMsg}`);

    const nextRetryDate = new Date();
    nextRetryDate.setMinutes(nextRetryDate.getMinutes() + RETRY_INTERVAL_MINUTES);

    await docRef
      .set(
        {
          processingStatus: CallStatus.PENDING_AUDIO,
          lastRefreshError: errorMsg,
          lastRefreshErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          nextRetryAt: admin.firestore.Timestamp.fromDate(nextRetryDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch((saveError: any) => {
        console.error(
          `Falha ao salvar erro de refresh para ${callId}:`,
          saveError?.message || saveError
        );
      });

    return {
      success: false,
      status: CallStatus.PENDING_AUDIO,
      reason: errorMsg,
    };
  }
}