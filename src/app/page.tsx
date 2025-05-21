
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, DollarSign, TrendingUp, PlusCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import Link from "next/link";
import Image from 'next/image';

const cashFlowData = [
  { month: "Jan", income: 4000, expenses: 2400 },
  { month: "Feb", income: 3000, expenses: 1398 },
  { month: "Mar", income: 2000, expenses: 3800 },
  { month: "Apr", income: 2780, expenses: 1908 },
  { month: "May", income: 1890, expenses: 2800 },
  { month: "Jun", income: 2390, expenses: 1800 },
];

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
};

const budgets = [
  { name: "Groceries", spent: 250, total: 400, color: "bg-sky-500" },
  { name: "Dining Out", spent: 150, total: 200, color: "bg-amber-500" },
  { name: "Transport", spent: 80, total: 100, color: "bg-lime-500" },
  { name: "Entertainment", spent: 180, total: 250, color: "bg-rose-500" },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <Link href="/transactions" passHref>
           <Button>
             <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
           </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$125,345.78</div>
            <p className="text-xs text-muted-foreground pt-1">
              +5.2% from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/assets" className="w-full">
              <Button variant="outline" className="w-full">View Assets</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground pt-1">
              Across all accounts
            </p>
          </CardContent>
           <CardFooter>
             <Link href="/assets" className="w-full">
              <Button variant="outline" className="w-full">Manage Accounts</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Savings Tip</CardTitle>
            <Image src="https://placehold.co/24x24.png" alt="AI Icon" width={24} height={24} data-ai-hint="robot lightbulb" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">Review your streaming subscriptions. You could save $25/month!</p>
          </CardContent>
           <CardFooter>
            <Link href="/insights" className="w-full">
              <Button variant="outline" className="w-full">Get More Insights</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Income vs Expenses - Last 6 Months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[350px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={20}/>
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} barSize={20}/>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>Your spending against monthly budgets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{budget.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ${budget.spent} / ${budget.total}
                  </span>
                </div>
                <Progress value={(budget.spent / budget.total) * 100} className="h-3 rounded-lg" indicatorClassName={budget.color} />
              </div>
            ))}
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
