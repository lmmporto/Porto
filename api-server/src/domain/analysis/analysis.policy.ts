// src/domain/analysis/analysis.policy.ts
import { type OwnerDetails, SkipReason } from './analysis.types.js';

export const ALLOWED_OWNER_IDS = [
  '81501413',
  '83701507',
  '83701512',
  '83701527',
  '87174611',
  '88958088',
];

export const ALLOWED_TEAMS = [
  'Time William',
  'Equipe Alex',
  'Time Lucas',
  'Time Amanda',
];

export const BLOCKED_KEYWORDS = [
  'CX',
  'Suporte',
  'Atendimento',
  'Customer Success',
  'Financeiro',
  'GF',
];

export const MIN_TRANSCRIPT_LENGTH = 180;
export const MIN_CALL_DURATION_MS = 30000;
export const CALL_LEASE_MINUTES = 5;

export class AnalysisPolicy {
  /**
   * 🛡️ [Gatekeeper] Valida se uma chamada deve ser processada ou ignorada.
   */
  static isCallAllowed(
    callData: { ownerId?: string | number; durationMs?: number },
    ownerDetails: OwnerDetails,
    sdrRegistry: { assignedTeam?: string; isActive?: boolean } | null
  ): { allowed: boolean; reason?: SkipReason } {
    const isElite = ALLOWED_OWNER_IDS.includes(String(callData.ownerId));

    const isTimeLucas =
      sdrRegistry?.assignedTeam === 'Time Lucas' &&
      sdrRegistry?.isActive === true;

    // 1. Trava de Elite ou Soberania do Time Lucas
    if (!isElite && !isTimeLucas) {
      return { allowed: false, reason: SkipReason.UNAUTHORIZED_TEAM_OR_OWNER };
    }

    const teamName = (ownerDetails.teamName || 'Sem equipe').trim();

    // 2. Filtro de time bloqueado
    const isBlocked = BLOCKED_KEYWORDS.some((keyword) =>
      teamName.toLowerCase().includes(keyword.toLowerCase())
    );
    if (isBlocked) {
      return { allowed: false, reason: SkipReason.TEAM_BLOCKED };
    }

    // 3. Filtro de time não monitorado
    const isAllowedTeam = ALLOWED_TEAMS.some((team) =>
      teamName.toLowerCase().includes(team.toLowerCase())
    );
    if (!isAllowedTeam) {
      return { allowed: false, reason: SkipReason.TEAM_NOT_MONITORED };
    }

    // 4. Filtro de duração mínima
    const duration = Number(callData.durationMs || 0);
    if (duration < MIN_CALL_DURATION_MS) {
      return { allowed: false, reason: SkipReason.CALL_TOO_SHORT };
    }

    // 5. Verificação de SDR ativo/registrado (se houver email)
    if (ownerDetails.ownerEmail) {
      if (!sdrRegistry || !sdrRegistry.isActive) {
        return { allowed: false, reason: SkipReason.SDR_INACTIVE_OR_UNREGISTERED };
      }
    }

    return { allowed: true };
  }
}
