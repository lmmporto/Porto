// backend/src/routes/sdr-registry.ts
import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('sdr_registry').get();
    const sdrs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    res.json(sdrs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar SDRs' });
  }
});

router.get('/members', async (req, res) => {
  const { team } = req.query;
  try {
    const snapshot = await db.collection('sdr_registry')
      .where('assignedTeam', '==', team)
      .where('isActive', '==', true)
      .get();
    const emails = snapshot.docs.map(doc => doc.data().email);
    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar membros do time' });
  }
});

// Rota para atualizar o time de um SDR
router.put('/update-sdr', requireAdmin, async (req, res) => {
  const { sdrId, assignedTeam } = req.body;
  
  console.log("📥 Recebido update para:", { sdrId, assignedTeam });

  try {
    const docRef = db.collection('sdr_registry').doc(sdrId);
    // Usamos set com merge: true para garantir a escrita (cria se não existir)
    await docRef.set({ assignedTeam }, { merge: true });
    
    console.log("✅ Escrita no Firestore concluída com sucesso.");
    res.status(200).json({ success: true, message: 'SDR team updated successfully' });
  } catch (error) {
    console.error("❌ Erro fatal no Firestore:", error);
    res.status(500).json({ error: 'Erro ao atualizar SDR' });
  }
});

export default router;