// src/utils/hubspot-parser.ts

/**
 * 🏛️ ARQUITETO: Extrator Universal de IDs HubSpot
 * Suporta links de chamadas, links de contatos (interactionId) e IDs puros.
 */
export function extractCallId(input: string): string | null {
  if (!input) return null;

  const cleanInput = input.trim();

  try {
    // 1. Tenta tratar como URL e buscar o parâmetro 'interactionId'
    if (cleanInput.includes('interactionId=')) {
      const urlObj = new URL(cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`);
      const interactionId = urlObj.searchParams.get('interactionId');
      if (interactionId && /^\d+$/.test(interactionId)) return interactionId;
    }
  } catch (e) {
    // Erro no parse da URL, segue para o Regex
  }

  // 2. Tenta extrair do padrão de rota /call/ID
  const callRouteMatch = cleanInput.match(/\/call\/(\d+)/);
  if (callRouteMatch && callRouteMatch[1]) return callRouteMatch[1];

  // 3. Tenta extrair se for apenas uma sequência de números (ID puro)
  const numericMatch = cleanInput.match(/^\d+$/);
  if (numericMatch) return cleanInput;

  return null;
}