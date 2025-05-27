
'use client';

import React from 'react';
import type { AssetCategory } from "@/contexts/AssetContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bitcoin, Landmark, BarChartBig, WalletCards, TrendingUp, DollarSign, PiggyBank, Building2, AlertTriangle, Target, Plane, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { useAssets } from "@/contexts/AssetContext";
import { useGoals } from "@/contexts/GoalContext"; // Import useGoals
import type { Asset } from "@/contexts/AssetContext";
import type { Goal } from "@/contexts/GoalContext";


const categoryIcons: Record<AssetCategory | 'total', React.ReactNode> = {
  crypto: <Bitcoin className="h-6 w-6 text-orange-500" />,
  stock: <BarChartBig className="h-6 w-6 text-green-500" />,
  mutualfund: <WalletCards className="h-6 w-6 text-indigo-500" />,
  bank: <Landmark className="h-6 w-6 text-blue-500" />,
  property: <Building2 className="h-6 w-6 text-purple-500" />,
  total: <DollarSign className="h-6 w-6 text-primary" />
};

const goalDisplayIcons: Record<string, React.ReactNode> = {
  Target: <Target className="h-5 w-5 text-primary" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5 text-green-500" />,
  Plane: <Plane className="h-5 w-5 text-blue-500" />,
  Default: <Target className="h-5 w-5 text-primary" />,
};


interface CategorySummary {
  totalValue: number;
  totalPurchaseCost?: number;
  gainLossAmount?: number;
  gainLossPercent?: number;
  assetCount: number;
}

