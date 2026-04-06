import 'dotenv/config';
import { searchCallsInHubSpot } from '../services/hubspot.js'; 
import { handleIncomingCall } from '../services/webhook.service.js';

async function backfillChamadasDeHoje() {
  // 1. Calcular o timestamp do início do dia atual (00:00:00)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); 
  const timestampLimite = hoje.getTime();

  console.log(`🔍 [BACKFILL] Buscando chamadas desde: ${hoje.toLocaleString()}`);
  console.log(`⏳ [FILTRO] Duração mínima: 2 minutos (120000ms)`);

  try {
    const calls = await searchCallsInHubSpot({
      filters: [
        { propertyName: 'hs_createdate', operator: 'GTE', value: timestampLimite },
        { propertyName: 'hs_call_duration', operator: 'GTE', value: '119000' }
      ],
      limit: 100 
    });

    if (!calls || calls.length === 0) {
      console.log('✅ [BACKFILL] Nenhuma ligação encontrada hoje até o momento.');
      return;
    }

    console.log(`📥 [BACKFILL] Encontradas ${calls.length} ligações hoje. Iniciando processamento...`);

    for (const call of calls) {
      const duracaoReal = call.properties.hs_call_duration || 119000;
      
      console.log(`⚙️ [PROCESSANDO] ID: ${call.id} | Duração: ${Math.round(duracaoReal / 60000)} min`);

      await handleIncomingCall({ 
        callId: call.id, 
        durationMs: parseInt(duracaoReal), 
        hasAudio: true 
      });

      console.log(`✅ [SUCESSO] ID: ${call.id} enviado para o fluxo.`);
    }

    console.log('✨ [BACKFILL] Sincronização de hoje concluída!');
  } catch (error) {
    console.error('❌ [BACKFILL ERROR]:', error);
  }
}

backfillChamadasDeHoje().catch(console.error);