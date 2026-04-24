import { hubspot } from "../clients.js";
import { CONFIG } from "../config.js";
import { firstFilled } from "../utils.js";
import {
  type AnalysisResult,
  type OwnerDetails,
} from "../domain/analysis/analysis.types.js";

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
  lastAnalysisVersion?: string;
  lastTranscriptHash?: string;
  analysisResult?: AnalysisResult; // 🚩 AGORA RECONHECIDO CORRETAMENTE

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
        ownerEmail: null,
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
      ownerEmail: data?.email || null,
      teamId: data?.teams?.[0]?.id || null,
      teamName: data?.teams?.[0]?.name || 'Sem Equipe',
      userId: data?.userId || data?.userIdIncludingInactive || null,
    };

  } catch (error) {
    return {
      ownerId: String(ownerId),
      ownerName: `Owner ${ownerId}`,
      ownerEmail: null,
      teamId: null,
      teamName: "Sem equipe",
      userId: null
    };
  }
}

export async function fetchCall(callId: string): Promise<CallData> {
  // 🚩 LISTA EXPANDIDA: Cobrindo todas as variações de nomes de campos do HubSpot
  const propertiesToFetch = [
    'hs_call_title', 'hs_call_duration', 'hs_call_recording_url',
    'hs_call_status', 'hs_call_body', 'hs_call_transcript',
    'hs_analytics_transcript_id', 'hubspot_owner_id', 'hs_portal_id',
    'url_gravacao_chamada', 'recording_url', 'hs_call_disposition', 'hs_createdate'
  ];

  const { data } = await hubspot.get(`/crm/v3/objects/calls/${callId}`, {
    params: { properties: propertiesToFetch.join(","), archived: false },
  });

  const props: Record<string, any> = data?.properties || {};

  // 🚩 LÓGICA DE FALLBACK (O "OU" LÓGICO):
  const recording = props.hs_call_recording_url || props.url_gravacao_chamada || props.recording_url || "";
  const transcript = props.hs_call_transcript || "";
  const transcriptId = props.hs_analytics_transcript_id;
  const dispId = String(props.hs_call_disposition || "");

  // Se houver transcriptId mas não houver transcript no body, tenta buscar via API de extensões
  let finalTranscript = transcript;
  if (!finalTranscript && transcriptId) {
    finalTranscript = await fetchTranscriptFromHubSpot(transcriptId);
  }

  return {
    id: data.id,
    hubspotCallId: data.id,
    callId: data.id,
    portalId: String(props.hs_portal_id || ""),
    title: props.hs_call_title || "Chamada sem título",
    ownerId: props.hubspot_owner_id ? String(props.hubspot_owner_id) : "",
    durationMs: Number(props.hs_call_duration || 0),
    status: props.hs_call_status || "",
    disposition: DISPOSITION_MAP[dispId] || "Attempt",
    wasConnected: Number(props.hs_call_duration || 0) > 20000,
    timestamp: props.hs_createdate || new Date().toISOString(),
    recordingUrl: recording,
    transcript: finalTranscript,
    transcriptSourceType: finalTranscript ? "HUBSPOT" : "NONE",
    transcriptLength: finalTranscript.length,
    hasAudio: !!recording,
    hasTranscript: !!finalTranscript
  };
}

export async function searchCallsInHubSpot({ limit = 100 }: { limit?: number }) {
  const properties = [
    'hs_call_title', 'hs_call_duration', 'hs_call_recording_url',
    'hs_call_status', 'hs_analytics_transcript_id', 'hubspot_owner_id', 'hs_portal_id'
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

export async function getOwnerIdByEmail(email: string): Promise<string | null> {
  try {
    const response = await hubspot.get('/crm/v3/owners/', {
      params: { limit: 100, archived: false }
    });
    
    const owners = response.data.results;
    const owner = owners.find((o: any) => o.email.toLowerCase() === email.toLowerCase());
    
    return owner ? owner.id : null;
  } catch (error) {
    console.error(`[HUBSPOT] Erro ao buscar owner para ${email}:`, error);
    return null;
  }
}