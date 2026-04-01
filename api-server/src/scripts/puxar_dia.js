import 'dotenv/config';
import { searchCallsInHubSpot } from '../services/hubspot.js'; // Verifique se o caminho está correto
import { handleIncomingCall } from '../services/webhook.service.js';
async function puxarLigacoesDoDia() {
  console.log('🔍 [BACKFILL] Buscando ligações no HubSpot...');
  
  try {
    // Busca as últimas 50 ligações
    const calls = await searchCallsInHubSpot({ limit: 50 });
    
    if (calls.length === 0) {
      console.log('✅ [BACKFILL] Nenhuma ligação encontrada.');
      return;
    }

    console.log(`📥 [BACKFILL] Encontradas ${calls.length} ligações. Enfileirando...`);
    
    for (const call of calls) {
      // O handleIncomingCall já faz a triagem (tempo, áudio, etc)
      // Passamos o callId para ele.
      await handleIncomingCall({ 
        callId: call.id, 
        durationMs: 60000, // Forçamos um valor para passar na triagem inicial
        hasAudio: true 
      });
      console.log(`✅ [BACKFILL] Enfileirado: ${call.id}`);
    }
    
    console.log('✨ [BACKFILL] Todas as chamadas foram enviadas para a fila!');
  } catch (error) {
    console.error('❌ [BACKFILL ERROR]:', error);
  }
}

puxarLigacoesDoDia().catch(console.error);