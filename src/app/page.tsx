
'use client';

import React from 'react';
import type { AssetCategory } from "@/contexts/AssetContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bitcoin, Landmark, BarChartBig, WalletCards, TrendingUp, DollarSign, PiggyBank, Building2, AlertTriangle, Target, Plane, ShieldCheck, Home, Car, Gift, AreaChart, PieChart as PieChartIcon, Info, ExternalLink } from "lucide-react"; 
import Link from "next/link";
import Image from 'next/image';
import { useAssets } from "@/contexts/AssetContext"; 
import { useGoals, type Goal } from "@/contexts/GoalContext"; 
import { useTransactions } from "@/contexts/TransactionContext";
import { motion } from 'framer-motion';
import { ChartContainer } from "@/components/ui/chart"; 
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';


const categoryIcons: Record<AssetCategory | 'total' | 'allocation', React.ReactNode> = {
  crypto: <Bitcoin className="h-5 w-5 text-orange-500" />,
  stock: <BarChartBig className="h-5 w-5 text-green-500" />,
  mutualfund: <WalletCards className="h-5 w-5 text-indigo-500" />,
  bank: <Landmark className="h-5 w-5 text-blue-500" />,
  property: <Building2 className="h-5 w-5 text-purple-500" />,
  total: <DollarSign className="h-5 w-5 text-primary" />,
  allocation: <PieChartIcon className="h-5 w-5 text-teal-500" />
};

const goalDisplayIcons: Record<string, React.ReactNode> = {
  Target: <Target className="h-5 w-5 text-primary" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5 text-green-500" />,
  Plane: <Plane className="h-5 w-5 text-blue-500" />,
  Home: <Home className="h-5 w-5 text-orange-500" />,
  Car: <Car className="h-5 w-5 text-purple-500" />,
  Gift: <Gift className="h-5 w-5 text-pink-500" />,
  Default: <Target className="h-5 w-5 text-gray-500" />,
};


interface CategorySummary {
  totalValue: number;
  totalPurchaseCost?: number;
  gainLossAmount?: number;
  gainLossPercent?: number;
  assetCount: number;
}

