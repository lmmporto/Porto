import 'dotenv/config';
import { searchCallsInHubSpot } from '../services/hubspot.js'; 
import { handleIncomingCall } from '../services/webhook.service.js';

async function backfillChamadasLongas() {
  // 1. Calcular o timestamp de 5 dias atrás
  const cincoDiasAtras = new Date();
  cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);
  const timestampLimite = cincoDiasAtras.getTime();

  console.log(`🔍 [BACKFILL] Buscando chamadas desde: ${cincoDiasAtras.toLocaleString()}`);
  console.log(`⏳ [FILTRO] Duração mínima: 2 minutos (120000ms)`);

  try {
    /**
     * IMPORTANTE: A função searchCallsInHubSpot precisa estar preparada para 
     * receber esses filtros e repassá-los para a API de Search do HubSpot.
     */
    const calls = await searchCallsInHubSpot({
      filters: [
        { propertyName: 'hs_createdate', operator: 'GTE', value: timestampLimite },
        { propertyName: 'hs_call_duration', operator: 'GTE', value: '119000' }
      ],
      limit: 100 
    });

    if (!calls || calls.length === 0) {
      console.log('✅ [BACKFILL] Nenhuma ligação encontrada com esses critérios.');
      return;
    }

    console.log(`📥 [BACKFILL] Encontradas ${calls.length} ligações. Iniciando processamento...`);

    for (const call of calls) {
      // Pegamos a duração real vinda do HubSpot para o log e processamento
      const duracaoReal = call.properties.hs_call_duration || 120000;
      
      console.log(`⚙️ [PROCESSANDO] ID: ${call.id} | Duração: ${Math.round(duracaoReal / 60000)} min`);

      /**
       * O handleIncomingCall agora recebe os dados REAIS.
       * Isso disparará o seu fluxo de transcrição e avaliação por IA.
       */
      await handleIncomingCall({ 
        callId: call.id, 
        durationMs: parseInt(duracaoReal), 
        hasAudio: true 
      });

      console.log(`✅ [SUCESSO] ID: ${call.id} enviado para o fluxo.`);
    }

    console.log('✨ [BACKFILL] Sincronização e avaliação concluídas!');
  } catch (error) {
    console.error('❌ [BACKFILL ERROR]:', error);
  }
}

backfillChamadasLongas().catch(console.error);