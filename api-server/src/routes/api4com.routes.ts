import { Router, type Request, type Response } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import { CALLS_COLLECTION } from '../domain/analysis/analysis.constants.js';
import { CallStatus } from '../domain/analysis/analysis.types.js';

const router = Router();

const MIN_DURATION_SECONDS = 60;

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // 1. Filtrar apenas channel-hangup
    if (payload.eventType !== 'channel-hangup') {
      return res.status(200).json({ ignored: true, reason: 'NOT_HANGUP' });
    }

    // 2. Filtrar chamadas curtas
    const duration = parseInt(payload.duration || '0', 10);
    if (duration < MIN_DURATION_SECONDS) {
      return res.status(200).json({ ignored: true, reason: 'SHORT_CALL', duration });
    }

    // 3. Exigir URL de gravação
    if (!payload.recordUrl) {
      return res.status(200).json({ ignored: true, reason: 'NO_RECORD_URL' });
    }

    const callId = payload.id;

    // 4. Idempotência — ignorar se já existe
    const existing = await db.collection(CALLS_COLLECTION).doc(callId).get();
    if (existing.exists) {
      return res.status(200).json({ ignored: true, reason: 'ALREADY_EXISTS' });
    }

    // 5. Lookup do SDR pelo ramal (caller)
    const extension = payload.caller?.toString();
    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    let teamName: string | null = null;

    if (extension) {
      const sdrSnap = await db.collection('sdr_registry')
        .where('extension', '==', extension)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!sdrSnap.empty) {
        const sdr = sdrSnap.docs[0].data();
        ownerEmail = sdr.email || null;
        ownerName = sdr.name || null;
        teamName = sdr.assignedTeam || null;
      }
    }

    // 6. Calcular timestamps
    const callTimestamp = payload.startedAt
      ? admin.firestore.Timestamp.fromDate(new Date(payload.startedAt))
      : admin.firestore.Timestamp.now();

    // 7. Criar documento na fila
    await db.collection(CALLS_COLLECTION).doc(callId).set({
      id: callId,
      callId,
      source: 'api4com',
      processingStatus: CallStatus.QUEUED,
      recordingUrl: payload.recordUrl,
      durationMs: duration * 1000,
      caller: payload.caller,
      called: payload.called,
      direction: payload.direction || 'outbound',
      hangupCause: payload.hangupCause || null,
      ownerEmail,
      ownerName,
      teamName,
      callTimestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ [Api4com] Call ${callId} enfileirada. SDR: ${ownerEmail || `ramal ${extension} não mapeado`}`);
    return res.status(200).json({ success: true, callId });

  } catch (error: any) {
    console.error('❌ [Api4com] Erro no webhook:', error?.message || error);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
