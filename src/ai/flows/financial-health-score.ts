
'use server';
/**
 * @fileOverview An AI agent for assessing financial health.
 *
 * - getFinancialHealthScore - A function that handles the financial health assessment.
 * - FinancialHealthScoreInput - The input type for the getFinancialHealthScore function.
 * - FinancialHealthScoreOutput - The return type for the getFinancialHealthScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialHealthScoreInputSchema = z.object({
  assetSummary: z
    .string()
    .describe('A summary of the user\'s current asset holdings including names, values, and types (e.g., "Savings Account: $10000, Tech Stocks Portfolio: $25000, Bitcoin: $5000").'),
  debtSummary: z
    .string()
    .describe('A summary of the user\'s current debts including names and remaining balances (e.g., "Student Loan: $15000 remaining, Credit Card: $2000 balance"). Empty if no debts.'),
  averageMonthlyIncome: z
    .number()
    .positive()
    .describe('The user\'s estimated average monthly income after taxes.'),
  averageMonthlyExpenses: z
    .number()
    .nonnegative()
    .describe('The user\'s estimated average monthly expenses.'),
});
export type FinancialHealthScoreInput = z.infer<typeof FinancialHealthScoreInputSchema>;

const FinancialHealthScoreOutputSchema = z.object({
  score: z.number().min(0).max(1000).describe('A numerical financial health score between 0 and 1000. Higher is better.'),
  assessment: z.string().describe('A brief qualitative assessment of overall financial health (e.g., Excellent, Good, Fair, Needs Improvement, Critical).'),
  positiveFactors: z.array(z.string()).describe('A list of 2-3 key positive factors contributing to the score. Each factor should be a concise sentence.'),
  areasForImprovement: z.array(z.string()).describe('A list of 2-3 actionable key areas where financial health can be improved. Each area should be a concise sentence.')
});
export type FinancialHealthScoreOutput = z.infer<typeof FinancialHealthScoreOutputSchema>;

export async function getFinancialHealthScore(input: FinancialHealthScoreInput): Promise<FinancialHealthScoreOutput> {
  return financialHealthScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialHealthScorePrompt',
  input: {schema: FinancialHealthScoreInputSchema},
  output: {schema: FinancialHealthScoreOutputSchema},
  prompt: `You are an expert financial advisor. Analyze the provided financial snapshot to assess the user's overall financial health.

  Consider factors like:
  - Assets vs. Debts (Net Worth)
  - Income vs. Expenses (Savings Rate / Cash Flow)
  - Emergency fund adequacy (relative to expenses, if inferable from assets)
  - Debt load (relative to income, if inferable)
  - Investment diversity (if inferable from asset types)

  Asset Summary: {{{assetSummary}}}
  Debt Summary: {{{debtSummary}}}
  Average Monthly Income: {{{averageMonthlyIncome}}}
  Average Monthly Expenses: {{{averageMonthlyExpenses}}}

  Based on this information, provide:
  1.  A numerical financial health score between 0 and 1000 (0 being very poor, 1000 being excellent).
  2.  A brief qualitative assessment (e.g., Excellent, Good, Fair, Needs Improvement, Critical).
  3.  A list of 2-3 key positive factors contributing to the score.
  4.  A list of 2-3 actionable key areas where financial health can be improved.

  Be encouraging and constructive in your feedback. Focus on the most impactful factors.
  If the debt summary is empty or indicates no debts, consider that a positive factor.
  If assets heavily outweigh debts, that's a strong positive.
  A positive cash flow (income > expenses) is crucial.
  Lack of emergency savings (e.g., no significant liquid assets like bank accounts vs. monthly expenses) is a key area for improvement.
  High debt relative to income is a concern.
  `,
});

const financialHealthScoreFlow = ai.defineFlow(
  {
    name: 'financialHealthScoreFlow',
    inputSchema: FinancialHealthScoreInputSchema,
    outputSchema: FinancialHealthScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
