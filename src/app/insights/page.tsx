
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { getSavingsOpportunities, type GetSavingsOpportunitiesOutput } from '@/ai/flows/savings-opportunities';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

export default function AiInsightsPage() {
  const { toast } = useToast();
  const [assetSummary, setAssetSummary] = useState('');
  const [opportunities, setOpportunities] = useState<GetSavingsOpportunitiesOutput['opportunities'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!assetSummary.trim()) {
      toast({
        title: "Input Required",
        description: "Please paste your asset summary.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setOpportunities(null);

    try {
      const result = await getSavingsOpportunities({ assetSummary });
      setOpportunities(result.opportunities);
      if (!result.opportunities || result.opportunities.length === 0) {
        toast({
          title: "No Opportunities Found",
          description: "The AI couldn't identify specific savings or optimization opportunities from the provided asset summary, or there are none to suggest right now.",
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
          Paste your asset summary to get personalized optimization suggestions.
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Asset Summary Input</CardTitle>
          <CardDescription>
            Copy and paste a summary of your assets below. For example: "Savings Account: $12000 (0.2% APY), VTSAX Index Fund: $50000, Rental Property Equity: $75000".
            The more detail you provide, the better the suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste asset summary here (e.g., Asset Name: Value (details like interest rate, ticker if relevant))..."
            value={assetSummary}
            onChange={(e) => setAssetSummary(e.target.value)}
            rows={10}
            className="min-h-[150px] rounded-lg"
          />
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Get Financial Opportunities
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="rounded-2xl shadow-lg border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error</CardTitle>
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

      {opportunities && opportunities.length === 0 && !isLoading && !error && (
         <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>No Specific Opportunities Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Based on the provided asset summary, the AI could not identify any specific new optimization opportunities at this time.
              This might mean your assets are well-optimized, or more detailed/different data could yield other results.
              Consider reviewing common financial strategies or trying again with more data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
