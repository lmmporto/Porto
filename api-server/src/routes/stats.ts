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
    // 🚩 IMPORTANTE: Definir o tipo explicitamente para garantir que sdr_ranking seja um objeto
    const sdr_ranking: Record<string, { calls: number; sum_notes: number; valid_calls: number; nota_media: number }> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      // 🚩 ADICIONAR ESTE LOG TEMPORARIAMENTE para VER o formato exato dos dados
      console.log(`[DEBUG - STATS_SUMMARY - RAW DATA] Document ID: ${doc.id}, Data:`, JSON.stringify(data, null, 2));

      total_calls += Number(data.total_calls || 0);
      valid_calls += Number(data.valid_calls || data.valid_calls_for_media || data.analyzed_calls || 0);
      sum_notes += Number(data.sum_notes || 0);

      // 🚩 ALTERAÇÃO CRÍTICA: Lógica para reconstruir sdr_ranking de campos planos
      for (const key in data) {
        if (key.startsWith('sdr_ranking.')) {
          const parts = key.split('.'); // Ex: ['sdr_ranking', 'Abner Christófori', 'sum_notes']
          if (parts.length === 3) {
            const sdrName = parts[1];
            const statType = parts[2]; // Ex: 'sum_notes', 'total', 'valid_count'

            // Inicializa o objeto do SDR se ainda não existir no nosso sdr_ranking agregado
            if (!sdr_ranking[sdrName]) {
              sdr_ranking[sdrName] = { calls: 0, sum_notes: 0, valid_calls: 0, nota_media: 0 };
            }

            // Adiciona o valor ao campo correto
            const value = Number(data[key] || 0);
            if (statType === 'total') {
              sdr_ranking[sdrName].calls += value;
            } else if (statType === 'sum_notes') {
              sdr_ranking[sdrName].sum_notes += value;
            } else if (statType === 'valid_count') {
              sdr_ranking[sdrName].valid_calls += value;
            }
          }
        }
      }
    }); // Fim do snapshot.forEach

    // 🚩 CALCULAR nota_media PARA CADA SDR DEPOIS QUE TODAS AS AGREGACÕES ESTÃO FEITAS
    for (const sdrName in sdr_ranking) {
        const sdr = sdr_ranking[sdrName];
        if (sdr.valid_calls > 0) {
            sdr.nota_media = Number((sdr.sum_notes / sdr.valid_calls).toFixed(2));
        } else {
            sdr.nota_media = 0; // Garante 0 se não houver chamadas válidas para evitar NaN
        }
    }
    
    const mediaGeral = valid_calls > 0 ? (sum_notes / valid_calls) : 0;
    
    console.log(`📊 [STATS] Resumo - Total: ${total_calls}, Válidas: ${valid_calls}, Média Geral: ${mediaGeral.toFixed(2)}`);
    // 🚩 ADICIONE UM LOG TEMPORÁRIO AQUI TAMBÉM para ver o sdr_ranking final antes de enviar
    console.log(`📊 [STATS] Ranking Final:`, JSON.stringify(sdr_ranking, null, 2));

    return res.json({ 
      total_calls, 
      valid_calls, 
      sum_notes, 
      media_geral: Number(mediaGeral.toFixed(2)), 
      sdr_ranking,
      _debug_version: "FINAL_V2_SDR_RANKING_FLAT_FIX_04042024_WITH_DATA" // 🚩 NOVA VERSÃO DO DEBUG
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