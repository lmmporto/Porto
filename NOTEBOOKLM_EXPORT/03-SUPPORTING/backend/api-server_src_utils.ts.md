# utils.ts

## Visão geral
- Caminho original: `api-server/src/utils.ts`
- Domínio: **backend**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **50**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **47**
- Imports detectados: **0**
- Exports detectados: **5**
- Funções/classes detectadas: **5**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 03-SUPPORTING. Exports detectados: detectAudioExtension, firstFilled, safeJsonParse, sanitizeText, sleep. Funções/classes detectadas: detectAudioExtension, firstFilled, safeJsonParse, sanitizeText, sleep.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `detectAudioExtension`
- `firstFilled`
- `safeJsonParse`
- `sanitizeText`
- `sleep`

## Funções e classes detectadas
- `detectAudioExtension`
- `firstFilled`
- `safeJsonParse`
- `sanitizeText`
- `sleep`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function sanitizeText(value: unknown): string {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n[ ]+/g, '\n')
    .trim();
}

export function safeJsonParse(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    const text = String(value)
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function firstFilled(obj: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  return (
    keys
      .map((k) => obj?.[k])
      .find((v) => v !== undefined && v !== null && String(v).trim() !== '') as string | null
  ) ?? null;
}

export function detectAudioExtension(contentType = ''): string {
  const type = String(contentType).toLowerCase();
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  if (type.includes('mp4') || type.includes('m4a')) return 'm4a';
  if (type.includes('wav')) return 'wav';
  if (type.includes('ogg')) return 'ogg';
  return 'wav';
}

```
