// src/routes/stats.ts (ou o arquivo que contém seu endpoint /stats/summary)

import { Router } from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';

const router = Router();

// 🚩 CONSTANTE: Fuso horário de Brasília para reuso e clareza
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

router.get('/stats/summary', async (req, res) => {
  // 🚩 ADICIONAR ESTE LOG NO INÍCIO DO HANDLER
  console.log('!!!!!!!!!!!! INICIANDO HANDLER /api/stats/summary (VERSÃO COM AGREGACAO)! !!!!!!!!!!!!'); 
  
  try {
    const { startDate, endDate } = req.query;

    const nowInBrazil = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const brDate = nowInBrazil.split('/').reverse().join('-');

    console.log(`[DEBUG - STATS_SUMMARY] brDate calculado: ${brDate}`);

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
        sdr_ranking: {}, empty: true,
        _debug_version: "FINAL_V1_BR_TIMEZONE_AGREGATED_04042024_EMPTY_SNAPSHOT" // 🚩 VERSÃO DO DEBUG
      });
    }

    let total_calls = 0; 
    let valid_calls = 0; 
    let sum_notes = 0;
    const sdr_ranking: Record<string, any> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      total_calls += Number(data.total_calls || 0);
      
      valid_calls += Number(data.valid_calls || data.valid_calls_for_media || data.analyzed_calls || 0);
      
      sum_notes += Number(data.sum_notes || 0);

      if (data.sdr_ranking) {
        for (const [sdrName, stats] of Object.entries(data.sdr_ranking)) {
          if (!sdr_ranking[sdrName]) sdr_ranking[sdrName] = { calls: 0, sum_notes: 0, valid_calls: 0, nota_media: 0 };
          const sdrStats = stats as any;
          sdr_ranking[sdrName].calls += Number(sdrStats.calls || sdrStats.total || 0);
          sdr_ranking[sdrName].valid_calls += Number(sdrStats.valid_calls || sdrStats.valid_count || 0);
          sdr_ranking[sdrName].sum_notes += Number(sdrStats.sum_notes || 0);
          if (sdr_ranking[sdrName].valid_calls > 0) {
            sdr_ranking[sdrName].nota_media = Number((sdr_ranking[sdrName].sum_notes / sdr_ranking[sdrName].valid_calls).toFixed(2));
          }
        }
      }
    });

    const mediaGeral = valid_calls > 0 ? (sum_notes / valid_calls) : 0;
    
    console.log(`📊 [STATS] Resumo - Total: ${total_calls}, Válidas: ${valid_calls}, Média Geral: ${mediaGeral.toFixed(2)}`);

    return res.json({ 
      total_calls, 
      valid_calls, 
      sum_notes, 
      media_geral: Number(mediaGeral.toFixed(2)), 
      sdr_ranking,
      _debug_version: "FINAL_V1_BR_TIMEZONE_AGREGATED_04042024_WITH_DATA" // 🚩 VERSÃO DO DEBUG
    });

  } catch (error: any) {
    console.error("❌ [STATS ERROR]:", error.message, error);
    return res.status(500).json({ 
      error: "Erro interno", 
      details: error.message, 
      _debug_version: "FINAL_V1_BR_TIMEZONE_AGREGATED_04042024_ERROR" // 🚩 VERSÃO DO DEBUG
    });
  }
});

export default router;