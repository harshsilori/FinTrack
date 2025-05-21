
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2, AlertTriangle, Info } from 'lucide-react';
import { getSavingsOpportunities, type GetSavingsOpportunitiesOutput } from '@/ai/flows/savings-opportunities';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useAssets, type Asset as ContextAsset } from '@/contexts/AssetContext';
import Link from 'next/link';

export default function AiInsightsPage() {
  const { toast } = useToast();
  const { assets, getAssetMarketValue } = useAssets();
  const [opportunities, setOpportunities] = useState<GetSavingsOpportunitiesOutput['opportunities'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatAssetSummary = (currentAssets: ContextAsset[]): string => {
    if (!currentAssets || currentAssets.length === 0) {
      return "No assets available.";
    }
    return currentAssets
      .map(asset => {
        const marketValue = getAssetMarketValue(asset);
        let detail = `${asset.name}: ${asset.currency} ${marketValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Category: ${asset.category}`;
        if (asset.tickerSymbol) detail += `, Ticker: ${asset.tickerSymbol}`;
        detail += ')';
        return detail;
      })
      .join('; ');
  };

  const handleSubmit = async () => {
    if (!assets || assets.length === 0) {
      toast({
        title: "No Assets Found",
        description: "Please add some assets on the Assets page first to get insights.",
        variant: "default",
      });
      setError("No assets available to analyze. Please add assets on the Assets page.");
      setOpportunities(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setOpportunities(null);

    const currentAssetSummary = formatAssetSummary(assets);

    try {
      const result = await getSavingsOpportunities({ assetSummary: currentAssetSummary });
      setOpportunities(result.opportunities);
      if (!result.opportunities || result.opportunities.length === 0) {
        toast({
          title: "No Specific Opportunities Found",
          description: "The AI couldn't identify specific new savings or optimization opportunities from your current assets.",
        });
      }
    } catch (err) {
      console.error('Error fetching savings opportunities:', err);
      setError('Failed to fetch savings opportunities. Please try again.');
      toast({
        title: "Error",
        description: "An error occurred while generating insights.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Financial Insights</h1>
        <p className="text-muted-foreground">
          Get personalized optimization suggestions based on your currently tracked assets.
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Asset Analysis</CardTitle>
          <CardDescription>
            Click the button below to analyze your assets (from the Assets page) and generate financial opportunities.
            {(!assets || assets.length === 0) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                    <Info className="h-5 w-5 text-primary" />
                    <span>No assets are currently being tracked. Please go to the <Link href="/assets" className="underline hover:text-primary">Assets page</Link> to add some.</span>
                </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSubmit} disabled={isLoading || !assets || assets.length === 0} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Get Financial Opportunities
          </Button>
        </CardContent>
      </Card>

      {error && (!isLoading && (!opportunities || opportunities.length === 0)) && (
        <Card className="rounded-2xl shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Analysis Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {opportunities && opportunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Suggested Opportunities</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((op, index) => (
              <Card key={index} className="rounded-2xl shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{op.category}</CardTitle>
                    {op.potentialSavings && (
                       <CardDescription className="font-semibold text-green-600 dark:text-green-400">
                        Potential Benefit: {op.potentialSavings}
                      </CardDescription>
                    )}
                  </div>
                   <Image src="https://placehold.co/40x40.png" alt="Suggestion icon" width={40} height={40} data-ai-hint="idea lightbulb" className="rounded-md" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{op.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      { !isLoading && !error && opportunities && opportunities.length === 0 && (
         <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>No Specific Opportunities Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Based on your current assets, the AI could not identify any specific new optimization opportunities at this time.
              This might mean your assets are well-optimized, or more detailed data from different assets could yield other results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
