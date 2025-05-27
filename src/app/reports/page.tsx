
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactions } from '@/contexts/TransactionContext';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon, Info } from 'lucide-react';

// Using the same predefined colors from the dashboard for consistency
const PREDEFINED_COLORS = [
  'hsl(231, 48%, 48%)', // Primary Blue
  'hsl(261, 44%, 58%)', // Accent Purple
  'hsl(210, 30%, 56%)', // Muted Blue/Gray
  'hsl(35, 92%, 58%)',  // Orange
  'hsl(120, 70%, 40%)', // Green
  'hsl(190, 80%, 55%)', // Teal
  'hsl(0, 70%, 60%)',   // Reddish
  'hsl(45, 100%, 50%)', // Yellow
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent * 100 < 3) return null; // Don't render label for very small slices

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-medium">
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export default function ReportsPage() {
  const { transactions } = useTransactions();

  const formatCurrency = (value: number, currencyCode: string = "USD") => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const currentMonthExpensesByCategory = useMemo(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    const expensesThisMonth = transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return tx.type === 'expense' && isWithinInterval(txDate, { start: currentMonthStart, end: currentMonthEnd });
    });

    const aggregated = expensesThisMonth.reduce((acc, tx) => {
      if (!acc[tx.category]) {
        acc[tx.category] = { totalAmount: 0, currency: 'USD' }; // Assuming a default currency for reports or detecting it
      }
      acc[tx.category].totalAmount += tx.amount;
      // For simplicity, report chart will assume a single currency or sum raw values.
      // A more robust solution would handle multi-currency aggregation.
      return acc;
    }, {} as Record<string, { totalAmount: number, currency: string }>);

    return Object.entries(aggregated)
      .map(([category, data]) => ({
        name: category,
        value: data.totalAmount,
        // currency: data.currency // Could be used if we report per currency
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalCurrentMonthExpenses = useMemo(() => {
    return currentMonthExpensesByCategory.reduce((sum, item) => sum + item.value, 0);
  }, [currentMonthExpensesByCategory]);

  const pieChartData = useMemo(() => {
    return currentMonthExpensesByCategory.map((item, index) => ({
      ...item,
      fill: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
    }));
  }, [currentMonthExpensesByCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Analyze your spending habits and financial trends.
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Spending by Category - Current Month</CardTitle>
          <PieChartIcon className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          {currentMonthExpensesByCategory.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <ChartContainer config={{}} className="aspect-square h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}
                        formatter={(value: number, name: string) => {
                           const percentage = totalCurrentMonthExpenses > 0 ? (value / totalCurrentMonthExpenses) * 100 : 0;
                           return [`${formatCurrency(value)} (${percentage.toFixed(1)}%)`, name];
                        }}
                      />
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-report-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2}/>
                        ))}
                      </Pie>
                      <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: "15px"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Expense Summary</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMonthExpensesByCategory.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                        <TableCell className="text-right">
                          {totalCurrentMonthExpenses > 0 ? ((item.value / totalCurrentMonthExpenses) * 100).toFixed(1) : '0.0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCurrentMonthExpenses)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Info className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-semibold">No expenses recorded this month.</p>
              <p>Add some transactions to see your spending breakdown.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for future reports */}
      {/* 
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Income vs. Expense Trend (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">A line or bar chart showing your income and expenses over time will appear here.</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Net Worth Trend (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">A chart showing how your net worth changes over time will appear here.</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}
