
'use server';

/**
 * @fileOverview An AI agent for identifying savings and optimization opportunities from an asset summary.
 *
 * - getSavingsOpportunities - A function that handles the financial insights process.
 * - GetSavingsOpportunitiesInput - The input type for the getSavingsOpportunities function.
 * - GetSavingsOpportunitiesOutput - The return type for the getSavingsOpportunities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSavingsOpportunitiesInputSchema = z.object({
  assetSummary: z
    .string()
    .describe('A summary of the user\'s current asset holdings. e.g., "Savings Account: $10000 (0.5% APY), Tech Stocks Portfolio: $25000, Bitcoin: $5000"'),
});
export type GetSavingsOpportunitiesInput = z.infer<typeof GetSavingsOpportunitiesInputSchema>;

const GetSavingsOpportunitiesOutputSchema = z.object({
  opportunities: z.array(
    z.object({
      category: z.string().describe('The category of the saving or optimization opportunity (e.g., Investment Optimization, Fee Reduction, Better Savings Vehicle).'),
      description: z.string().describe('A detailed description of the opportunity.'),
      potentialSavings: z
        .string()
        .describe('The estimated potential savings or financial benefit from this opportunity.'),
    })
  ).describe('A list of personalized savings or optimization opportunities.'),
});
export type GetSavingsOpportunitiesOutput = z.infer<typeof GetSavingsOpportunitiesOutputSchema>;

export async function getSavingsOpportunities(input: GetSavingsOpportunitiesInput): Promise<GetSavingsOpportunitiesOutput> {
  return savingsOpportunitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsOpportunitiesPrompt',
  input: {schema: GetSavingsOpportunitiesInputSchema},
  output: {schema: GetSavingsOpportunitiesOutputSchema},
  prompt: `You are a personal finance expert. Analyze the user's current asset holdings and identify potential savings opportunities or financial optimizations.

Asset Summary: {{{assetSummary}}}

Based on the provided asset summary, provide a list of personalized opportunities. These could relate to optimizing returns, reducing fees, rebalancing, or finding better alternatives for the listed assets. Each opportunity should include a category (e.g., Investment Optimization, Fee Reduction, Better Savings Vehicle), a detailed description, and the estimated potential savings or financial benefit.

Format the output as a JSON array of opportunities.`,
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
