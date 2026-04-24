/**
 * ⚠️ DEPRECATED / LEGACY
 *
 * Este arquivo fazia parte da pipeline antiga de transcrição.
 * NÃO deve ser utilizado no fluxo atual.
 *
 * O fluxo correto agora é:
 * processCall.ts → transcribeRecordingFromHubSpot (analysis.service.ts)
 *
 * Mantido apenas para compatibilidade temporária.
 */

export async function transcribeCall(): Promise<void> {
  console.warn(
    '⚠️ [LEGACY] transcribeCall() foi chamado. Este método está depreciado e não deve ser usado.'
  );

  throw new Error('DEPRECATED_FUNCTION: transcribeCall não deve mais ser utilizado.');
}