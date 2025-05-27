
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Edit3, Trash2, PiggyBank } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTransactions, type Transaction } from '@/contexts/TransactionContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

interface Budget {
  id: string;
  name: string;
  amount: number;
  // spent: number; // Removed: This will be calculated
  category: string;
  period: 'monthly' | 'bi-weekly' | 'weekly' | 'custom';
  customPeriodDetails?: string; // e.g., "Jan 1 - Jan 15"
}

const budgetPeriods = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-weekly', label: 'Bi-Weekly (Manual Tracking)' }, // Updated label
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom (Manual Tracking)' }, // Updated label
];

const budgetCategories = ['Groceries', 'Dining Out', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other'];

const BudgetCard = ({ 
  budget, 
  onEdit, 
  onDelete,
  transactions
}: { 
  budget: Budget; 
  onEdit: (budget: Budget) => void; 
  onDelete: (id: string) => void;
  transactions: Transaction[];
}) => {
  
  const [calculatedSpent, setCalculatedSpent] = useState(0);
  const [isComplexPeriod, setIsComplexPeriod] = useState(false);

  useEffect(() => {
    let spent = 0;
    const today = new Date();
    let interval: Interval | null = null;

    if (budget.period === 'monthly') {
      interval = { start: startOfMonth(today), end: endOfMonth(today) };
    } else if (budget.period === 'weekly') {
      interval = { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) }; // Assuming week starts on Monday
    } else {
      // For bi-weekly and custom, we currently don't have enough info for auto-calculation
      setIsComplexPeriod(true);
      // If you had a 'spent' field previously and want to show it as a fallback:
      // spent = budget.spent || 0; // budget.spent doesn't exist anymore. Default to 0 or handle differently.
      setCalculatedSpent(0); // Or a placeholder like -1 to indicate manual tracking
      return;
    }
    setIsComplexPeriod(false);

    if (interval) {
      const relevantTransactions = transactions.filter(tx => {
        const txDate = parseISO(tx.date); // Assuming tx.date is 'YYYY-MM-DD'
        return tx.type === 'expense' && 
               tx.category === budget.category && 
               isWithinInterval(txDate, interval!);
      });
      spent = relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }
    setCalculatedSpent(spent);
  }, [budget, transactions]);

  const spentPercentage = budget.amount > 0 ? Math.min((calculatedSpent / budget.amount) * 100, 100) : 0;
  
  const getProgressColor = (percentage: number) => {
    if (isComplexPeriod) return 'bg-gray-400'; // Indicate manual tracking
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  return (
    <Card key={budget.id} className="rounded-2xl shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{budget.name}</CardTitle>
            <CardDescription className="capitalize">{budget.category} - {budgetPeriods.find(p=>p.value === budget.period)?.label} {budget.period === 'custom' && budget.customPeriodDetails ? `(${budget.customPeriodDetails})` : ''}</CardDescription>
          </div>
          <PiggyBank className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {isComplexPeriod ? (
          <p className="text-sm text-muted-foreground">Manual tracking needed for spent amount in this period.</p>
        ) : (
          <>
            <div className="flex justify-between items-baseline">
              <p className="text-2xl font-semibold">{formatCurrency(calculatedSpent)}</p>
              <p className="text-sm text-muted-foreground">of {formatCurrency(budget.amount)}</p>
            </div>
            <Progress value={spentPercentage} className="h-3 rounded-lg" indicatorClassName={getProgressColor(spentPercentage)} />
            <p className="text-xs text-muted-foreground text-right">{spentPercentage.toFixed(0)}% spent</p>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(budget)} aria-label="Edit budget">
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(budget.id)} aria-label="Delete budget">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
};
BudgetCard.displayName = 'BudgetCard';


export default function BudgetsPage() {
  const { toast } = useToast();
  const { transactions } = useTransactions(); // Get transactions from context

  const [budgets, setBudgets] = useState<Budget[]>([
    { id: '1', name: 'Monthly Groceries', amount: 400, category: 'Groceries', period: 'monthly' },
    { id: '2', name: 'Entertainment Fund', amount: 200, category: 'Entertainment', period: 'monthly' },
    { id: '3', name: 'Weekly Transport', amount: 100, category: 'Transport', period: 'weekly' },
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<Partial<Budget> | null>(null);

  const openForm = (budget?: Budget) => {
    setCurrentBudget(budget || { name: '', amount: 0, category: budgetCategories[0], period: 'monthly' });
    setIsFormOpen(true);
  };

  const handleSaveBudget = () => {
    if (!currentBudget || !currentBudget.name || !currentBudget.category || currentBudget.amount == null || currentBudget.amount <= 0) {
      toast({ title: "Error", description: "Please fill all budget details correctly. Amount must be greater than zero.", variant: "destructive"});
      return;
    }
    if (currentBudget.period === 'custom' && !currentBudget.customPeriodDetails) {
       toast({ title: "Error", description: "Please provide details for the custom period.", variant: "destructive"});
      return;
    }

    // Remove 'spent' from the budget object being saved
    const { ...budgetDataToSave } = currentBudget;


    if (budgetDataToSave.id) {
      setBudgets(budgets.map(b => b.id === budgetDataToSave.id ? budgetDataToSave as Budget : b));
      toast({ title: "Budget Updated", description: `${budgetDataToSave.name} has been updated.`});
    } else {
      const newBudget = { ...budgetDataToSave, id: Date.now().toString() } as Budget;
      setBudgets([...budgets, newBudget]);
      toast({ title: "Budget Added", description: `${newBudget.name} has been added.`});
    }
    setIsFormOpen(false);
    setCurrentBudget(null);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
    toast({ title: "Budget Deleted", description: `Budget has been removed.`, variant: "destructive"});
  };
  

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Manager</h1>
          <p className="text-muted-foreground">
            Create and track your spending budgets. Spent amounts for monthly/weekly budgets are automatically calculated from your transactions.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setCurrentBudget(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{currentBudget?.id ? 'Edit Budget' : 'Add New Budget'}</DialogTitle>
              <DialogDescription>
                Enter the details for your budget. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={currentBudget?.name || ''} onChange={(e) => setCurrentBudget(prev => ({...prev, name: e.target.value }))} className="col-span-3" placeholder="e.g., Monthly Groceries"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" type="number" value={currentBudget?.amount || ''} onChange={(e) => setCurrentBudget(prev => ({...prev, amount: parseFloat(e.target.value) || 0 }))} className="col-span-3" placeholder="e.g., 500"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={currentBudget?.category || ''} onValueChange={(value) => setCurrentBudget(prev => ({...prev, category: value}))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="period" className="text-right">Period</Label>
                <Select value={currentBudget?.period || 'monthly'} onValueChange={(value: Budget['period']) => setCurrentBudget(prev => ({...prev, period: value}))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetPeriods.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {currentBudget?.period === 'custom' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="customPeriodDetails" className="text-right">Details</Label>
                   <Input id="customPeriodDetails" value={currentBudget?.customPeriodDetails || ''} onChange={(e) => setCurrentBudget(prev => ({...prev, customPeriodDetails: e.target.value }))} className="col-span-3" placeholder="e.g., Summer Vacation Trip"/>
                 </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSaveBudget}>Save Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {budgets.length === 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <PiggyBank className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-semibold">No budgets yet!</p>
              <p>Click "Add New Budget" to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
           <BudgetCard 
             key={budget.id} 
             budget={budget} 
             onEdit={openForm} 
             onDelete={handleDeleteBudget}
             transactions={transactions} 
            />
        ))}
      </div>
    </div>
  );
}
