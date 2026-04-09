import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// 🚩 CONFIGURAÇÕES DO RESGATE
const DIAS_PARA_VOLTAR = 2;
const MIN_DURATION_MS = 120000; // 2 minutos
const CALLS_COLLECTION = 'calls_analysis';

async function runBackfill() {
  console.log(`🚀 Iniciando Resgate de Chamadas (Últimos ${DIAS_PARA_VOLTAR} dias)...`);

  // 1. Inicializa Firebase
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  if (!serviceAccount.project_id) throw new Error("Credenciais do Firebase não encontradas!");
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HUBSPOT_TOKEN não encontrado no .env!");

  try {
    // 2. Busca todos os donos (SDRs) no HubSpot
    console.log("⏳ Baixando lista de SDRs do HubSpot...");
    const ownersRes = await axios.get('https://api.hubapi.com/crm/v3/owners', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });
    
    const ownerMap = new Map();
    ownersRes.data.results.forEach((owner: any) => {
      ownerMap.set(owner.id, {
        email: owner.email?.toLowerCase() || 'desconhecido@nibo.com.br',
        name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim()
      });
    });
    console.log(`✅ ${ownerMap.size} SDRs mapeados.`);

    // 3. Calcula a data de corte
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - DIAS_PARA_VOLTAR);
    const timestampCorte = dataCorte.getTime();

    console.log(`⏳ Buscando chamadas criadas após: ${dataCorte.toLocaleString('pt-BR')}`);

    // 4. Busca as chamadas no HubSpot com PAGINAÇÃO
    let allCalls: any[] = [];
    let after: string | null = null;
    let hasMore = true;

    console.log("⏳ Buscando todas as páginas de chamadas...");

    while (hasMore) {
      const searchBody: any = {
        filterGroups: [{
          filters: [{
            propertyName: "hs_createdate",
            operator: "GTE",
            value: timestampCorte.toString()
          }]
        }],
        properties: ["hs_call_duration", "hs_call_recording_url", "hubspot_owner_id", "hs_call_title", "hs_call_status", "hs_createdate"],
        limit: 100,
        after: after 
      };

      const callsRes = await axios.post('https://api.hubapi.com/crm/v3/objects/calls/search', searchBody, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const results = callsRes.data.results || [];
      allCalls = [...allCalls, ...results];

      if (callsRes.data.paging?.next?.after) {
        after = callsRes.data.paging.next.after;
        console.log(`📡 Buscando próxima página... (Total atual: ${allCalls.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`📊 Encontradas ${allCalls.length} chamadas no total.`);

    let adicionadas = 0;
    let ignoradasTempo = 0;
    let ignoradasDuplicadas = 0;

    // 5. Processa e salva no Firestore
    for (const hsCall of allCalls) {
      const callId = hsCall.id;
      const props = hsCall.properties;
      const durationMs = Number(props.hs_call_duration || 0);
      const hasAudio = !!props.hs_call_recording_url;

      if (durationMs < MIN_DURATION_MS || !hasAudio) {
        ignoradasTempo++;
        continue;
      }

      const docRef = db.collection(CALLS_COLLECTION).doc(String(callId));
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        ignoradasDuplicadas++;
        continue;
      }

      const ownerInfo = ownerMap.get(props.hubspot_owner_id) || { email: 'desconhecido@nibo.com.br', name: 'Desconhecido' };

      await docRef.set({
        id: String(callId),
        callId: String(callId),
        title: props.hs_call_title || 'Chamada Resgatada',
        durationMs: durationMs,
        hasAudio: hasAudio,
        recordingUrl: props.hs_call_recording_url,
        ownerId: props.hubspot_owner_id,
        ownerEmail: ownerInfo.email,
        ownerName: ownerInfo.name,
        hsCallStatus: props.hs_call_status,
        processingStatus: 'QUEUED', 
        createdAt: new Date(),
        callTimestamp: new Date(props.hs_createdate)
      });

      console.log(`➕ Enfileirada: ${callId} (${ownerInfo.name})`);
      adicionadas++;
    }

    console.log("\n=================================");
    console.log("🏁 RESUMO DO RESGATE:");
    console.log(`✅ Adicionadas à Fila (QUEUED): ${adicionadas}`);
    console.log(`⏭️ Ignoradas (< 2min ou sem áudio): ${ignoradasTempo}`);
    console.log(`⏭️ Ignoradas (Já existiam no banco): ${ignoradasDuplicadas}`);
    console.log("=================================\n");

    process.exit(0);

  } catch (error: any) {
    console.error("❌ ERRO NO RESGATE:", error?.response?.data || error.message);
    process.exit(1);
  }
}

runBackfill();