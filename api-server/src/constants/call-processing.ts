/**
 * @deprecated
 * Re-exporta de `domain/analysis/analysis.types.ts`.
 * Importe diretamente do domínio em código novo.
 */
export {
  CallStatus,
  SkipReason,
  FailureReason,
} from '../domain/analysis/analysis.types.js';

export const MAX_AUDIO_RETRIES = 10;
export const RETRY_INTERVAL_MINUTES = 10;
export const MIN_CALL_DURATION_MS = 30000;