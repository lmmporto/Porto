import 'dotenv/config';
import { db } from '../firebase.js';
import { fetchCall } from '../services/hubspot.js';
import admin from 'firebase-admin';

async function consertarDatas() {
  console.log('🕵️ [CONSERTO] Buscando ligações sem data original...');

  // 1. Pega todas as chamadas que NÃO têm o campo callTimestamp
  const snapshot = await db.collection('calls_analysis')
    .get();

  const docsParaConsertar = snapshot.docs.filter(doc => !doc.data().callTimestamp);

  if (docsParaConsertar.length === 0) {
    console.log('✅ [CONSERTO] Todas as ligações já estão com a data certa!');
    return;
  }

  console.log(`🛠️ [CONSERTO] Encontradas ${docsParaConsertar.length} ligações para atualizar.`);

  for (const doc of docsParaConsertar) {
    const callId = doc.id;
    try {
      console.log(`🔄 [CONSERTO] Buscando data real para Call: ${callId}...`);
      
      // 2. Vai no HubSpot buscar o dado original
      const hubspotData = await fetchCall(callId);
      
      if (hubspotData && hubspotData.timestamp) {
        const dataReal = new Date(hubspotData.timestamp);
        
        // 3. Grava a data real no Firestore
        await doc.ref.update({
          callTimestamp: admin.firestore.Timestamp.fromDate(dataReal)
        });
        
        console.log(`✅ [CONSERTO] Call ${callId} atualizada para: ${dataReal.toISOString()}`);
      }
    } catch (e) {
      console.error(`❌ [CONSERTO] Erro na Call ${callId}:`, e.message);
    }
  }

  console.log('✨ [CONSERTO] Faxina de datas finalizada!');
}

consertarDatas().catch(console.error);