export default function HomePage() {
  const { assets, getAssetMarketValue } = useAssets();
  const { goals } = useGoals(); // Get goals from context

  const formatCurrency = (value: number, currencyCode: string) => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const portfolioTotalsByCurrency: Record<string, number> = {};
  assets.forEach(asset => {
    const marketValue = getAssetMarketValue(asset);
    portfolioTotalsByCurrency[asset.currency] = (portfolioTotalsByCurrency[asset.currency] || 0) + marketValue;
  });

  const categorySummariesByCurrency: Record<string, Record<AssetCategory, CategorySummary>> = {};

  assets.forEach(asset => {
    if (!categorySummariesByCurrency[asset.currency]) {
      categorySummariesByCurrency[asset.currency] = {
        crypto: { totalValue: 0, totalPurchaseCost: 0, gainLossAmount: 0, gainLossPercent: 0, assetCount: 0 },
        stock: { totalValue: 0, totalPurchaseCost: 0, gainLossAmount: 0, gainLossPercent: 0, assetCount: 0 },
        mutualfund: { totalValue: 0, totalPurchaseCost: 0, gainLossAmount: 0, gainLossPercent: 0, assetCount: 0 },
        bank: { totalValue: 0, assetCount: 0, totalPurchaseCost: 0, gainLossAmount: 0 }, // Added for consistency
        property: { totalValue: 0, assetCount: 0, totalPurchaseCost: 0, gainLossAmount: 0 }, // Added for consistency
      };
    }

    const summary = categorySummariesByCurrency[asset.currency][asset.category];
    const marketValue = getAssetMarketValue(asset);
    
    summary.totalValue += marketValue;
    summary.assetCount += 1;

    if ((asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund') && asset.purchasePrice !== undefined && asset.quantity !== undefined) {
      const purchaseCost = asset.purchasePrice * asset.quantity;
      summary.totalPurchaseCost = (summary.totalPurchaseCost || 0) + purchaseCost;
      summary.gainLossAmount = (summary.gainLossAmount || 0) + (marketValue - purchaseCost);
    }
  });

  Object.values(categorySummariesByCurrency).forEach(currencySummary => {
    (['crypto', 'stock', 'mutualfund'] as AssetCategory[]).forEach(cat => {
      const categoryData = currencySummary[cat];
      if (categoryData && categoryData.totalPurchaseCost && categoryData.totalPurchaseCost > 0) {
        categoryData.gainLossPercent = (categoryData.gainLossAmount! / categoryData.totalPurchaseCost) * 100;
      } else if (categoryData && categoryData.totalPurchaseCost === 0 && categoryData.gainLossAmount && categoryData.gainLossAmount !== 0) {
        categoryData.gainLossPercent = categoryData.gainLossAmount! > 0 ? Infinity : -Infinity; 
      } else {
        categoryData.gainLossPercent = 0;
      }
    });
  });
  
  const orderedCategories: AssetCategory[] = ['stock', 'crypto', 'mutualfund', 'bank', 'property'];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your financial overview. All prices are manually entered.
          </p>
        </div>
         <Link href="/transactions" passHref>
           <Button>
             <DollarSign className="mr-2 h-4 w-4" /> Add Transaction
           </Button>
        </Link>
      </div>

      {Object.keys(portfolioTotalsByCurrency).length > 0 ? (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg sm:text-xl">Total Net Worth</CardTitle>
            {categoryIcons['total']}
          </CardHeader>
          <CardContent>
            {Object.entries(portfolioTotalsByCurrency).map(([currency, total]) => (
              <div key={currency} className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {formatCurrency(total, currency)}
                <span className="text-sm text-muted-foreground ml-1">({currency})</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Calculated from manually entered current asset values.</p>
          </CardContent>
        </Card>
      ) : (
         <Card className="rounded-2xl shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center text-muted-foreground">
                <WalletCards className="mx-auto h-12 w-12 mb-4 text-primary" />
                <p className="text-lg font-semibold">Welcome to FinTrack!</p>
                <p>Start by adding an asset to see your financial dashboard populate.</p>
                <div className="mt-4 flex justify-center gap-2">
                    <Link href="/assets" passHref>
                        <Button><WalletCards className="mr-2 h-4 w-4"/> Add Asset</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
      )}

      {Object.entries(categorySummariesByCurrency).map(([currency, summaries]) => (
        <div key={currency} className="space-y-6">
          {Object.keys(portfolioTotalsByCurrency).length > 1 && (
            <h2 className="text-2xl font-semibold tracking-tight mt-6 border-b pb-2">Assets in {currency}</h2>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orderedCategories.map((category) => {
              const summary = summaries[category];
              if (!summary || summary.assetCount === 0) return null;
              
              const titleMap: Record<AssetCategory, string> = {
                crypto: "Crypto Holdings",
                stock: "Stock Investments",
                mutualfund: "Mutual Funds",
                bank: "Bank Accounts",
                property: "Property Value",
              };

              return (
                <Card key={`${category}-${currency}`} className="rounded-2xl shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">{titleMap[category]}</CardTitle>
                    {categoryIcons[category]}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalValue, currency)}</div>
                    {(category === 'stock' || category === 'crypto' || category === 'mutualfund') && summary.gainLossAmount !== undefined && summary.totalPurchaseCost !== undefined && (
                      <p className={`text-xs mt-1 ${summary.gainLossAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {summary.gainLossAmount >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <AlertTriangle className="inline h-4 w-4 mr-1"/>}
                        {formatCurrency(summary.gainLossAmount, currency)}
                        {(summary.gainLossPercent !== undefined && summary.gainLossPercent !== Infinity && summary.gainLossPercent !== -Infinity && summary.totalPurchaseCost > 0) 
                          ? ` (${summary.gainLossPercent.toFixed(2)}%)`
                          : (summary.totalPurchaseCost === 0 && summary.gainLossAmount !== 0 ? ` (N/A %)` : ` (0.00%)`)}
                        <span className="text-muted-foreground text-xs"> all-time</span>
                      </p>
                    )}
                     <p className="text-xs text-muted-foreground mt-1">{summary.assetCount} asset(s)</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/assets?category=${category}`} className="w-full">
                      <Button variant="outline" className="w-full text-xs sm:text-sm">
                        View All {categoryDisplayNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Overview</CardTitle>
            <PiggyBank className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {/* This is a placeholder; actual budget data would come from a BudgetContext */}
            <p className="text-sm">Monthly budget progress will be shown here.</p>
            <p className="text-xs text-muted-foreground pt-1">Detailed budget management is available on the Budgets page.</p>
          </CardContent>
           <CardFooter>
            <Link href="/budgets" className="w-full">
              <Button variant="outline" className="w-full">Manage Budgets</Button>
            </Link>
          </CardFooter>
        </Card>

        {goals.length > 0 && (
          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Goal Progress</CardTitle>
              {goalDisplayIcons[goals[0].icon || 'Default'] || goalDisplayIcons.Default}
            </CardHeader>
            <CardContent>
              <p className="text-md font-semibold">{goals[0].name}</p>
              <Progress value={(goals[0].currentAmount / goals[0].targetAmount) * 100} className="my-2 h-2" />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(goals[0].currentAmount, 'USD')} / {formatCurrency(goals[0].targetAmount, 'USD')}
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/goals" className="w-full">
                <Button variant="outline" className="w-full">View All Goals</Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {goals.length === 0 && (
           <Card className="rounded-2xl shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Financial Goals</CardTitle>
               <Target className="h-5 w-5 text-primary" />
             </CardHeader>
             <CardContent>
               <p className="text-sm">No goals set yet. Start planning your future!</p>
             </CardContent>
             <CardFooter>
               <Link href="/goals" className="w-full">
                 <Button variant="outline" className="w-full">Set a New Goal</Button>
               </Link>
             </CardFooter>
           </Card>
        )}

        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Savings Tip</CardTitle>
            <Image src="https://placehold.co/24x24.png" alt="AI Icon" width={24} height={24} data-ai-hint="robot lightbulb"/>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Review your streaming subscriptions. You could save $25/month!</p>
            <p className="text-xs text-muted-foreground pt-1">Actual AI insights based on your data are available on the Insights page.</p>
          </CardContent>
           <CardFooter>
            <Link href="/insights" className="w-full">
              <Button variant="outline" className="w-full">Get Personalized Insights</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
}

// Need to define categoryDisplayNames if it's used in CardFooter for View All button
const categoryDisplayNames: Record<AssetCategory, string> = {
  bank: "Bank Accounts",
  stock: "Stocks",
  crypto: "Cryptocurrencies",
  property: "Properties",
  mutualfund: "Mutual Funds",
};
