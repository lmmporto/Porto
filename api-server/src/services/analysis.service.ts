/**
 * @module analysis.service.ts
 * @description Proxy de Compatibilidade — Sem lógica interna.
 *
 * Todas as funções aqui exportadas delegam ao AnalysisOrchestrator ou ao
 * AnalysisRepository. Este arquivo existe exclusivamente para não quebrar
 * importações existentes em rotas e scripts legados.
 *
 * ⚠️ Código novo deve importar diretamente de:
 *   - `./analysis.orchestrator.js`
 *   - `../infrastructure/database/analysis.repository.js`
 */


import { AnalysisRepository } from '../infrastructure/database/analysis.repository.js';
import { AnalysisOrchestrator } from './analysis.orchestrator.js';

import type { CallData } from './hubspot.js';
import type {
  AnalysisResult,
  AnalysisWithDebug,
  DailyStatsCallData,
  UpdateDailyStatsOptions,
  OwnerDetails,
  DbTransaction,
} from '../domain/analysis/analysis.types.js';

// -----------------------------------------------------------------------------
// Delegados — mantidos para compatibilidade retroativa
// -----------------------------------------------------------------------------

export async function transcribeRecordingFromHubSpot(
  call: CallData,
): Promise<string> {
  return AnalysisOrchestrator.transcribeRecording(call);
}

export async function analyzeCallWithGemini(
  call: CallData,
  ownerDetails: OwnerDetails,
): Promise<AnalysisWithDebug & { transcriptHash: string }> {
  return AnalysisOrchestrator.analyzeCall(call, ownerDetails);
}

export async function updateDailyStats(
  callData: DailyStatsCallData,
  analysis: Pick<AnalysisResult, 'status_final' | 'nota_spin' | 'rota'>,
  options: UpdateDailyStatsOptions = {},
): Promise<void> {
  await AnalysisRepository.updateDailyStats(callData, analysis, options);
}

export async function updateSdrGlobalStats(
  email: string,
  name: string,
  nota: number,
  transaction?: DbTransaction,
): Promise<void> {
  await AnalysisRepository.updateSdrGlobalStats(email, name, nota, transaction);
}

export async function listAnalyses(
  filters: { ownerEmail?: string },
  limitCount = 10,
): Promise<{
  calls: Array<Record<string, unknown>>;
  lastVisible?: string;
}> {
  return AnalysisRepository.listAnalyses(filters, limitCount);
}

export async function updateTeamStrategy(): Promise<void> {
  return AnalysisOrchestrator.generateTeamStrategy();
}