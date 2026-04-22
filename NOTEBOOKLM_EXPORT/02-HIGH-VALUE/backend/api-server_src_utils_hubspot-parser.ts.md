# hubspot-parser.ts

## Visão geral
- Caminho original: `api-server/src/utils/hubspot-parser.ts`
- Domínio: **backend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **utility**
- Criticidade: **important**
- Score de importância: **88**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **105**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **9**

## Resumo factual
Este arquivo foi classificado como utility no domínio backend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: extractCallId. Funções/classes detectadas: extractCallId, extractEngagementPath, extractFromRoute, extractFromUrl, extractFromUrlParts, extractLegacyCallPath, extractNumericParam, extractReviewPath, isNumericValue. Temas relevantes detectados: calls, hubspot.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `extractCallId`

## Funções e classes detectadas
- `extractCallId`
- `extractEngagementPath`
- `extractFromRoute`
- `extractFromUrl`
- `extractFromUrlParts`
- `extractLegacyCallPath`
- `extractNumericParam`
- `extractReviewPath`
- `isNumericValue`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `hubspot`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
const COMPATIBILITY_ID_PARAM_KEYS = ['interactionId', 'engagementId'] as const;

function isNumericValue(value: string | null): value is string {
  return Boolean(value && /^\d+$/.test(value));
}

function extractNumericParam(
  params: URLSearchParams,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = params.get(key);
    if (isNumericValue(value)) {
      return value;
    }
  }

  return null;
}

function extractReviewPath(value: string): string | null {
  return value.match(/\/calls\/[^/]+\/review\/(\d+)/)?.[1] ?? null;
}

function extractEngagementPath(value: string): string | null {
  return value.match(/\/engagement\/(\d+)/)?.[1] ?? null;
}

function extractLegacyCallPath(value: string): string | null {
  return value.match(/\/call\/(\d+)/)?.[1] ?? null;
}

function extractFromRoute(value: string): string | null {
  return (
    extractReviewPath(value) ??
    extractEngagementPath(value) ??
    extractLegacyCallPath(value)
  );
}

function extractFromUrlParts(url: URL): string | null {
  const reviewPathMatch = extractReviewPath(url.pathname);
  if (reviewPathMatch) {
    return reviewPathMatch;
  }

  const callSidebarOpenMatch = extractNumericParam(url.searchParams, ['callSidebarOpen']);
  if (callSidebarOpenMatch) {
    return callSidebarOpenMatch;
  }

  const engagementParamMatch = extractNumericParam(url.searchParams, ['engagement']);
  if (engagementParamMatch) {
    return engagementParamMatch;
  }

  const engagementPathMatch = extractEngagementPath(url.pathname);
  if (engagementPathMatch) {
    return engagementPathMatch;
  }

  const compatibilityParamMatch = extractNumericParam(
    url.searchParams,
    COMPATIBILITY_ID_PARAM_KEYS
  );
  if (compatibilityParamMatch) {
    return compatibilityParamMatch;
  }

  return extractLegacyCallPath(url.pathname);
}

function extractFromUrl(url: URL): string | null {
  const directMatch = extractFromUrlParts(url);
  if (directMatch) {
    return directMatch;
  }

  if (!url.hash) {
    return null;
  }

  const normalizedHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashUrl = new URL(
    normalizedHash.startsWith('/')
      ? `https://hubspot.local${normalizedHash}`
      : `https://hubspot.local/${normalizedHash}`
  );

  return extractFromUrlParts(hashUrl);
}

export function extractCallId(input: string): string | null {
  if (!input) return null;

  const cleanInput = input.trim();

  try {
    const urlObj = new URL(cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`);
    return extractFromUrl(urlObj) ?? extractFromRoute(cleanInput) ?? (isNumericValue(cleanInput) ? cleanInput : null);
  } catch {
    return extractFromRoute(cleanInput) ?? (isNumericValue(cleanInput) ? cleanInput : null);
  }
}

```
