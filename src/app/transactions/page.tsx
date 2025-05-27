
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, Upload, Camera, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTransactions, type Transaction } from '@/contexts/TransactionContext'; // Import from context
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface FormTransaction {
  id: string; // For form row key
  date: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
}

const initialFormTransactionRow: Omit<FormTransaction, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: '',
  type: 'expense',
  category: '',
};

export default function TransactionsPage() {
  const { toast } = useToast();
  const { transactions: savedTransactions, addTransactionBatch, deleteTransaction } = useTransactions();
  
  const [formTransactions, setFormTransactions] = useState<FormTransaction[]>([
    { ...initialFormTransactionRow, id: Date.now().toString() },
  ]);

  const categories = useMemo(() => ['Groceries', 'Utilities', 'Salary', 'Entertainment', 'Transport', 'Healthcare', 'Education', 'Dining Out', 'Shopping', 'Rent/Mortgage', 'Investment', 'Gifts', 'Other'], []);

  const handleInputChange = (id: string, field: keyof Omit<FormTransaction, 'id' | 'type'>, value: string) => {
    setFormTransactions(
      formTransactions.map((tx) =>
        tx.id === id ? { ...tx, [field]: value } : tx
      )
    );
  };
  
  const handleTypeChange = (id: string, value: 'income' | 'expense') => {
    setFormTransactions(
      formTransactions.map((tx) =>
        tx.id === id ? { ...tx, type: value, category: tx.type === value ? tx.category : '' } : tx // Reset category if type changes, for simplicity
      )
    );
  };

  const addTransactionRow = () => {
    setFormTransactions([
      ...formTransactions,
      { ...initialFormTransactionRow, id: (Date.now() + formTransactions.length).toString() },
    ]);
  };

  const removeTransactionRow = (id: string) => {
    if (formTransactions.length > 1) {
      setFormTransactions(formTransactions.filter((tx) => tx.id !== id));
    } else {
      toast({
        title: "Cannot remove last row",
        description: "At least one transaction row is required for batch entry.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAll = () => {
    const validTransactionsToSave: Omit<Transaction, 'id'>[] = [];
    let hasError = false;

    for (const tx of formTransactions) {
      if (!tx.description || !tx.amount || !tx.date || !tx.category) {
        hasError = true;
        break;
      }
      const amount = parseFloat(tx.amount);
      if (isNaN(amount) || amount <= 0) {
        hasError = true;
        break;
      }
      validTransactionsToSave.push({
        date: tx.date,
        description: tx.description,
        amount: amount,
        type: tx.type,
        category: tx.category,
      });
    }

    if (hasError) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields correctly. Amount must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    if (validTransactionsToSave.length === 0) {
        toast({
            title: "No Transactions to Save",
            description: "Please enter some transaction details.",
            variant: "default",
        });
        return;
    }

    addTransactionBatch(validTransactionsToSave);
    toast({
      title: "Transactions Saved",
      description: `${validTransactionsToSave.length} transaction(s) have been saved successfully.`,
    });
    // Reset to one empty row after saving
    setFormTransactions([{ ...initialFormTransactionRow, id: Date.now().toString() }]);
  };

  const handleImportPlaceholder = (featureName: string) => {
    toast({
      title: "Feature Coming Soon!",
      description: `${featureName} functionality will be implemented in a future update.`,
      variant: "default",
    });
  };
  
  const formatCurrency = (value: number, currencyCode = 'USD') => {
    // This is a placeholder. Ideally, currency would come from user settings.
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
            <p className="text-muted-foreground">
            Add new transactions or import from statements.
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleImportPlaceholder("Bank Statement Import")}>
                <Upload className="mr-2 h-4 w-4" /> Import Statement
            </Button>
            <Button variant="outline" onClick={() => handleImportPlaceholder("Bill Scanner")}>
                <Camera className="mr-2 h-4 w-4" /> Scan Bill
            </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Batch Transaction Entry</CardTitle>
          <CardDescription>Enter details for multiple transactions below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formTransactions.map((tx) => (
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
                  placeholder="e.g., Coffee, Salary"
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
                  disabled={formTransactions.length <= 1}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addTransactionRow} className="mt-4 w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Another Transaction Row
          </Button>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAll} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save Entered Transactions
          </Button>
        </CardFooter>
      </Card>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>A log of all your recorded income and expenses.</CardDescription>
        </CardHeader>
        <CardContent>
            {savedTransactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg font-semibold">No transactions yet!</p>
                    <p>Add transactions using the form above to see them listed here.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {savedTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">{tx.description}</TableCell>
                                <TableCell>{tx.category}</TableCell>
                                <TableCell className={`capitalize ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type}
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                   {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" aria-label="Delete transaction">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the transaction: "{tx.description}".
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteTransaction(tx.id)} className="bg-destructive hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
