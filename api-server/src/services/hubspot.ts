import { hubspot } from "../clients.js";
import { CONFIG } from "../config.js";
import { firstFilled } from "../utils.js";

// --- INTERFACES ---

export interface OwnerDetails {
  ownerId: string | null;
  ownerName: string;
  ownerEmail: string | null; // 🚩 ADICIONE ESTA LINHA AQUI
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

  // Novos campos operacionais
  transcriptSource?: string | null;
  hasAudio?: boolean;
  hasTranscript?: boolean;
  processingStatus?: 'PENDING_AUDIO' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'ERROR' | 'FAILED_NO_AUDIO';
  audioFetchAttempts?: number;
  lastAudioCheckAt?: string | Date;
  updatedAt?: string | Date;
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
 * Busca o texto usando o ID específico da transcrição nativa do HubSpot
 */
async function fetchTranscriptFromHubSpot(transcriptId: string): Promise<string> {
  try {
    console.log(`✅ [DEBUG-TRANSCRIPT] Baixando texto do ID: ${transcriptId}`);
    const transRes = await hubspot.get(`/crm/v3/extensions/calling/transcripts/${transcriptId}`);
    const utterances = transRes.data.transcriptUtterances || [];

    return utterances
      .map((u: any) => `${u.speaker?.name || 'Interlocutor'}: ${u.text}`)
      .join('\n');
  } catch (e: any) {
    console.error(`❌ [DEBUG-TRANSCRIPT] Erro ao baixar texto:`, e.message);
    return "";
  }
}

// --- FUNÇÕES PRINCIPAIS ---

export async function fetchOwnerDetails(ownerId: string | null): Promise<OwnerDetails> {
  try {
    if (!ownerId) {
      return { 
        ownerId: null, 
        ownerName: "Sem owner", 
        ownerEmail: null, // 🚩 Adicionado para cumprir o contrato
        teamId: null, 
        teamName: "Sem equipe", 
        userId: null 
      };
    }

    const { data } = await hubspot.get(`/crm/v3/owners/${ownerId}`);

    return {
      ownerId: String(ownerId),
      ownerName: data?.firstName || data?.lastName 
        ? `${data?.firstName || ""} ${data?.lastName || ""}`.trim() 
        : `Owner ${ownerId}`,
      ownerEmail: data?.email || null, // 🚩 Aqui buscamos o email real do HubSpot!
      teamId: data?.teams?.[0]?.id || null,
      teamName: data?.teams?.[0]?.name || "Sem equipe",
      userId: data?.userId || data?.userIdIncludingInactive || null,
    };
  } catch (error) {
    return { 
      ownerId: String(ownerId), 
      ownerName: `Owner ${ownerId}`, 
      ownerEmail: null, // 🚩 Adicionado para evitar erro no catch
      teamId: null, 
      teamName: "Sem equipe", 
      userId: null 
    };
  }
}


export async function fetchCall(callId: string): Promise<CallData> {
  // 🚩 Adicionamos 'hs_analytics_transcript_id' na lista de busca
  const propertiesToFetch = [
    ...new Set([...Object.values(CONFIG.PROPS).flat(), 'hs_call_disposition', 'hs_portal_id', 'hs_analytics_transcript_id'])
  ];

  const { data } = await hubspot.get(`/crm/v3/objects/calls/${callId}`, {
    params: { properties: propertiesToFetch.join(","), archived: false },
  });

  const props: Record<string, any> = data?.properties || {};
  const ownerId = firstFilled(props, CONFIG.PROPS.OWNER);
  const duration = Number(firstFilled(props, CONFIG.PROPS.DURATION) || 0);
  const dispId = String(props.hs_call_disposition || "");
  const recording = firstFilled(props, CONFIG.PROPS.RECORDING) || "";

  // 🚩 PEGA O ID DO TEXTO DIRETO DA PROPRIEDADE
  const transcriptId = props.hs_analytics_transcript_id;

  const wasConnected = duration > 20000 && recording !== "";

  // Se achou o ID, tenta baixar o texto. Se não, fica vazio.
  const transcript = transcriptId ? await fetchTranscriptFromHubSpot(transcriptId) : "";

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
  const properties = [
    ...new Set([...Object.values(CONFIG.PROPS).flat(), 'hs_call_disposition', 'hs_portal_id', 'hs_analytics_transcript_id'])
  ];
  
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