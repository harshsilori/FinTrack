
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/contexts/TransactionContext';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, isValid } from 'date-fns';
import { ChartContainer } from "@/components/ui/chart"; 
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon, Info, CalendarSearch, Download } from 'lucide-react';

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
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent * 100 < 3) return null; 

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

  const [reportStartDate, setReportStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportEndDate, setReportEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const formatCurrency = (value: number, currencyCode: string = "USD") => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const expensesByCategoryForPeriod = useMemo(() => {
    if (!reportStartDate || !reportEndDate) {
      return [];
    }
    const startDate = parseISO(reportStartDate);
    const endDate = parseISO(reportEndDate);

    if (!isValid(startDate) || !isValid(endDate) || endDate < startDate) {
        return []; 
    }
    
    const expensesInPeriod = transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return tx.type === 'expense' && isValid(txDate) && isWithinInterval(txDate, { start: startDate, end: endDate });
    });

    const aggregated = expensesInPeriod.reduce((acc, tx) => {
      if (!acc[tx.category]) {
        acc[tx.category] = { totalAmount: 0, currency: 'USD' }; 
      }
      acc[tx.category].totalAmount += tx.amount;
      return acc;
    }, {} as Record<string, { totalAmount: number, currency: string }>);

    return Object.entries(aggregated)
      .map(([category, data]) => ({
        name: category,
        value: data.totalAmount,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, reportStartDate, reportEndDate]);

  const totalExpensesForPeriod = useMemo(() => {
    return expensesByCategoryForPeriod.reduce((sum, item) => sum + item.value, 0);
  }, [expensesByCategoryForPeriod]);

  const pieChartDataForPeriod = useMemo(() => {
    return expensesByCategoryForPeriod.map((item, index) => ({
      ...item,
      fill: PREDEFINED_COLORS[index % PREDEFINED_COLORS.length],
    }));
  }, [expensesByCategoryForPeriod]);

  const formattedStartDate = reportStartDate && isValid(parseISO(reportStartDate)) ? format(parseISO(reportStartDate), 'MMM d, yyyy') : 'N/A';
  const formattedEndDate = reportEndDate && isValid(parseISO(reportEndDate)) ? format(parseISO(reportEndDate), 'MMM d, yyyy') : 'N/A';
  const reportPeriodTitle = (formattedStartDate !== 'N/A' && formattedEndDate !== 'N/A') 
    ? `${formattedStartDate} - ${formattedEndDate}` 
    : 'Current Month';

  const handleExportToCsv = () => {
    if (expensesByCategoryForPeriod.length === 0) {
      alert("No data to export for the selected period.");
      return;
    }

    const headers = ["Category", "Amount (USD)", "Percentage of Total"]; 
    const rows = expensesByCategoryForPeriod.map(item => {
      const percentage = totalExpensesForPeriod > 0 ? ((item.value / totalExpensesForPeriod) * 100).toFixed(1) + '%' : '0.0%';
      return [item.name, item.value.toFixed(2), percentage];
    });

    const totalRow = ["Total", totalExpensesForPeriod.toFixed(2), "100.0%"];
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n")
      + "\n" + totalRow.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filenameStartDate = reportStartDate && isValid(parseISO(reportStartDate)) ? format(parseISO(reportStartDate), 'yyyy-MM-dd') : 'start';
    const filenameEndDate = reportEndDate && isValid(parseISO(reportEndDate)) ? format(parseISO(reportEndDate), 'yyyy-MM-dd') : 'end';
    link.setAttribute("download", `spending_report_${filenameStartDate}_to_${filenameEndDate}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financial Reports</h1>
      </div>
        <p className="text-muted-foreground mt-1">
          Analyze your spending habits and financial trends.
        </p>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            Spending by Category 
            <CalendarSearch className="h-5 w-5 text-primary" />
          </CardTitle>
          <CardDescription className="mt-1">Select a date range to analyze your spending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end border p-3 sm:p-4 rounded-lg">
                <div>
                    <Label htmlFor="report-start-date" className="text-xs sm:text-sm">Start Date</Label>
                    <Input 
                        id="report-start-date" 
                        type="date" 
                        value={reportStartDate} 
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="text-sm" 
                    />
                </div>
                <div>
                    <Label htmlFor="report-end-date" className="text-xs sm:text-sm">End Date</Label>
                    <Input 
                        id="report-end-date" 
                        type="date" 
                        value={reportEndDate} 
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="text-sm"
                    />
                </div>
            </div>
            <div className="text-center font-medium text-primary pt-2 text-sm sm:text-base">
                Report for: {reportPeriodTitle}
            </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-2 p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Expense Breakdown: {reportPeriodTitle}</CardTitle>
           <Button onClick={handleExportToCsv} variant="outline" size="sm" disabled={expensesByCategoryForPeriod.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          {expensesByCategoryForPeriod.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 items-start">
              <div className="w-full">
                <ChartContainer config={{}} className="aspect-square h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}
                        formatter={(value: number, name: string) => {
                           const percentage = totalExpensesForPeriod > 0 ? (value / totalExpensesForPeriod) * 100 : 0;
                           return [`${formatCurrency(value)} (${percentage.toFixed(1)}%)`, name];
                        }}
                      />
                      <Pie
                        data={pieChartDataForPeriod}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70} 
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieChartDataForPeriod.map((entry, index) => (
                          <Cell key={`cell-report-${index}`} fill={entry.fill ?? '#000000'} stroke="hsl(var(--background))" strokeWidth={2}/>
                        ))}
                      </Pie>
                      <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: "10px", fontSize: "0.7rem"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="overflow-x-auto">
                <h3 className="text-md sm:text-lg font-semibold mb-2">Expense Summary</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Category</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesByCategoryForPeriod.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(item.value)}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {totalExpensesForPeriod > 0 ? ((item.value / totalExpensesForPeriod) * 100).toFixed(1) : '0.0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell className="text-xs sm:text-sm">Total Expenses</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(totalExpensesForPeriod)}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 px-4">
              <Info className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-semibold">No expenses recorded for the selected period.</p>
              <p>Try adjusting the date range or add some transactions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    