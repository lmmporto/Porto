# extract-key-points.ts

## Visão geral
- Caminho original: `frontend/src/ai/flows/extract-key-points.ts`
- Domínio: **ai**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **ai-flow**
- Criticidade: **critical**
- Score de importância: **152**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **51**
- Imports detectados: **2**
- Exports detectados: **3**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como ai-flow no domínio ai. Criticidade: critical. Prioridade: 01-FUNDAMENTAL. Exports detectados: ExtractKeyPointsInput, ExtractKeyPointsOutput, extractKeyPoints. Funções/classes detectadas: extractKeyPoints, that. Dependências locais detectadas: @/ai/genkit. Dependências externas detectadas: genkit. Temas relevantes detectados: insights, sdr. Indícios de framework/arquitetura: server-component-or-action, ai-flow.

## Dependências locais
- `@/ai/genkit`

## Dependências externas
- `genkit`

## Todos os imports detectados
- `@/ai/genkit`
- `genkit`

## Exports detectados
- `ExtractKeyPointsInput`
- `ExtractKeyPointsOutput`
- `extractKeyPoints`

## Funções e classes detectadas
- `extractKeyPoints`
- `that`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `insights`
- `sdr`

## Indícios de framework/arquitetura
- `server-component-or-action`
- `ai-flow`

## Código
```ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for extracting key discussion points from a call transcript.
 *
 * - extractKeyPoints - A function that extracts key discussion points from a given transcript.
 * - ExtractKeyPointsInput - The input type for the extractKeyPoints function.
 * - ExtractKeyPointsOutput - The return type for the extractKeyPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyPointsInputSchema = z.object({
  transcript: z.string().describe('The full call transcript.'),
});
export type ExtractKeyPointsInput = z.infer<typeof ExtractKeyPointsInputSchema>;

const ExtractKeyPointsOutputSchema = z.object({
  keyDiscussionPoints: z.array(z.string()).describe('An array of key discussion points extracted from the transcript.'),
});
export type ExtractKeyPointsOutput = z.infer<typeof ExtractKeyPointsOutputSchema>;

export async function extractKeyPoints(input: ExtractKeyPointsInput): Promise<ExtractKeyPointsOutput> {
  return extractKeyPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyPointsPrompt',
  input: {schema: ExtractKeyPointsInputSchema},
  output: {schema: ExtractKeyPointsOutputSchema},
  prompt: `You are an expert assistant for SDR Managers, tasked with identifying critical information from call transcripts.

From the following call transcript, identify and extract the most important discussion points. Focus on key topics, decisions, commitments, and significant insights shared during the conversation. Present these as a concise list of individual points.

Transcript:
{{{transcript}}}`,
});

const extractKeyPointsFlow = ai.defineFlow(
  {
    name: 'extractKeyPointsFlow',
    inputSchema: ExtractKeyPointsInputSchema,
    outputSchema: ExtractKeyPointsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
//

```
