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
