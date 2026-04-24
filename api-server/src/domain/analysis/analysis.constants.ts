// src/domain/analysis/analysis.constants.ts
import { CONFIG } from '../../config.js';

/**
 * 🏛️ Coleções do Firestore
 */
export const CALLS_COLLECTION = CONFIG.CALLS_COLLECTION || 'calls_analysis';
export const SDR_REGISTRY_COLLECTION = 'sdr_registry';
export const SYSTEM_COLLECTION = 'system';
export const DASHBOARD_STATS_COLLECTION = 'dashboard_stats';
export const SDR_STATS_COLLECTION = 'sdrs';
export const SDR_MONTHLY_STATS_COLLECTION = 'sdr_stats';

/**
 * 🛠️ Configurações de Retry e Thresholds
 */
export const MAX_AUDIO_RETRIES = 10;
export const RETRY_INTERVAL_MINUTES = 10;