const PREDEFINED_COLORS = [
  'hsl(231, 48%, 48%)', 
  'hsl(261, 44%, 58%)', 
  'hsl(210, 30%, 56%)', 
  'hsl(35, 92%, 58%)',  
  'hsl(120, 70%, 40%)', 
  'hsl(190, 80%, 55%)', 
  'hsl(0, 70%, 60%)',   
  'hsl(45, 100%, 50%)', 
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  if (percent * 100 < 5) return null; 

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[8px] xs:text-[10px] font-medium">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export default function HomePage() {
  const { assets } = useAssets();
  const { goals } = useGoals(); 
  const { transactions, getTransactionsByMonth } = useTransactions();

  const formatCurrency = (value: number, currencyCode: string = "USD") => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const portfolioTotalsByCurrency: Record<string, number> = {};
  assets.forEach(asset => {
    const marketValue = (asset.category === 'bank' || asset.category === 'property')
      ? asset.currentPrice
      : asset.currentPrice * (asset.quantity || 0);
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
    const marketValue = (asset.category === 'bank' || asset.category === 'property')
      ? asset.currentPrice
      : asset.currentPrice * (asset.quantity || 0);
    
    summary.totalValue += marketValue;
    summary.assetCount += 1;

    if ((asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund') && asset.purchasePrice !== undefined && (asset.quantity !== undefined && asset.quantity !== null)) {
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

  const currentMonth = new Date().getMonth() + 1; 
  const currentYear = new Date().getFullYear();
  const monthlyTransactions = getTransactionsByMonth(currentYear, currentMonth);

  const monthlyExpensesByCategory = monthlyTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const tempMonthlyExpenseData = Object.entries(monthlyExpensesByCategory)
    .map(([name, value], index) => ({ 
        name, 
        value,
        fill: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length] 
    }))
    .sort((a, b) => b.value - a.value);

  const monthlyExpensePieChartData = tempMonthlyExpenseData;


  const totalMonthlyIncome = monthlyTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalMonthlyExpenses = monthlyTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const assetAllocationData: { name: string, value: number, currency?: string, fill?: string }[] = [];
  const aggregatedValuesByCat: Record<string, number> = {};
  const currenciesPresentInAllocation = new Set<string>();

  assets.forEach(asset => {
    const marketValue = (asset.category === 'bank' || asset.category === 'property')
      ? asset.currentPrice
      : asset.currentPrice * (asset.quantity || 0);
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
    .filter(item => item.value > 0) 
    .sort((a,b) => b.value - a.value); 
  
  tempAssetAllocationData.forEach((item, index) => {
    assetAllocationData.push({
      ...item,
      fill: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
    });
  });

  const isMixedCurrencyAllocation = currenciesPresentInAllocation.size > 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Your financial overview. Prices are manually entered.
          </p>
        </div>
         <Link href="/transactions" passHref className="w-full sm:w-auto mt-2 sm:mt-0">
           <Button className="w-full sm:w-auto text-xs sm:text-sm">
             <DollarSign className="mr-2 h-4 w-4" /> Add Transaction
           </Button>
        </Link>
      </div>

      {Object.keys(portfolioTotalsByCurrency).length > 0 ? (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base md:text-lg">Total Net Worth</CardTitle>
            {categoryIcons['total']}
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {Object.entries(portfolioTotalsByCurrency).map(([currency, total]) => (
              <div key={currency} className="text-lg xs:text-xl sm:text-2xl font-bold text-primary mb-1">
                {formatCurrency(total, currency)}
                <span className="text-xs text-muted-foreground ml-1">({currency})</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Calculated from manually entered current asset values.</p>
          </CardContent>
        </Card>
      ) : (
         <Card className="rounded-2xl shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center text-muted-foreground p-4">
                <WalletCards className="mx-auto h-10 w-10 mb-4 text-primary" />
                <p className="text-md sm:text-lg font-semibold">Welcome to FinTrack!</p>
                <p className="text-xs sm:text-sm">Start by adding an asset to see your financial dashboard populate.</p>
                <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
                    <Link href="/assets" passHref>
                        <Button className="w-full sm:w-auto text-xs sm:text-sm"><WalletCards className="mr-2 h-4 w-4"/> Add Asset</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
      )}

      {assetAllocationData.length > 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base md:text-lg">Asset Allocation</CardTitle>
            {categoryIcons['allocation']}
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {isMixedCurrencyAllocation && (
              <div className="mb-2 text-xs text-muted-foreground flex items-start gap-1 p-2 bg-muted/50 rounded-md">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Note: This chart sums numerical values of assets in different currencies without conversion.</span>
              </div>
            )}
            <ChartContainer config={{}} className="aspect-video h-[180px] xs:h-[200px] sm:h-[220px] md:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, bottom: 15, left: 5 }}>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}
                    formatter={(value: number, name: string) => {
                       const percentage = totalPortfolioValueForAllocation > 0 ? (value / totalPortfolioValueForAllocation) * 100 : 0;
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
                    outerRadius={50} // Smaller base radius
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-allocation-${index}`} fill={entry.fill!} stroke="hsl(var(--background))" strokeWidth={1}/>
                    ))}
                  </Pie>
                  <Legend 
                    iconSize={8} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{paddingTop: "5px", fontSize: "0.65rem"}} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
             <p className="text-xs text-muted-foreground text-center pt-1">Showing allocation of total portfolio value by asset category.</p>
          </CardContent>
        </Card>
      )}


      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categorySummariesByCurrency).map(([currency, summaries]) => (
          <React.Fragment key={`${currency}-fragment`}>
            {Object.keys(portfolioTotalsByCurrency).length > 1 && (
              <h2 key={`${currency}-header`} className="text-sm sm:text-base font-semibold tracking-tight mt-3 sm:mt-4 border-b pb-1 col-span-1 sm:col-span-2 lg:col-span-3">Asset Summaries ({currency})</h2>
            )}
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
                <motion.div
                  key={`${category}-${currency}`}
                  className="h-full"
                  whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
                  whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                >
                  <Card className="rounded-2xl shadow-lg h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium">{titleMap[category]}</CardTitle>
                      {React.cloneElement(categoryIcons[category] as React.ReactElement, { className: "h-4 w-4" })}
                    </CardHeader>
                    <CardContent className="flex-grow p-3 sm:p-4 pt-0">
                      <div className="text-md sm:text-lg font-bold">{formatCurrency(summary.totalValue, currency)}</div>
                      {(category === 'stock' || category === 'crypto' || category === 'mutualfund') && summary.gainLossAmount !== undefined && summary.totalPurchaseCost !== undefined && (
                        <p className={`text-xs mt-0.5 ${summary.gainLossAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {summary.gainLossAmount >= 0 ? <TrendingUp className="inline h-3 w-3 mr-0.5"/> : <AlertTriangle className="inline h-3 w-3 mr-0.5"/>}
                          {formatCurrency(summary.gainLossAmount, currency)}
                          {(summary.gainLossPercent !== undefined && summary.gainLossPercent !== Infinity && summary.gainLossPercent !== -Infinity && summary.totalPurchaseCost > 0) 
                            ? ` (${summary.gainLossPercent.toFixed(2)}%)`
                            : (summary.totalPurchaseCost === 0 && summary.gainLossAmount !== 0 ? ` (N/A %)` : ` (0.00%)`)}
                          <span className="text-muted-foreground text-xs"> all-time</span>
                        </p>
                      )}
                        <p className="text-xs text-muted-foreground mt-0.5">{summary.assetCount} asset(s)</p>
                    </CardContent>
                    <CardFooter className="p-3 sm:p-4 pt-0">
                      <Link href={`/assets?category=${category}`} className="w-full">
                        <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">
                          View All {categoryDisplayNames[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
        <motion.div
          className="h-full"
          whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
          whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
        >
          <Card className="rounded-2xl shadow-lg h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-medium">This Month's Overview</CardTitle>
              <PieChartIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="flex-grow p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total Income</p>
                  <p className="text-sm sm:text-md font-semibold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-sm sm:text-md font-semibold text-red-600">{formatCurrency(totalMonthlyExpenses)}</p>
                </div>
              </div>
              {monthlyExpensePieChartData.length > 0 ? (
                <ChartContainer config={{}} className="aspect-square h-[150px] xs:h-[160px] sm:h-[180px] md:h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}
                        formatter={(value: number, name: string, props) => [`${formatCurrency(value)} (${((value / totalMonthlyExpenses) * 100).toFixed(1)}%)`, name]}
                      />
                      <Pie data={monthlyExpensePieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} smOuterRadius={50} labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 1.4; 
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              const showLabel = (percent*100) > 5; 
                              if(!showLabel) return null;
                              return (
                                  <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[8px] sm:text-[9px]">
                                      {name} ({(percent * 100).toFixed(0)}%)
                                  </text>
                              );
                          }}
                      >
                        {monthlyExpensePieChartData.map((entry, index) => (
                          <Cell key={`cell-expense-${index}`} fill={entry.fill!} stroke="hsl(var(--background))" strokeWidth={1}/>
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">No expenses recorded this month to display chart.</p>
              )}
              <p className="text-xs text-muted-foreground pt-1 text-center">Showing data for the current month.</p>
            </CardContent>
            <CardFooter className="p-3 sm:p-4 pt-0">
              <Link href="/transactions" className="w-full">
                <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">View All Transactions</Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>


        {goals.length > 0 && (
              <motion.div
                className="h-full"
                whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
                whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
              >
                <Card className="rounded-2xl shadow-lg h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base font-medium">Top Goal Progress</CardTitle>
                    {React.cloneElement(goalDisplayIcons[goals[0].icon || 'Default'] || goalDisplayIcons.Default, {className: "h-4 w-4"})}
                  </CardHeader>
                  <CardContent className="flex-grow p-3 sm:p-4 pt-0">
                    <p className="text-sm font-semibold">{goals[0].name}</p>
                    <Progress value={(goals[0].targetAmount > 0 ? (goals[0].currentAmount / goals[0].targetAmount) * 100 : 0)} className="my-1.5 h-1.5 sm:h-2" />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(goals[0].currentAmount, 'USD')} / {formatCurrency(goals[0].targetAmount, 'USD')}
                    </p>
                  </CardContent>
                  <CardFooter className="p-3 sm:p-4 pt-0">
                    <Link href="/goals" className="w-full">
                      <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">View All Goals</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
        )}

        {goals.length === 0 && (
          <motion.div
            className="h-full"
            whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
            whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
          >
            <Card className="rounded-2xl shadow-lg h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base font-medium">Financial Goals</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="flex-grow p-3 sm:p-4 pt-0">
                <p className="text-xs sm:text-sm">No goals set yet. Start planning your future!</p>
              </CardContent>
              <CardFooter className="p-3 sm:p-4 pt-0">
                <Link href="/goals" className="w-full">
                  <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">Set a New Goal</Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        )}
        <motion.div
          className="h-full"
          whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
          whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
        >
          <Card className="rounded-2xl shadow-lg h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base font-medium">Budget Health</CardTitle>
                  <PiggyBank className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="flex-grow p-3 sm:p-4 pt-0">
                  <p className="text-xs sm:text-sm">Your budget overview will appear here once set up.</p>
                  <p className="text-xs text-muted-foreground pt-0.5">Detailed budget management is available on the Budgets page.</p>
              </CardContent>
              <CardFooter className="p-3 sm:p-4 pt-0">
                  <Link href="/budgets" className="w-full">
                      <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">Manage Budgets</Button>
                  </Link>
              </CardFooter>
          </Card>
        </motion.div>
        <motion.div
          className="h-full"
          whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
          whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
        >
          <Card className="rounded-2xl shadow-lg h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-medium">Debt Overview</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="flex-grow p-3 sm:p-4 pt-0">
              <p className="text-xs sm:text-sm">Track your liabilities and progress towards becoming debt-free.</p>
              <p className="text-xs text-muted-foreground pt-0.5">Detailed debt management is available on the Debts page.</p>
            </CardContent>
            <CardFooter className="p-3 sm:p-4 pt-0">
              <Link href="/debts" className="w-full">
                <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">Manage Debts</Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div
          className="h-full md:col-span-2 lg:col-span-1"
          whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
          whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
        >
          <Card className="rounded-2xl shadow-lg h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base font-medium">AI Savings Tip</CardTitle>
              <Image src="https://placehold.co/24x24.png" alt="AI Icon" width={20} height={20} data-ai-hint="robot lightbulb" className="h-5 w-5"/>
            </CardHeader>
            <CardContent className="flex-grow p-3 sm:p-4 pt-0">
              <p className="text-xs sm:text-sm">Review your streaming subscriptions. You could save $25/month!</p>
              <p className="text-xs text-muted-foreground pt-0.5">Actual AI insights based on your data are available on the Insights page.</p>
            </CardContent>
            <CardFooter className="p-3 sm:p-4 pt-0">
              <Link href="/insights" className="w-full">
                <Button variant="outline" className="w-full text-xs px-2 py-1 h-8">Get Personalized Insights</Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
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
    
