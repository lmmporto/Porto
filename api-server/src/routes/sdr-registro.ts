// backend/src/routes/sdr-registry.ts
import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('sdr_registry').get();
    const sdrs = snapshot.docs.map(doc => ({
      name: doc.data().name,
      email: doc.data().email
    }));
    res.json({ sdrs });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar registro de SDRs' });
  }
});

export default router;