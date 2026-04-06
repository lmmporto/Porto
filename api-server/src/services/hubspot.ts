import { hubspot } from "../clients.js";
import { CONFIG } from "../config.js";
import { firstFilled } from "../utils.js";

// --- INTERFACES ---

export interface OwnerDetails {
  ownerId: string | null;
  ownerName: string;
  teamId: string | null;
  teamName: string;
  userId: string | null;
}

export interface CallData {
  id: string;
  portalId: string;
  hubspotCallId?: string; 
  callId?: string;        
  title: string;
  ownerId: string;
  durationMs: number;
  status: string;
  disposition: string; 
  wasConnected: boolean; 
  timestamp: string;
  recordingUrl: string;
  transcript: string;
  transcriptSourceType: string;
  transcriptLength: number;
}

const DISPOSITION_MAP: Record<string, string> = {
  'f2473a22-7177-4401-b261-2745e4d063b9': 'Connected',
  '9d6f194e-9407-497d-b48c-e8369376663f': 'Busy',
  '17b43444-9a54-4b4f-8683-936a57ae2305': 'No Answer',
  'a4c4c379-d06d-4910-bc02-7c320e21f822': 'Left Voicemail',
  '73a0d17f-1163-4515-bc05-161f9da8d211': 'Wrong Number',
};

// --- FUNÇÕES AUXILIARES ---

/**
 * Tenta buscar a transcrição nativa do HubSpot para economizar tokens de IA
 */
async function fetchTranscriptFromHubSpot(callId: string): Promise<string> {
  try {
    console.log(`🔍 [DEBUG-TRANSCRIPT] Procurando texto para a Call: ${callId}`);

    // 1. Busca TODAS as associações para ver onde o texto está escondido
    const assocRes = await hubspot.get(`/crm/v3/objects/calls/${callId}/associations/transcript`);
    
    // 🚩 LOG DE AUDITORIA: Vamos ver o que o HubSpot respondeu aqui
    console.log(`📦 [DEBUG-TRANSCRIPT] Resposta do HubSpot:`, JSON.stringify(assocRes.data));

    const transcriptId = assocRes.data.results?.[0]?.id;

    if (!transcriptId) {
      console.log(`⚠️ [DEBUG-TRANSCRIPT] Nenhuma transcrição vinculada encontrada para ${callId}`);
      return "";
    }

    console.log(`✅ [DEBUG-TRANSCRIPT] ID da Transcrição encontrado: ${transcriptId}`);

    // 2. Puxa o conteúdo da transcrição encontrada
    const transRes = await hubspot.get(`/crm/v3/extensions/calling/transcripts/${transcriptId}`);
    const utterances = transRes.data.transcriptUtterances || [];

    // 3. Formata o texto (SDR: texto... Cliente: texto...)
    return utterances
      .map((u: any) => `${u.speaker?.name || 'Interlocutor'}: ${u.text}`)
      .join('\n');
  } catch (e: any) {
    // 🚩 LOG DE ERRO DETALHADO
    console.error(`❌ [DEBUG-TRANSCRIPT] Erro ao buscar no HubSpot:`, e.response?.data || e.message);
    return "";
  }
}

// --- FUNÇÕES PRINCIPAIS ---

export async function fetchOwnerDetails(ownerId: string | null): Promise<OwnerDetails> {
  try {
    if (!ownerId) {
      return { ownerId: null, ownerName: "Sem owner", teamId: null, teamName: "Sem equipe", userId: null };
    }
    const { data } = await hubspot.get(`/crm/v3/owners/${ownerId}`);
    return {
      ownerId: String(ownerId),
      ownerName: data?.firstName || data?.lastName 
        ? `${data?.firstName || ""} ${data?.lastName || ""}`.trim() 
        : `Owner ${ownerId}`,
      teamId: data?.teams?.[0]?.id || null,
      teamName: data?.teams?.[0]?.name || "Sem equipe",
      userId: data?.userId || data?.userIdIncludingInactive || null,
    };
  } catch (error) {
    return { ownerId: String(ownerId), ownerName: `Owner ${ownerId}`, teamId: null, teamName: "Sem equipe", userId: null };
  }
}

export async function fetchCall(callId: string): Promise<CallData> {
  const propertiesToFetch = [
    ...new Set([...Object.values(CONFIG.PROPS).flat(), 'hs_call_disposition', 'hs_portal_id'])
  ];

  const { data } = await hubspot.get(`/crm/v3/objects/calls/${callId}`, {
    params: { properties: propertiesToFetch.join(","), archived: false },
  });

  const props: Record<string, any> = data?.properties || {};
  const ownerId = firstFilled(props, CONFIG.PROPS.OWNER);
  const duration = Number(firstFilled(props, CONFIG.PROPS.DURATION) || 0);
  const dispId = String(props.hs_call_disposition || "");
  const recording = firstFilled(props, CONFIG.PROPS.RECORDING) || "";

  const wasConnected = duration > 20000 && recording !== "";

  // 🚩 Tenta buscar o texto de graça antes de retornar
  const transcript = await fetchTranscriptFromHubSpot(callId);

  return {
    id: data.id,
    hubspotCallId: data.id, 
    callId: data.id,        
    portalId: String(props.hs_portal_id || ""),
    title: firstFilled(props, CONFIG.PROPS.TITLE) || `Call ${callId}`,
    ownerId: ownerId ? String(ownerId) : "",
    durationMs: duration,
    status: firstFilled(props, CONFIG.PROPS.STATUS) || "",
    disposition: DISPOSITION_MAP[dispId] || "Attempt", 
    wasConnected,
    timestamp: firstFilled(props, CONFIG.PROPS.TIMESTAMP) || new Date().toISOString(),
    recordingUrl: recording,
    transcript: transcript,
    transcriptSourceType: transcript ? "HUBSPOT" : "NONE",
    transcriptLength: transcript.length,
  };
}

export async function searchCallsInHubSpot({ limit = 100 }: { limit?: number }) {
  const properties = [...new Set([...Object.values(CONFIG.PROPS).flat(), 'hs_call_disposition', 'hs_portal_id'])];
  
  const body = {
    limit: Number(limit) || 100, 
    sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
    properties,
    filterGroups: [
      {
        filters: [
          { propertyName: "hs_call_duration", operator: "GT", value: "119000" }
        ]
      }
    ],
  };

  const { data } = await hubspot.post("/crm/v3/objects/calls/search", body);
  return (data?.results || []) as Array<{ id: string }>;
}