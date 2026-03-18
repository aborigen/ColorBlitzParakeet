'use server';
/**
 * @fileOverview A Genkit flow for generating a fun, AI-powered fact about colors or color theory.
 *
 * - aiCreatedColorFact - A function that generates a color fact.
 * - AiCreatedColorFactInput - The input type for the aiCreatedColorFact function.
 * - AiCreatedColorFactOutput - The return type for the aiCreatedColorFact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCreatedColorFactInputSchema = z
  .object({
    colorName: z
      .string()
      .optional()
      .describe(
        'An optional color name to base the fact on. If not provided, a general color theory fact will be generated.'
      ),
  })
  .describe('Input for generating a fun color fact.');
export type AiCreatedColorFactInput = z.infer<typeof AiCreatedColorFactInputSchema>;

const AiCreatedColorFactOutputSchema = z
  .object({
    fact: z.string().describe('A fun and interesting fact about colors or color theory.'),
  })
  .describe('Output containing the generated color fact.');
export type AiCreatedColorFactOutput = z.infer<typeof AiCreatedColorFactOutputSchema>;

export async function aiCreatedColorFact(
  input: AiCreatedColorFactInput
): Promise<AiCreatedColorFactOutput> {
  return aiCreatedColorFactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'colorFactPrompt',
  input: {schema: AiCreatedColorFactInputSchema},
  output: {schema: AiCreatedColorFactOutputSchema},
  prompt: `You are an expert on color theory and fun facts.
Generate a single, concise, and fun fact about colors or color theory.

{{#if colorName}}
Focus the fact on the color: {{{colorName}}}.
{{else}}
Generate a general fact about color theory.
{{/if}}

The fact should be engaging and suitable for a hyper-casual game's loading screen or post-game summary.`,
});

const aiCreatedColorFactFlow = ai.defineFlow(
  {
    name: 'aiCreatedColorFactFlow',
    inputSchema: AiCreatedColorFactInputSchema,
    outputSchema: AiCreatedColorFactOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
