
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lightbulb, Loader2, AlertTriangle, Info, TrendingUp, TrendingDown, ShieldCheck, Sparkles } from 'lucide-react';
import { getSavingsOpportunities, type GetSavingsOpportunitiesOutput } from '@/ai/flows/savings-opportunities';
import { getFinancialHealthScore, type FinancialHealthScoreOutput, type FinancialHealthScoreInput } from '@/ai/flows/financial-health-score';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useAssets, type Asset as ContextAsset } from '@/contexts/AssetContext';
import { useDebts, type Debt as ContextDebt } from '@/contexts/DebtContext';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

export default function AiInsightsPage() {
  const { toast } = useToast();
  const { assets } = useAssets();
  const { debts } = useDebts();

  const [opportunities, setOpportunities] = useState<GetSavingsOpportunitiesOutput['opportunities'] | null>(null);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null);

  const [healthScoreInput, setHealthScoreInput] = useState<Partial<FinancialHealthScoreInput>>({
    averageMonthlyIncome: undefined,
    averageMonthlyExpenses: undefined,
  });
  const [healthScoreResult, setHealthScoreResult] = useState<FinancialHealthScoreOutput | null>(null);
  const [isLoadingHealthScore, setIsLoadingHealthScore] = useState(false);
  const [healthScoreError, setHealthScoreError] = useState<string | null>(null);


  const formatAssetSummary = (currentAssets: ContextAsset[]): string => {
    if (!currentAssets || currentAssets.length === 0) {
      return "No assets available.";
    }
    return currentAssets
      .map(asset => {
        const marketValue = (asset.category === 'bank' || asset.category === 'property')
          ? asset.currentPrice
          : asset.currentPrice * (asset.quantity || 0);

        let detail = `${asset.name}: ${asset.currency} ${marketValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Category: ${asset.category}`;
        if (asset.tickerSymbol) {
          detail += `, Ticker: ${asset.tickerSymbol}`;
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
        description: "An error occurred while generating insights.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const handleGetHealthScore = async () => {
    if (!healthScoreInput.averageMonthlyIncome || healthScoreInput.averageMonthlyIncome <=0 || healthScoreInput.averageMonthlyExpenses === undefined || healthScoreInput.averageMonthlyExpenses < 0) {
        toast({ title: "Input Required", description: "Please enter valid average monthly income and expenses.", variant: "destructive" });
        return;
    }
    if (!assets || assets.length === 0) {
      toast({ title: "No Assets Found", description: "Please add some assets on the Assets page first to calculate a health score.", variant: "default" });
      setHealthScoreError("No assets available to analyze. Please add assets on the Assets page.");
      setHealthScoreResult(null);
      return;
    }

    setIsLoadingHealthScore(true);
    setHealthScoreError(null);
    setHealthScoreResult(null);

    const currentAssetSummary = formatAssetSummary(assets);
    const currentDebtSummary = formatDebtSummary(debts);

    try {
      const result = await getFinancialHealthScore({ 
        assetSummary: currentAssetSummary,
        debtSummary: currentDebtSummary,
        averageMonthlyIncome: healthScoreInput.averageMonthlyIncome!,
        averageMonthlyExpenses: healthScoreInput.averageMonthlyExpenses!,
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
        description: "An error occurred while generating your financial health score.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHealthScore(false);
    }
  };

  const handleHealthScoreInputChange = (field: keyof FinancialHealthScoreInput, value: string) => {
    setHealthScoreInput(prev => ({ ...prev, [field]: value === '' ? undefined : parseFloat(value) }));
  };

  const getScoreColor = (score: number) => {
    if (score > 800) return 'bg-green-500';
    if (score > 600) return 'bg-yellow-500';
    if (score > 400) return 'bg-orange-500';
    return 'bg-red-500';
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Financial Insights</h1>
        <p className="text-muted-foreground">
          Get personalized optimization suggestions and financial health assessments.
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Financial Health Score</CardTitle>
          <CardDescription>
            Enter your average monthly income and expenses to get your AI-powered financial health score. Assets and debts are automatically included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avgIncome">Average Monthly Income (after tax)</Label>
              <Input 
                id="avgIncome" 
                type="number" 
                placeholder="e.g., 5000" 
                value={healthScoreInput.averageMonthlyIncome || ''}
                onChange={(e) => handleHealthScoreInputChange('averageMonthlyIncome', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avgExpenses">Average Monthly Expenses</Label>
              <Input 
                id="avgExpenses" 
                type="number" 
                placeholder="e.g., 3500" 
                value={healthScoreInput.averageMonthlyExpenses || ''}
                onChange={(e) => handleHealthScoreInputChange('averageMonthlyExpenses', e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGetHealthScore} disabled={isLoadingHealthScore || !assets || assets.length === 0} className="w-full sm:w-auto">
            {isLoadingHealthScore ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Calculate My Financial Health Score
          </Button>
        </CardContent>
        {healthScoreResult && !isLoadingHealthScore && (
          <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t">
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">Your Score</p>
              <p className="text-6xl font-bold" style={{ color: `hsl(var(--${getScoreColor(healthScoreResult.score).replace('bg-', '')}))` }}>
                {healthScoreResult.score}
                <span className="text-xl text-muted-foreground">/1000</span>
              </p>
              <Progress value={(healthScoreResult.score / 1000) * 100} className="h-3 mt-2 rounded-lg" indicatorClassName={getScoreColor(healthScoreResult.score)} />
              <p className="text-lg font-semibold mt-1" style={{ color: `hsl(var(--${getScoreColor(healthScoreResult.score).replace('bg-', '')}))` }}>
                {healthScoreResult.assessment}
              </p>
            </div>
            {healthScoreResult.positiveFactors && healthScoreResult.positiveFactors.length > 0 && (
                <div className="w-full">
                    <h4 className="font-semibold text-md flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500"/> Positive Factors</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                        {healthScoreResult.positiveFactors.map((factor, i) => <li key={`pos-${i}`}>{factor}</li>)}
                    </ul>
                </div>
            )}
            {healthScoreResult.areasForImprovement && healthScoreResult.areasForImprovement.length > 0 && (
                 <div className="w-full">
                    <h4 className="font-semibold text-md flex items-center gap-2"><TrendingDown className="h-5 w-5 text-orange-500"/> Areas for Improvement</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
                        {healthScoreResult.areasForImprovement.map((area, i) => <li key={`imp-${i}`}>{area}</li>)}
                    </ul>
                </div>
            )}
          </CardFooter>
        )}
        {healthScoreError && !isLoadingHealthScore && (
            <CardFooter className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{healthScoreError}</span>
                </div>
            </CardFooter>
        )}
         {(!assets || assets.length === 0) && (
                <CardFooter className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-5 w-5 text-primary" />
                        <span>No assets are currently being tracked. Please add assets to calculate health score.</span>
                    </div>
                </CardFooter>
            )}
      </Card>


      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Savings & Optimization Opportunities</CardTitle>
          <CardDescription>
            Analyze your manually entered assets (from the Assets page) to generate financial opportunities.
            {(!assets || assets.length === 0) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                    <Info className="h-5 w-5 text-primary" />
                    <span>No assets are currently being tracked. Please go to the <Link href="/assets" className="underline hover:text-primary">Assets page</Link> to add some.</span>
                </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGetOpportunities} disabled={isLoadingOpportunities || !assets || assets.length === 0} className="w-full sm:w-auto">
            {isLoadingOpportunities ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Get Financial Opportunities
          </Button>
        </CardContent>
      
        {opportunitiesError && !isLoadingOpportunities && (!opportunities || opportunities.length === 0) && (
          <CardFooter className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>{opportunitiesError}</span>
            </div>
          </CardFooter>
        )}

        {opportunities && opportunities.length > 0 && !isLoadingOpportunities && (
          <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t">
            <h3 className="text-xl font-semibold">Suggested Opportunities</h3>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 w-full">
              {opportunities.map((op, index) => (
                <Card key={index} className="rounded-xl shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                    <div>
                      <CardTitle className="text-md">{op.category}</CardTitle>
                      {op.potentialSavings && (
                        <CardDescription className="font-semibold text-green-600 dark:text-green-400">
                          Potential Benefit: {op.potentialSavings}
                        </CardDescription>
                      )}
                    </div>
                    <Image src="https://placehold.co/32x32.png" alt="Suggestion icon" width={32} height={32} data-ai-hint="idea lightbulb" className="rounded-md" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{op.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardFooter>
        )}
        
        {!isLoadingOpportunities && !opportunitiesError && opportunities && opportunities.length === 0 && (
            <CardFooter className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-5 w-5 text-primary" />
                    <span>Based on your current assets, the AI could not identify any specific new optimization opportunities at this time.</span>
                </div>
            </CardFooter>
        )}
      </Card>

    </div>
  );
}
