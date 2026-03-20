import { hubspot } from "../clients.js";
import { CONFIG } from "../config.js";
import { firstFilled } from "../utils.js";

export interface OwnerDetails {
  ownerId: string | null;
  ownerName: string;
  teamId: string | null;
  teamName: string;
  userId: string | null;
}

export interface CallData {
  id: string;
  title: string;
  ownerId: string;
  durationMs: number;
  status: string;
  timestamp: string;
  recordingUrl: string;
  transcript: string;
  transcriptSourceType: string;
  transcriptLength: number;
}

export async function fetchOwnerDetails(
  ownerId: string | null,
): Promise<OwnerDetails> {
  try {
    if (!ownerId) {
      return {
        ownerId: null,
        ownerName: "Sem owner",
        teamId: null,
        teamName: "Sem equipe",
        userId: null,
      };
    }
    const { data } = await hubspot.get(`/crm/v3/owners/${ownerId}`);
    return {
      ownerId: String(ownerId),
      ownerName:
        data?.firstName || data?.lastName
          ? `${data?.firstName || ""} ${data?.lastName || ""}`.trim()
          : `Owner ${ownerId}`,
      teamId: data?.teams?.[0]?.id || null,
      teamName: data?.teams?.[0]?.name || "Sem equipe",
      userId: data?.userId || data?.userIdIncludingInactive || null,
    };
  } catch {
    return {
      ownerId: String(ownerId),
      ownerName: `Owner ${ownerId}`,
      teamId: null,
      teamName: "Sem equipe",
      userId: null,
    };
  }
}

export async function fetchCall(callId: string): Promise<CallData> {
  const properties = [...new Set([...Object.values(CONFIG.PROPS).flat()])];
  const { data } = await hubspot.get(`/crm/v3/objects/calls/${callId}`, {
    params: { properties: properties.join(","), archived: false },
  });

  const props: Record<string, unknown> = data?.properties || {};
  const ownerId = firstFilled(props, CONFIG.PROPS.OWNER);

  return {
    id: data.id,
    title: firstFilled(props, CONFIG.PROPS.TITLE) || `Call ${callId}`,
    ownerId: ownerId ? String(ownerId) : "",
    durationMs: Number(firstFilled(props, CONFIG.PROPS.DURATION) || 0),
    status: firstFilled(props, CONFIG.PROPS.STATUS) || "",
    timestamp:
      firstFilled(props, CONFIG.PROPS.TIMESTAMP) || new Date().toISOString(),
    recordingUrl: firstFilled(props, CONFIG.PROPS.RECORDING) || "",
    transcript: "",
    transcriptSourceType: "NONE",
    transcriptLength: 0,
  };
}

export async function searchCallsInHubSpot({
  limit = 100,
}: {
  limit?: number;
}) {
  const properties = [...new Set([...Object.values(CONFIG.PROPS).flat()])];
  const filters = [
    {
      propertyName: "hs_call_duration",
      operator: "GTE",
      value: String(CONFIG.MIN_DURATION_MS),
    },
  ];

  const body = {
    limit: Math.min(
      Number(limit) || CONFIG.TEST_CALLS_DEFAULT_LIMIT,
      CONFIG.TEST_CALLS_MAX_LIMIT,
    ),
    sorts: [{ propertyName: "hs_timestamp", direction: "DESCENDING" }],
    properties,
    filterGroups: [{ filters }],
  };

  const { data } = await hubspot.post("/crm/v3/objects/calls/search", body);
  return (data?.results || []) as Array<{ id: string }>;
}
