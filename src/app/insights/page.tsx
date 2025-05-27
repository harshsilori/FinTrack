
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Lightbulb, Loader2, AlertTriangle, Info, TrendingUp, TrendingDown, ShieldCheck, Sparkles } from 'lucide-react';
import { getSavingsOpportunities, type GetSavingsOpportunitiesOutput } from '@/ai/flows/savings-opportunities';
import { getFinancialHealthScore, type FinancialHealthScoreOutput, type FinancialHealthScoreInput } from '@/ai/flows/financial-health-score';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useAssets, type Asset as ContextAsset } from '@/contexts/AssetContext';
import { useDebts, type Debt as ContextDebt } from '@/contexts/DebtContext';
import { useTransactions, type Transaction } from '@/contexts/TransactionContext'; 
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, startOfMonth, subMonths, isSameMonth } from 'date-fns';

export default function AiInsightsPage() {
  const { toast } = useToast();
  const { assets } = useAssets();
  const { debts } = useDebts();
  const { transactions } = useTransactions(); 

  const [opportunities, setOpportunities] = useState<GetSavingsOpportunitiesOutput['opportunities'] | null>(null);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null);

  const [healthScoreResult, setHealthScoreResult] = useState<FinancialHealthScoreOutput | null>(null);
  const [isLoadingHealthScore, setIsLoadingHealthScore] = useState(false);
  const [healthScoreError, setHealthScoreError] = useState<string | null>(null);
  const [healthScoreCalculationInfo, setHealthScoreCalculationInfo] = useState<string | null>(null);


  const formatAssetSummary = (currentAssets: ContextAsset[]): string => {
    if (!currentAssets || currentAssets.length === 0) {
      return "No assets available.";
    }
    return currentAssets
      .map(asset => {
        let detail = `${asset.name}: ${asset.currency} ${asset.currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Category: ${asset.category}`;
        if (asset.tickerSymbol) {
          detail += `, Ticker: ${asset.tickerSymbol}`;
        }
         if (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund') {
          detail += `, Quantity: ${asset.quantity}`;
        }
        detail += ')';
        return detail;
      })
      .join('; ');
  };
  
  const formatDebtSummary = (currentDebts: ContextDebt[]): string => {
    if (!currentDebts || currentDebts.length === 0) {
      return "No debts recorded.";
    }
    return currentDebts
      .map(debt => {
        const remainingBalance = debt.totalAmount - debt.amountPaid;
        return `${debt.name}: ${formatCurrency(remainingBalance)} remaining (Total: ${formatCurrency(debt.totalAmount)})`;
      })
      .join('; ');
  };
  
  const formatCurrency = (value: number | undefined, currencyCode: string = 'USD') => {
    if (value === undefined) return 'N/A';
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  const handleGetOpportunities = async () => {
    if (!assets || assets.length === 0) {
      toast({
        title: "No Assets Found",
        description: "Please add some assets on the Assets page first to get insights. You can navigate there using the sidebar.",
        variant: "default",
      });
      setOpportunitiesError("No assets available to analyze. Please add assets on the Assets page.");
      setOpportunities(null);
      return;
    }

    setIsLoadingOpportunities(true);
    setOpportunitiesError(null);
    setOpportunities(null);

    const currentAssetSummary = formatAssetSummary(assets);

    try {
      const result = await getSavingsOpportunities({ assetSummary: currentAssetSummary });
      if (result && result.opportunities) {
        setOpportunities(result.opportunities);
        if (result.opportunities.length === 0) {
          toast({
            title: "No Specific Opportunities Found",
            description: "The AI couldn't identify specific new savings or optimization opportunities from your current assets.",
          });
        }
      } else {
        setOpportunities(null);
        setOpportunitiesError("AI analysis returned no data. Please try again.");
        toast({
          title: "Analysis Incomplete",
          description: "The AI analysis did not return any opportunities. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching savings opportunities:', err);
      let errorMessage = 'Failed to fetch savings opportunities. Please try again.';
      if (err instanceof Error) {
        errorMessage = `Failed to fetch savings opportunities: ${err.message}. Please try again.`;
      } else if (typeof err === 'string') {
        errorMessage = `Failed to fetch savings opportunities: ${err}. Please try again.`;
      }
      setOpportunitiesError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage, // Show more detailed error from Genkit
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const calculateAverageMonthlyIncomeAndExpenses = (txs: Transaction[]): { averageIncome: number; averageExpenses: number; monthsConsidered: number } => {
    if (!txs || txs.length === 0) {
      return { averageIncome: 0, averageExpenses: 0, monthsConsidered: 0 };
    }

    const monthlyData: Record<string, { income: number, expenses: number, monthYear: string }> = {};
    const endDate = new Date();
    const startDate = startOfMonth(subMonths(endDate, 5)); 

    txs.forEach(tx => {
      const txDate = parseISO(tx.date);
      if (txDate >= startDate && txDate <= endDate) { 
        const monthYear = format(txDate, 'yyyy-MM');
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expenses: 0, monthYear };
        }
        if (tx.type === 'income') {
          monthlyData[monthYear].income += tx.amount;
        } else {
          monthlyData[monthYear].expenses += tx.amount;
        }
      }
    });
    
    const sortedMonthlyDataValues = Object.values(monthlyData).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
    
    if (sortedMonthlyDataValues.length === 0) {
        return { averageIncome: 0, averageExpenses: 0, monthsConsidered: 0 };
    }

    const totalIncome = sortedMonthlyDataValues.reduce((sum, data) => sum + data.income, 0);
    const totalExpenses = sortedMonthlyDataValues.reduce((sum, data) => sum + data.expenses, 0);
    const numMonths = sortedMonthlyDataValues.length;

    return {
      averageIncome: totalIncome / numMonths,
      averageExpenses: totalExpenses / numMonths,
      monthsConsidered: numMonths,
    };
  };


  const handleGetHealthScore = async () => {
    setIsLoadingHealthScore(true);
    setHealthScoreError(null);
    setHealthScoreResult(null);
    setHealthScoreCalculationInfo(null);

    if (!assets || assets.length === 0) {
      toast({ title: "No Assets Found", description: "Please add some assets on the Assets page first to calculate a health score.", variant: "default" });
      setHealthScoreError("No assets available for health score. Please add assets on the Assets page.");
      setIsLoadingHealthScore(false);
      return;
    }
     if (!transactions || transactions.length === 0) {
      toast({ title: "No Transactions Found", description: "Financial health score requires transaction data for income/expense averages. Please add transactions.", variant: "default" });
      setHealthScoreError("No transaction data available for income/expense averages. Please add transactions.");
      setIsLoadingHealthScore(false);
      return;
    }


    const { averageIncome, averageExpenses, monthsConsidered } = calculateAverageMonthlyIncomeAndExpenses(transactions);
    
    let calcInfo = `Averages based on ${monthsConsidered} month(s) of transaction data.`;
    if (monthsConsidered === 0) {
        calcInfo = "Not enough transaction data (last 6 months) to calculate income/expense averages for score. Score may be less accurate.";
        toast({ title: "Limited Data", description: calcInfo, variant: "default", duration: 7000});
    } else if (monthsConsidered < 3) {
        calcInfo = `Averages based on only ${monthsConsidered} month(s) of transaction data. Score might be less accurate with more data.`;
        toast({ title: "Limited Data", description: calcInfo, variant: "default", duration: 7000 });
    }
    setHealthScoreCalculationInfo(calcInfo);


    const currentAssetSummary = formatAssetSummary(assets);
    const currentDebtSummary = formatDebtSummary(debts);

    try {
      const result = await getFinancialHealthScore({ 
        assetSummary: currentAssetSummary,
        debtSummary: currentDebtSummary,
        averageMonthlyIncome: averageIncome, 
        averageMonthlyExpenses: averageExpenses, 
       });
      if (result) {
        setHealthScoreResult(result);
      } else {
        setHealthScoreResult(null);
        setHealthScoreError("AI analysis for health score returned no data. Please try again.");
        toast({
          title: "Health Score Incomplete",
          description: "The AI analysis did not return a score. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching financial health score:', err);
      let errorMessage = 'Failed to fetch financial health score. Please try again.';
      if (err instanceof Error) {
        errorMessage = `Failed to fetch financial health score: ${err.message}. Please try again.`;
      } else if (typeof err === 'string') {
        errorMessage = `Failed to fetch financial health score: ${err}. Please try again.`;
      }
      setHealthScoreError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage, // Show more detailed error from Genkit
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoadingHealthScore(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 800) return 'bg-green-500';
    if (score > 600) return 'bg-yellow-500';
    if (score > 400) return 'bg-orange-500';
    return 'bg-red-500';
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">AI Financial Insights</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Get personalized optimization suggestions and financial health assessments.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl"><Sparkles className="h-5 w-5 text-primary" /> Financial Health Score</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your financial health score is calculated using your tracked assets, debts, and automatically derived average monthly income and expenses from your transaction history (last 6 months).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <Button onClick={handleGetHealthScore} disabled={isLoadingHealthScore || !assets || assets.length === 0 || !transactions || transactions.length === 0} className="w-full sm:w-auto text-xs sm:text-sm">
            {isLoadingHealthScore ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Calculate My Financial Health Score
          </Button>
           {healthScoreCalculationInfo && !isLoadingHealthScore && (
            <p className="text-xs text-muted-foreground pt-1"><Info className="inline h-3 w-3 mr-1"/>{healthScoreCalculationInfo}</p>
          )}
        </CardContent>
        {healthScoreResult && !isLoadingHealthScore && (
          <CardFooter className="flex flex-col items-start gap-3 sm:gap-4 pt-4 border-t p-4 sm:p-6">
            <div className="w-full text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Your Score</p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ color: `hsl(var(--${getScoreColor(healthScoreResult.score).replace('bg-', '')}))` }}>
                {healthScoreResult.score}
                <span className="text-lg sm:text-xl text-muted-foreground">/1000</span>
              </p>
              <Progress value={(healthScoreResult.score / 1000) * 100} className="h-2 sm:h-3 mt-2 rounded-lg" indicatorClassName={getScoreColor(healthScoreResult.score)} />
              <p className="text-md sm:text-lg font-semibold mt-1" style={{ color: `hsl(var(--${getScoreColor(healthScoreResult.score).replace('bg-', '')}))` }}>
                {healthScoreResult.assessment}
              </p>
            </div>
            {healthScoreResult.positiveFactors && healthScoreResult.positiveFactors.length > 0 && (
                <div className="w-full">
                    <h4 className="font-semibold text-sm sm:text-md flex items-center gap-2"><TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-green-500"/> Positive Factors</h4>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1 mt-1">
                        {healthScoreResult.positiveFactors.map((factor, i) => <li key={`pos-${i}`}>{factor}</li>)}
                    </ul>
                </div>
            )}
            {healthScoreResult.areasForImprovement && healthScoreResult.areasForImprovement.length > 0 && (
                 <div className="w-full">
                    <h4 className="font-semibold text-sm sm:text-md flex items-center gap-2"><TrendingDown className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500"/> Areas for Improvement</h4>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1 mt-1">
                        {healthScoreResult.areasForImprovement.map((area, i) => <li key={`imp-${i}`}>{area}</li>)}
                    </ul>
                </div>
            )}
          </CardFooter>
        )}
        {healthScoreError && !isLoadingHealthScore && (
            <CardFooter className="pt-4 border-t p-4 sm:p-6">
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{healthScoreError}</span>
                </div>
            </CardFooter>
        )}
         {((!assets || assets.length === 0) || (!transactions || transactions.length === 0)) && !isLoadingHealthScore && (
                <CardFooter className="pt-4 border-t p-4 sm:p-6">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                            Financial health score calculation requires both asset data and transaction history.
                            {!assets || assets.length === 0 ? " Please add assets." : ""}
                            {!transactions || transactions.length === 0 ? " Please add transactions." : ""}
                             {assets?.length === 0 && <Link href="/assets" className="underline hover:text-primary ml-1">Go to Assets</Link>}
                             {transactions?.length === 0 && <Link href="/transactions" className="underline hover:text-primary ml-1">Go to Transactions</Link>}
                        </span>
                    </div>
                </CardFooter>
            )}
      </Card>


      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl"><Lightbulb className="h-5 w-5 text-primary" /> Savings & Optimization Opportunities</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Analyze your manually entered assets (from the Assets page) to generate financial opportunities.
            {(!assets || assets.length === 0) && (
                <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground p-2 sm:p-3 bg-muted/50 rounded-md">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>No assets are currently being tracked. Please go to the <Link href="/assets" className="underline hover:text-primary">Assets page</Link> to add some.</span>
                </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <Button onClick={handleGetOpportunities} disabled={isLoadingOpportunities || !assets || assets.length === 0} className="w-full sm:w-auto text-xs sm:text-sm">
            {isLoadingOpportunities ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Get Financial Opportunities
          </Button>
        </CardContent>
      
        {opportunitiesError && !isLoadingOpportunities && (!opportunities || opportunities.length === 0) && (
          <CardFooter className="pt-4 border-t p-4 sm:p-6">
            <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{opportunitiesError}</span>
            </div>
          </CardFooter>
        )}

        {opportunities && opportunities.length > 0 && !isLoadingOpportunities && (
          <CardFooter className="flex flex-col items-start gap-3 sm:gap-4 pt-4 border-t p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold">Suggested Opportunities</h3>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2 w-full">
              {opportunities.map((op, index) => (
                <Card key={index} className="rounded-xl shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 sm:pb-3 p-3 sm:p-4">
                    <div>
                      <CardTitle className="text-sm sm:text-md">{op.category}</CardTitle>
                      {op.potentialSavings && (
                        <CardDescription className="font-semibold text-green-600 dark:text-green-400 text-xs sm:text-sm">
                          Potential Benefit: {op.potentialSavings}
                        </CardDescription>
                      )}
                    </div>
                    <Image src="https://placehold.co/32x32.png" alt="Suggestion icon" width={24} height={24} sm-width={32} sm-height={32} data-ai-hint="idea lightbulb" className="rounded-md" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{op.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardFooter>
        )}
        
        {!isLoadingOpportunities && !opportunitiesError && opportunities && opportunities.length === 0 && (
            <CardFooter className="pt-4 border-t p-4 sm:p-6">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Based on your current assets, the AI could not identify any specific new optimization opportunities at this time.</span>
                </div>
            </CardFooter>
        )}
      </Card>

    </div>
  );
}

