// api-server/src/infrastructure/crm/hubspot-call.service.ts
import { fetchCall, fetchOwnerDetails } from '../../services/hubspot.js';
import { withTimeout } from '../../utils/timeout.js';
import type { OwnerDetails } from '../../domain/analysis/analysis.types.js';
import type { CallData } from '../../services/hubspot.js';

export class HubspotCallService {
  /**
   * Busca dados da call e do owner com timeouts já aplicados.
   * Os valores de timeout (15s e 10s) são copiados EXATAMENTE do processCall.ts.
   */
  static async fetchCallWithOwner(callId: string): Promise<{
    call: CallData;
    owner: OwnerDetails;
    teamName: string;
  }> {
    const call = await withTimeout(fetchCall(callId), 15_000, 'fetchCall');

    const owner: OwnerDetails = await withTimeout(
      fetchOwnerDetails(call.ownerId || null),
      10_000,
      'fetchOwnerDetails'
    );

    const teamName = (owner.teamName || 'Sem equipe').trim();

    return { call, owner, teamName };
  }
}
