'use server';

/**
 * @fileOverview A savings opportunities AI agent.
 *
 * - getSavingsOpportunities - A function that handles the savings opportunities process.
 * - GetSavingsOpportunitiesInput - The input type for the getSavingsOpportunities function.
 * - GetSavingsOpportunitiesOutput - The return type for the getSavingsOpportunities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSavingsOpportunitiesInputSchema = z.object({
  transactionHistory: z
    .string()
    .describe('A detailed history of the user transactions.'),
});
export type GetSavingsOpportunitiesInput = z.infer<typeof GetSavingsOpportunitiesInputSchema>;

const GetSavingsOpportunitiesOutputSchema = z.object({
  opportunities: z.array(
    z.object({
      category: z.string().describe('The category of the saving opportunity.'),
      description: z.string().describe('A detailed description of the saving opportunity.'),
      potentialSavings: z
        .string()
        .describe('The estimated potential savings from this opportunity.'),
    })
  ).describe('A list of personalized saving opportunities.'),
});
export type GetSavingsOpportunitiesOutput = z.infer<typeof GetSavingsOpportunitiesOutputSchema>;

export async function getSavingsOpportunities(input: GetSavingsOpportunitiesInput): Promise<GetSavingsOpportunitiesOutput> {
  return savingsOpportunitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsOpportunitiesPrompt',
  input: {schema: GetSavingsOpportunitiesInputSchema},
  output: {schema: GetSavingsOpportunitiesOutputSchema},
  prompt: `You are a personal finance expert. Analyze the user's transaction history and identify potential savings opportunities.

Transaction History: {{{transactionHistory}}}

Based on the transaction history, provide a list of personalized savings opportunities. Each opportunity should include the category, a detailed description, and the estimated potential savings.

Format the output as a JSON array of saving opportunities.`,
});

const savingsOpportunitiesFlow = ai.defineFlow(
  {
    name: 'savingsOpportunitiesFlow',
    inputSchema: GetSavingsOpportunitiesInputSchema,
    outputSchema: GetSavingsOpportunitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
