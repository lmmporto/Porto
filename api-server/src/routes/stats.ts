import { Router } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para reuso e clareza
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 🚩 SOLUÇÃO SÊNIOR: Forçar fuso horário de Brasília para o "Hoje"
    // Isso evita que às 21h UTC o servidor ache que já é amanhã no Brasil.
    const nowInBrazil = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()); // Ex: "27/03/2026"

    const brDate = nowInBrazil.split('/').reverse().join('-'); // Ex: "2026-03-27"

    // Se o frontend mandou startDate, usamos ela. Se não, usamos a data do BR.
    const start = startDate ? String(startDate).split('T')[0] : brDate;
    const end = endDate ? String(endDate).split('T')[0] : brDate;

    console.log(`📊 [STATS] Buscando resumo de ${start} até ${end} (Hoje Ref: ${brDate})`);

    const snapshot = await db.collection('dashboard_stats')
      .where(admin.firestore.FieldPath.documentId(), '>=', start)
      .where(admin.firestore.FieldPath.documentId(), '<=', end)
      .get();

    if (snapshot.empty) {
      console.log(`📊 [STATS] Nenhum dado encontrado para ${start} até ${end}.`);
      return res.json({ 
        message: "Nenhum dado encontrado para este período", 
        total_calls: 0, valid_calls: 0, sum_notes: 0, media_geral: 0,
        sdr_ranking: {}, empty: true 
      });
    }

    let total_calls = 0; 
    let valid_calls = 0; 
    let sum_notes = 0;
    const sdr_ranking: Record<string, any> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      total_calls += Number(data.total_calls || 0);
      
      // 🚩 Mantido: Flexibilidade para ler colunas antigas ou a nova 'valid_calls'
      valid_calls += Number(data.valid_calls || data.valid_calls_for_media || data.analyzed_calls || 0);
      
      sum_notes += Number(data.sum_notes || 0);

      if (data.sdr_ranking) {
        for (const [sdrName, stats] of Object.entries(data.sdr_ranking)) {
          if (!sdr_ranking[sdrName]) sdr_ranking[sdrName] = { calls: 0, sum_notes: 0, valid_calls: 0, nota_media: 0 };
          const sdrStats = stats as any;
          sdr_ranking[sdrName].calls += Number(sdrStats.calls || sdrStats.total || 0);
          // 🚩 Mantido: Flexibilidade para ler colunas antigas ou a nova 'valid_count'
          sdr_ranking[sdrName].valid_calls += Number(sdrStats.valid_calls || sdrStats.valid_count || 0);
          sdr_ranking[sdrName].sum_notes += Number(sdrStats.sum_notes || 0);
          if (sdr_ranking[sdrName].valid_calls > 0) {
            sdr_ranking[sdrName].nota_media = Number((sdr_ranking[sdrName].sum_notes / sdr_ranking[sdrName].valid_calls).toFixed(2));
          }
        }
      }
    });

    const mediaGeral = valid_calls > 0 ? (sum_notes / valid_calls) : 0;
    
    // 🚩 Saída para depuração
    console.log(`📊 [STATS] Resumo - Total: ${total_calls}, Válidas: ${valid_calls}, Média Geral: ${mediaGeral.toFixed(2)}`);

    return res.json({ total_calls, valid_calls, sum_notes, media_geral: Number(mediaGeral.toFixed(2)), sdr_ranking });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message, error); // 🚩 Loga mais detalhes do erro
    return res.status(500).json({ error: "Erro interno", details: error.message });
  }
});

export default router;