import { Router } from 'express';
import { db } from '../firebase.js';

const router = Router();

// Rota para buscar o "Cofre de Saldos" do dia
router.get('/summary', async (req, res) => {
  try {
    // 1. Define a data de hoje (AAAA-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('dashboard_stats').doc(today);
    const doc = await statsRef.get();

    // 2. Se não houver dados hoje, retorna um objeto padrão "zerado"
    if (!doc.exists) {
      return res.json({ 
        message: "Nenhum dado para hoje ainda", 
        total_calls: 0,
        media_geral: 0,
        empty: true 
      });
    }

    const data = doc.data() || {};
    
    // 3. Cálculos de segurança para evitar erro de divisão por zero
    const sumNotes = Number(data.sum_notes || 0);
    const validCalls = Number(data.valid_calls || 0);
    const mediaGeral = validCalls > 0 ? (sumNotes / validCalls) : 0;

    // 4. Retorno do JSON (Limpamos o erro de ponto e vírgula que estava aqui)
    return res.json({
      ...data,
      media_geral: Number(mediaGeral.toFixed(2))
    });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message);
    return res.status(500).json({ error: "Erro ao buscar resumo das métricas" });
  }
});

export default router;