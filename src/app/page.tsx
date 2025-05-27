
'use client';

import React from 'react';
import type { AssetCategory } from "@/contexts/AssetContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bitcoin, Landmark, BarChartBig, WalletCards, TrendingUp, DollarSign, PiggyBank, Building2, AlertTriangle, Target, Plane, ShieldCheck, AreaChart, PieChart as PieChartIcon, Info } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { useAssets } from "@/contexts/AssetContext";
import { useGoals } from "@/contexts/GoalContext";
import { useTransactions, type Transaction } from "@/contexts/TransactionContext";
import type { Asset } from "@/contexts/AssetContext";
import type { Goal } from "@/contexts/GoalContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';


const categoryIcons: Record<AssetCategory | 'total' | 'allocation', React.ReactNode> = {
  crypto: <Bitcoin className="h-6 w-6 text-orange-500" />,
  stock: <BarChartBig className="h-6 w-6 text-green-500" />,
  mutualfund: <WalletCards className="h-6 w-6 text-indigo-500" />,
  bank: <Landmark className="h-6 w-6 text-blue-500" />,
  property: <Building2 className="h-6 w-6 text-purple-500" />,
  total: <DollarSign className="h-6 w-6 text-primary" />,
  allocation: <PieChartIcon className="h-6 w-6 text-teal-500" />
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

const PREDEFINED_COLORS = [
  'hsl(231, 48%, 48%)', // Primary Blue from light theme
  'hsl(261, 44%, 58%)', // Accent Purple from light theme
  'hsl(210, 30%, 56%)', // Chart-3 from light theme
  'hsl(35, 92%, 58%)',  // Orange
  'hsl(120, 70%, 40%)', // Green
  'hsl(190, 80%, 55%)', // Teal
  'hsl(0, 70%, 60%)',   // Reddish
  'hsl(45, 100%, 50%)', // Yellow
  'hsl(231, 30%, 68%)', // Chart-4 from light theme
  'hsl(261, 30%, 78%)', // Chart-5 from light theme
];

// Helper for pie chart label rendering
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  if (percent * 100 < 5) return null; // Don't render label for very small slices

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-medium">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function HomePage() {
  const { assets, getAssetMarketValue } = useAssets();
  const { goals } = useGoals(); 
  const { transactions, getTransactionsByMonth } = useTransactions();

  const formatCurrency = (value: number, currencyCode: string = "USD") => {
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
        bank: { totalValue: 0, assetCount: 0, totalPurchaseCost: 0, gainLossAmount: 0 }, 
        property: { totalValue: 0, assetCount: 0, totalPurchaseCost: 0, gainLossAmount: 0 }, 
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

  // Data for Monthly Expense Overview Pie Chart
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const currentYear = new Date().getFullYear();
  const monthlyTransactions = getTransactionsByMonth(currentYear, currentMonth);

  const monthlyExpensesByCategory = monthlyTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const tempMonthlyExpenseData = Object.entries(monthlyExpensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyExpensePieChartData = tempMonthlyExpenseData.map((item, index) => ({
    ...item,
    fill: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
  }));


  const totalMonthlyIncome = monthlyTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalMonthlyExpenses = monthlyTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Data for Asset Allocation Pie Chart
  const assetAllocationData: { name: string, value: number, currency?: string, fill?: string }[] = [];
  const aggregatedValuesByCat: Record<string, number> = {};
  const currenciesPresentInAllocation = new Set<string>();

  assets.forEach(asset => {
    const marketValue = getAssetMarketValue(asset);
    const categoryName = categoryDisplayNames[asset.category] || asset.category;
    aggregatedValuesByCat[categoryName] = (aggregatedValuesByCat[categoryName] || 0) + marketValue;
    currenciesPresentInAllocation.add(asset.currency);
  });

  let totalPortfolioValueForAllocation = 0;
  const tempAssetAllocationData = Object.entries(aggregatedValuesByCat)
    .map(([name, value]) => {
      totalPortfolioValueForAllocation += value;
      return { name, value };
    })
    .filter(item => item.value > 0) // Only include categories with value
    .sort((a,b) => b.value - a.value); 
  
  tempAssetAllocationData.forEach((item, index) => {
    assetAllocationData.push({
      ...item,
      fill: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
    });
  });


  const isMixedCurrencyAllocation = currenciesPresentInAllocation.size > 1;


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

      {/* Asset Allocation Pie Chart */}
      {assetAllocationData.length > 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg sm:text-xl">Asset Allocation</CardTitle>
            {categoryIcons['allocation']}
          </CardHeader>
          <CardContent>
            {isMixedCurrencyAllocation && (
              <div className="mb-2 text-xs text-muted-foreground flex items-center gap-1 p-2 bg-muted/50 rounded-md">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Note: This chart sums numerical values of assets in different currencies without conversion. For precise allocation with multiple currencies, consider a single currency view or future conversion features.</span>
              </div>
            )}
            <ChartContainer config={{}} className="aspect-video h-[250px] w-full sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}
                    formatter={(value: number, name: string) => {
                       const percentage = totalPortfolioValueForAllocation > 0 ? (value / totalPortfolioValueForAllocation) * 100 : 0;
                       // If mixed currencies, just show value. If single, format it.
                       const displayValue = currenciesPresentInAllocation.size > 1 
                                            ? value.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0}) 
                                            : formatCurrency(value, Array.from(currenciesPresentInAllocation)[0] || 'USD');
                       return [`${displayValue} (${percentage.toFixed(1)}%)`, name];
                    }}
                  />
                  <Pie
                    data={assetAllocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2}/>
                    ))}
                  </Pie>
                  <Legend 
                    iconSize={10} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{paddingTop: "10px"}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
             <p className="text-xs text-muted-foreground text-center pt-2">Showing allocation of total portfolio value by asset category.</p>
          </CardContent>
        </Card>
      )}


      {Object.entries(categorySummariesByCurrency).map(([currency, summaries]) => (
        <div key={currency} className="space-y-6">
          {Object.keys(portfolioTotalsByCurrency).length > 1 && (
            <h2 className="text-2xl font-semibold tracking-tight mt-6 border-b pb-2">Asset Summaries ({currency})</h2>
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
         {/* Monthly Overview Card */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Overview</CardTitle>
            <PieChartIcon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(totalMonthlyExpenses)}</p>
              </div>
            </div>
            {monthlyExpensePieChartData.length > 0 ? (
              <ChartContainer config={{}} className="aspect-square h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}
                      formatter={(value: number, name: string, props) => [`${formatCurrency(value)} (${((value / totalMonthlyExpenses) * 100).toFixed(1)}%)`, name]}
                    />
                    <Pie data={monthlyExpensePieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} labelLine={false}
                         label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 1.3; // Adjusted label radius
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            const showLabel = (percent*100) > 3; // Show label for slices > 3%
                            if(!showLabel) return null;
                            return (
                                <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px]">
                                    {name} ({(percent * 100).toFixed(0)}%)
                                </text>
                            );
                        }}
                    >
                      {monthlyExpensePieChartData.map((entry, index) => (
                        <Cell key={`cell-expense-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2}/>
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded this month to display chart.</p>
            )}
             <p className="text-xs text-muted-foreground pt-2">Showing data for the current month.</p>
          </CardContent>
           <CardFooter>
            <Link href="/transactions" className="w-full">
              <Button variant="outline" className="w-full">View All Transactions</Button>
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
        
        <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
                <PiggyBank className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <p className="text-sm">Your budget overview will appear here once set up.</p>
                <p className="text-xs text-muted-foreground pt-1">Detailed budget management is available on the Budgets page.</p>
            </CardContent>
            <CardFooter>
                <Link href="/budgets" className="w-full">
                    <Button variant="outline" className="w-full">Manage Budgets</Button>
                </Link>
            </CardFooter>
        </Card>
      </div>

    </div>
  );
}

const categoryDisplayNames: Record<AssetCategory | string, string> = {
  bank: "Bank Accounts",
  stock: "Stocks",
  crypto: "Cryptocurrencies",
  property: "Properties",
  mutualfund: "Mutual Funds",
};

