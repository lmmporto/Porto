# transcribe-call.ts

## Visão geral
- Caminho original: `frontend/src/ai/flows/transcribe-call.ts`
- Domínio: **ai**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **ai-flow**
- Criticidade: **critical**
- Score de importância: **152**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **54**
- Imports detectados: **2**
- Exports detectados: **3**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como ai-flow no domínio ai. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: TranscribeCallInput, TranscribeCallOutput, transcribeCall. Funções/classes detectadas: that, transcribeCall. Dependências locais detectadas: @/ai/genkit. Dependências externas detectadas: genkit. Temas relevantes detectados: transcribe. Indícios de framework/arquitetura: server-component-or-action, ai-flow.

## Dependências locais
- `@/ai/genkit`

## Dependências externas
- `genkit`

## Todos os imports detectados
- `@/ai/genkit`
- `genkit`

## Exports detectados
- `TranscribeCallInput`
- `TranscribeCallOutput`
- `transcribeCall`

## Funções e classes detectadas
- `that`
- `transcribeCall`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `transcribe`

## Indícios de framework/arquitetura
- `server-component-or-action`
- `ai-flow`

## Código
```ts
'use server';
/**
 * @fileOverview A Genkit flow for transcribing audio call recordings into text.
 *
 * - transcribeCall - A function that handles the audio transcription process.
 * - TranscribeCallInput - The input type for the transcribeCall function.
 * - TranscribeCallOutput - The return type for the transcribeCall function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeCallInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A call recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeCallInput = z.infer<typeof TranscribeCallInputSchema>;

const TranscribeCallOutputSchema = z.object({
  transcribedText: z.string().describe('The accurate transcription of the audio recording.'),
});
export type TranscribeCallOutput = z.infer<typeof TranscribeCallOutputSchema>;

export async function transcribeCall(
  input: TranscribeCallInput
): Promise<TranscribeCallOutput> {
  return transcribeCallFlow(input);
}

const transcribeCallPrompt = ai.definePrompt({
  name: 'transcribeCallPrompt',
  input: {schema: TranscribeCallInputSchema},
  output: {schema: TranscribeCallOutputSchema},
  prompt: `You are an expert audio transcriber. Your task is to accurately transcribe the provided audio recording into text.
Return the transcription in the specified JSON format.

Audio: {{media url=audioDataUri}}`,
});

const transcribeCallFlow = ai.defineFlow(
  {
    name: 'transcribeCallFlow',
    inputSchema: TranscribeCallInputSchema,
    outputSchema: TranscribeCallOutputSchema,
  },
  async (input) => {
    const {output} = await transcribeCallPrompt(input);
    return output!;
  }
);

```
