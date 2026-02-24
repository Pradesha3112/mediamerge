'use server';
/**
 * @fileOverview A GenAI tool that generates compelling titles and concise descriptions for a video
 * based on a user-provided prompt about the video's content or purpose.
 *
 * - generateVideoMetadata - A function that handles the video metadata generation process.
 * - GenerateVideoMetadataInput - The input type for the generateVideoMetadata function.
 * - GenerateVideoMetadataOutput - The return type for the generateVideoMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoMetadataInputSchema = z.object({
  videoPrompt: z.string().describe("A short prompt describing the video's content or purpose."),
});
export type GenerateVideoMetadataInput = z.infer<typeof GenerateVideoMetadataInputSchema>;

const GenerateVideoMetadataOutputSchema = z.object({
  titles: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('An array of 3 to 5 compelling title options for the video.'),
  descriptions: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('An array of 3 to 5 concise description options for the video.'),
});
export type GenerateVideoMetadataOutput = z.infer<typeof GenerateVideoMetadataOutputSchema>;

export async function generateVideoMetadata(
  input: GenerateVideoMetadataInput
): Promise<GenerateVideoMetadataOutput> {
  return generateVideoMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVideoMetadataPrompt',
  input: {schema: GenerateVideoMetadataInputSchema},
  output: {schema: GenerateVideoMetadataOutputSchema},
  prompt: `You are an AI assistant specialized in generating marketing copy for videos.
Your task is to generate several compelling titles and concise descriptions for a video.

The user will provide a short prompt describing the video's content or purpose.

Generate 3 to 5 distinct options for both the title and the description.
Ensure that the titles are catchy and engaging, and the descriptions are informative yet brief, highlighting the key aspects or benefits of the video.

Video Content/Purpose Prompt: {{{videoPrompt}}}`,
});

const generateVideoMetadataFlow = ai.defineFlow(
  {
    name: 'generateVideoMetadataFlow',
    inputSchema: GenerateVideoMetadataInputSchema,
    outputSchema: GenerateVideoMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
