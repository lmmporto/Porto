import admin from 'firebase-admin'; // 🚩 ADICIONE ESTA LINHA
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// 🚩 CONFIGURAÇÕES DO RESGATE RECALIBRADAS
const DIAS_PARA_VOLTAR = 3; // Aumentamos para 3 dias para garantir cobertura total
const MIN_DURATION_MS = 110000; // 🚩 1 minuto e 50 segundos
const CALLS_COLLECTION = 'calls_analysis';

async function runBackfill() {
  console.log(`🚀 Iniciando Resgate de Chamadas (Mínimo: 1:50s | Últimos ${DIAS_PARA_VOLTAR} dias)...`);

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  if (!serviceAccount.project_id) throw new Error("Credenciais do Firebase não encontradas!");
  
  // Inicializa apenas se não houver apps inicializados
  if (admin.apps.length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore();
  const token = process.env.HUBSPOT_TOKEN;

  try {
    // 1. Busca todos os donos (SDRs) no HubSpot
    console.log("⏳ Mapeando SDRs do HubSpot...");
    const ownersRes = await axios.get('https://api.hubapi.com/crm/v3/owners', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });
    
    const ownerMap = new Map();
    ownersRes.data.results.forEach((owner: any) => {
      ownerMap.set(owner.id, {
        email: (owner.email || '').toLowerCase().trim(),
        name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim()
      });
    });

    // 2. Calcula a data de corte
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - DIAS_PARA_VOLTAR);
    const timestampCorte = dataCorte.getTime();

    // 3. Busca as chamadas com PAGINAÇÃO
    let allCalls: any[] = [];
    let after: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const searchBody: any = {
        filterGroups: [{
          filters: [{ propertyName: "hs_createdate", operator: "GTE", value: timestampCorte.toString() }]
        }],
        properties: ["hs_call_duration", "hs_call_recording_url", "hubspot_owner_id", "hs_call_title", "hs_call_status", "hs_createdate"],
        limit: 100,
        after: after 
      };

      const callsRes = await axios.post('https://api.hubapi.com/crm/v3/objects/calls/search', searchBody, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      allCalls = [...allCalls, ...(callsRes.data.results || [])];
      after = callsRes.data.paging?.next?.after;
      hasMore = !!after;
      if (hasMore) console.log(`📡 Coletando... (${allCalls.length} chamadas encontradas)`);
    }

    let adicionadas = 0;
    let ignoradas = 0;

    // 4. Processa e salva no Firestore
    for (const hsCall of allCalls) {
      const props = hsCall.properties;
      const durationMs = Number(props.hs_call_duration || 0);
      const hasAudio = !!props.hs_call_recording_url;

      // Filtro de Qualidade
      if (durationMs < MIN_DURATION_MS || !hasAudio) {
        ignoradas++;
        continue;
      }

      const docRef = db.collection(CALLS_COLLECTION).doc(String(hsCall.id));
      const docSnap = await docRef.get();
      
      // Evita re-processar o que já está DONE ou QUEUED
      if (docSnap.exists && docSnap.data()?.processingStatus !== 'ERROR') {
        continue;
      }

      const ownerInfo = ownerMap.get(props.hubspot_owner_id) || { email: 'desconhecido@nibo.com.br', name: 'Desconhecido' };

      await docRef.set({
        id: String(hsCall.id),
        callId: String(hsCall.id),
        title: props.hs_call_title || 'Chamada Resgatada',
        durationMs: durationMs,
        hasAudio: hasAudio,
        recordingUrl: props.hs_call_recording_url,
        ownerId: props.hubspot_owner_id,
        ownerEmail: ownerInfo.email, // 🚩 Já vem normalizado do ownerMap
        ownerName: ownerInfo.name,
        hsCallStatus: props.hs_call_status,
        processingStatus: 'QUEUED', 
        createdAt: FieldValue.serverTimestamp(),
        callTimestamp: new Date(props.hs_createdate), // 🚩 Data real da ligação
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`✅ Enfileirada: ${hsCall.id} | ${ownerInfo.name} | ${(durationMs/60000).toFixed(1)} min`);
      adicionadas++;
    }

    console.log("\n=================================");
    console.log(`🏁 RESUMO: ${adicionadas} novas chamadas na fila. ${ignoradas} descartadas.`);
    console.log("=================================\n");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ ERRO:", error.message);
    process.exit(1);
  }
}

runBackfill();

// pnpm tsx --env-file=.env src/scripts/reprocess-single.ts     