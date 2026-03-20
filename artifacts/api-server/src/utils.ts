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
