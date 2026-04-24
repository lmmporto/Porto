// api-server/src/services/calls/pending-audio-refresh.orchestrator.ts
import { refreshPendingAudioCall } from '../refreshPendingAudioCall.js';

export class PendingAudioRefreshOrchestrator {
  /**
   * Delega para a implementação existente de refreshPendingAudioCall.
   * A lógica interna não é movida — apenas encapsulada.
   */
  static async refresh(callId: string): Promise<void> {
    await refreshPendingAudioCall(callId);
  }
}
