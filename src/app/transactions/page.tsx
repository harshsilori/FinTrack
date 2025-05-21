'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
}

const initialTransaction: Omit<Transaction, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: '',
  type: 'expense',
  category: '',
};

export default function TransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([
    { ...initialTransaction, id: Date.now().toString() },
  ]);

  const handleInputChange = (id: string, field: keyof Omit<Transaction, 'id'>, value: string) => {
    setTransactions(
      transactions.map((tx) =>
        tx.id === id ? { ...tx, [field]: value } : tx
      )
    );
  };
  
  const handleTypeChange = (id: string, value: 'income' | 'expense') => {
    setTransactions(
      transactions.map((tx) =>
        tx.id === id ? { ...tx, type: value } : tx
      )
    );
  };

  const addTransactionRow = () => {
    setTransactions([
      ...transactions,
      { ...initialTransaction, id: (Date.now() + transactions.length).toString() },
    ]);
  };

  const removeTransactionRow = (id: string) => {
    if (transactions.length > 1) {
      setTransactions(transactions.filter((tx) => tx.id !== id));
    } else {
      toast({
        title: "Cannot remove last row",
        description: "At least one transaction row is required.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAll = () => {
    // Basic validation
    const isValid = transactions.every(tx => tx.description && tx.amount && parseFloat(tx.amount) > 0 && tx.date && tx.category);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields correctly for all transactions.",
        variant: "destructive",
      });
      return;
    }
    console.log('Saving transactions:', transactions);
    toast({
      title: "Transactions Saved",
      description: `${transactions.length} transaction(s) have been saved successfully.`,
    });
    // Reset to one empty row after saving
    setTransactions([{ ...initialTransaction, id: Date.now().toString() }]);
  };
  
  const categories = ['Groceries', 'Utilities', 'Salary', 'Entertainment', 'Transport', 'Healthcare', 'Other'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Transaction Entry</h1>
        <p className="text-muted-foreground">
          Add multiple transactions quickly.
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>New Transactions</CardTitle>
          <CardDescription>Enter details for each transaction below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.map((tx, index) => (
            <div key={tx.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border rounded-lg shadow-sm bg-card">
              <div className="md:col-span-2">
                <Label htmlFor={`date-${tx.id}`}>Date</Label>
                <Input
                  id={`date-${tx.id}`}
                  type="date"
                  value={tx.date}
                  onChange={(e) => handleInputChange(tx.id, 'date', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor={`description-${tx.id}`}>Description</Label>
                <Input
                  id={`description-${tx.id}`}
                  placeholder="e.g., Coffee"
                  value={tx.description}
                  onChange={(e) => handleInputChange(tx.id, 'description', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`amount-${tx.id}`}>Amount</Label>
                <Input
                  id={`amount-${tx.id}`}
                  type="number"
                  placeholder="0.00"
                  value={tx.amount}
                  onChange={(e) => handleInputChange(tx.id, 'amount', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`type-${tx.id}`}>Type</Label>
                <Select
                  value={tx.type}
                  onValueChange={(value: 'income' | 'expense') => handleTypeChange(tx.id, value)}
                >
                  <SelectTrigger id={`type-${tx.id}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`category-${tx.id}`}>Category</Label>
                 <Select
                  value={tx.category}
                  onValueChange={(value) => handleInputChange(tx.id, 'category', value)}
                >
                  <SelectTrigger id={`category-${tx.id}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1 flex items-end justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTransactionRow(tx.id)}
                  aria-label="Remove transaction"
                  disabled={transactions.length <= 1}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addTransactionRow} className="mt-4 w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Another Transaction
          </Button>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAll} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save All Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
