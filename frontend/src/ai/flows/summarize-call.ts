/**
 * ⚠️ DEPRECATED / LEGACY
 *
 * Este arquivo fazia parte da pipeline antiga de sumarização.
 * NÃO deve ser utilizado no fluxo atual.
 *
 * O fluxo correto agora é:
 * processCall.ts → analyzeCallWithGemini (analysis.service.ts)
 *
 * Mantido apenas para compatibilidade temporária.
 */

export async function summarizeCall(): Promise<void> {
  console.warn(
    '⚠️ [LEGACY] summarizeCall() foi chamado. Este método está depreciado e não deve ser usado.'
  );

  throw new Error('DEPRECATED_FUNCTION: summarizeCall não deve mais ser utilizado.');
}