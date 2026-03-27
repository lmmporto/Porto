'use server';
/**
 * @fileOverview A Genkit flow for generating a concise summary of a call transcript.
 *
 * - summarizeCall - A function that handles the call summarization process.
 * - SummarizeCallInput - The input type for the summarizeCall function.
 * - SummarizeCallOutput - The return type for the summarizeCall function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeCallInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the call to be summarized.'),
});
export type SummarizeCallInput = z.infer<typeof SummarizeCallInputSchema>;

const SummarizeCallOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the call transcript, highlighting main topics and outcomes.'),
});
export type SummarizeCallOutput = z.infer<typeof SummarizeCallOutputSchema>;

export async function summarizeCall(input: SummarizeCallInput): Promise<SummarizeCallOutput> {
  return summarizeCallFlow(input);
}

const summarizeCallPrompt = ai.definePrompt({
  name: 'summarizeCallPrompt',
  input: { schema: SummarizeCallInputSchema },
  output: { schema: SummarizeCallOutputSchema },
  prompt: `You are an AI assistant specialized in summarizing sales call transcripts for SDR managers.
Your goal is to provide a concise summary that highlights the main topics and outcomes of the conversation.

Here is the call transcript:

Transcript: {{{transcript}}}

Generate a concise summary of the call transcript:
`,
});

const summarizeCallFlow = ai.defineFlow(
  {
    name: 'summarizeCallFlow',
    inputSchema: SummarizeCallInputSchema,
    outputSchema: SummarizeCallOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeCallPrompt(input);
    return output!;
  }
);
