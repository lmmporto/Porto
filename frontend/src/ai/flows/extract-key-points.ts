/**
 * ⚠️ DEPRECATED / LEGACY
 *
 * Este arquivo fazia parte da pipeline antiga de extração de insights.
 * NÃO deve ser utilizado no fluxo atual.
 *
 * O fluxo correto agora é:
 * processCall.ts → analyzeCallWithGemini (analysis.service.ts)
 *
 * Mantido apenas para compatibilidade temporária.
 */

export async function extractKeyPoints(): Promise<void> {
  console.warn(
    '⚠️ [LEGACY] extractKeyPoints() foi chamado. Este método está depreciado e não deve ser usado.'
  );

  throw new Error('DEPRECATED_FUNCTION: extractKeyPoints não deve mais ser utilizado.');
}