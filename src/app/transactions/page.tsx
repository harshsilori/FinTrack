
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Save, Upload, Camera, AlertTriangle, Edit3, FilterX, Search as SearchIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTransactions, type Transaction } from '@/contexts/TransactionContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { parseISO, isWithinInterval, isValid } from 'date-fns';

const generateClientUniqueId = () => Math.random().toString(36).substring(2, 11);

interface FormTransaction {
  id: string; 
  date: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
}

const initialTransactionRowData: Omit<FormTransaction, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: '',
  type: 'expense',
  category: '',
};

const initialEditFormState: Transaction = {
  id: '',
  date: '',
  description: '',
  amount: 0,
  type: 'expense',
  category: '',
};

const defaultFilterState = {
  startDate: '',
  endDate: '',
  type: 'all',
  category: 'all',
  searchTerm: '',
};

export default function TransactionsPage() {
  const { toast } = useToast();
  const { transactions: savedTransactions, addTransactionBatch, deleteTransaction, updateTransaction } = useTransactions();
  
  const [formTransactions, setFormTransactions] = useState<FormTransaction[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setFormTransactions([{ ...initialTransactionRowData, id: generateClientUniqueId() }]);
  }, []);


  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentTransactionForEdit, setCurrentTransactionForEdit] = useState<Transaction>(initialEditFormState);
  
  // State for filters
  const [filterStartDate, setFilterStartDate] = useState(defaultFilterState.startDate);
  const [filterEndDate, setFilterEndDate] = useState(defaultFilterState.endDate);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(defaultFilterState.type as 'all' | 'income' | 'expense');
  const [filterCategory, setFilterCategory] = useState(defaultFilterState.category);
  const [searchTerm, setSearchTerm] = useState(defaultFilterState.searchTerm);

  const availableCategories = useMemo(() => {
    const allCats = savedTransactions.map(tx => tx.category);
    return ['all', ...Array.from(new Set(allCats)).sort()];
  }, [savedTransactions]);

  const appDefinedCategories = useMemo(() => ['Groceries', 'Utilities', 'Salary', 'Entertainment', 'Transport', 'Healthcare', 'Education', 'Dining Out', 'Shopping', 'Rent/Mortgage', 'Investment', 'Gifts', 'Other'].sort(), []);


  const handleInputChange = (id: string, field: keyof Omit<FormTransaction, 'id' | 'type' | 'category'>, value: string) => {
    setFormTransactions(
      formTransactions.map((tx) =>
        tx.id === id ? { ...tx, [field]: value } : tx
      )
    );
  };
  
  const handleTypeChange = (id: string, value: 'income' | 'expense') => {
    setFormTransactions(
      formTransactions.map((tx) =>
        tx.id === id ? { ...tx, type: value, category: '' } : tx // Reset category on type change if needed
      )
    );
  };

  const handleCategoryChange = (id: string, value: string) => {
     setFormTransactions(
      formTransactions.map((tx) =>
        tx.id === id ? { ...tx, category: value } : tx
      )
    );
  }

  const addTransactionRow = () => {
    setFormTransactions([
      ...formTransactions,
      { ...initialTransactionRowData, id: generateClientUniqueId() },
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

  const handleSaveAllBatch = () => {
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
        description: "Please fill all fields correctly. Amount must be a positive number and category selected.",
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
    setFormTransactions([{ ...initialTransactionRowData, id: generateClientUniqueId() }]);
  };

  const openEditForm = (transaction: Transaction) => {
    setCurrentTransactionForEdit(transaction);
    setIsEditFormOpen(true);
  };

  const handleEditFormChange = (field: keyof Omit<Transaction, 'id' | 'amount'>, value: string | 'income' | 'expense') => {
    setCurrentTransactionForEdit(prev => ({
        ...prev!,
        [field]: value,
    }));
  };
  
  const handleEditAmountChange = (value: string) => {
    setCurrentTransactionForEdit(prev => ({
        ...prev!,
        amount: parseFloat(value) || 0,
    }));
  };
  
  const handleSaveEditedTransaction = () => {
    if (!currentTransactionForEdit) return;

    if (!currentTransactionForEdit.description || !currentTransactionForEdit.date || !currentTransactionForEdit.category || currentTransactionForEdit.amount <= 0) {
        toast({
            title: "Validation Error",
            description: "Please fill all fields correctly. Amount must be a positive number.",
            variant: "destructive",
        });
        return;
    }
    updateTransaction(currentTransactionForEdit);
    toast({ title: "Transaction Updated", description: `${currentTransactionForEdit.description} has been updated.` });
    setIsEditFormOpen(false);
    setCurrentTransactionForEdit(initialEditFormState);
  };

  const handleImportPlaceholder = (featureName: string) => {
    toast({
      title: "Feature Coming Soon!",
      description: `${featureName} functionality will be implemented in a future update.`,
      variant: "default",
    });
  };
  
  const formatCurrency = (value: number, currencyCode = 'USD') => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredTransactions = useMemo(() => {
    return savedTransactions.filter(tx => {
      const txDate = parseISO(tx.date);
      
      const isAfterStartDate = filterStartDate ? txDate >= parseISO(filterStartDate) : true;
      const isBeforeEndDate = filterEndDate ? txDate <= parseISO(filterEndDate) : true;
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      const matchesSearchTerm = searchTerm === '' || tx.description.toLowerCase().includes(searchTerm.toLowerCase());

      return isAfterStartDate && isBeforeEndDate && matchesType && matchesCategory && matchesSearchTerm;
    });
  }, [savedTransactions, filterStartDate, filterEndDate, filterType, filterCategory, searchTerm]);

  const clearFilters = () => {
    setFilterStartDate(defaultFilterState.startDate);
    setFilterEndDate(defaultFilterState.endDate);
    setFilterType(defaultFilterState.type as 'all' | 'income' | 'expense');
    setFilterCategory(defaultFilterState.category);
    setSearchTerm(defaultFilterState.searchTerm);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
            <p className="text-muted-foreground">
            Add new transactions, import statements, or manage your existing entries.
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleImportPlaceholder("Bank Statement Import (PDF/CSV)")}>
                <Upload className="mr-2 h-4 w-4" /> Import Statement
            </Button>
            <Button variant="outline" onClick={() => handleImportPlaceholder("Bill Scanner (Image OCR)")}>
                <Camera className="mr-2 h-4 w-4" /> Scan Bill
            </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Batch Transaction Entry</CardTitle>
          <CardDescription>Enter details for multiple transactions below. Click "Save Entered Transactions" at the bottom when done.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isMounted && <p className="text-muted-foreground text-center py-4">Loading transaction entry form...</p>}
          {isMounted && formTransactions.map((tx) => (
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
                  min="0.01"
                  step="0.01"
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
                  onValueChange={(value) => handleCategoryChange(tx.id, value)}
                >
                  <SelectTrigger id={`category-${tx.id}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {appDefinedCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
          {isMounted && (
            <Button variant="outline" onClick={addTransactionRow} className="mt-4 w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Transaction Row
            </Button>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAllBatch} className="w-full md:w-auto" disabled={!isMounted || formTransactions.length === 0}>
            <Save className="mr-2 h-4 w-4" /> Save Entered Transactions
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={(isOpen) => {
          setIsEditFormOpen(isOpen);
          if (!isOpen) setCurrentTransactionForEdit(initialEditFormState);
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Modify the details of your transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">Date</Label>
              <Input id="edit-date" type="date" value={currentTransactionForEdit.date} onChange={(e) => handleEditFormChange('date', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Description</Label>
              <Input id="edit-description" value={currentTransactionForEdit.description} onChange={(e) => handleEditFormChange('description', e.target.value)} className="col-span-3" placeholder="e.g., Lunch meeting" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">Amount</Label>
              <Input id="edit-amount" type="number" value={currentTransactionForEdit.amount.toString()} onChange={(e) => handleEditAmountChange(e.target.value)} className="col-span-3" placeholder="0.00" min="0.01" step="0.01" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">Type</Label>
              <Select value={currentTransactionForEdit.type} onValueChange={(value: 'income' | 'expense') => handleEditFormChange('type', value)}>
                <SelectTrigger id="edit-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">Category</Label>
              <Select value={currentTransactionForEdit.category} onValueChange={(value) => handleEditFormChange('category', value)}>
                <SelectTrigger id="edit-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {appDefinedCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditFormOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSaveEditedTransaction}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Filters Card */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
          <CardDescription>Refine the list of transactions displayed below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="filter-start-date">Start Date</Label>
              <Input id="filter-start-date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filter-end-date">End Date</Label>
              <Input id="filter-end-date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="filter-category">Category</Label>
              <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value)}>
                <SelectTrigger id="filter-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="md:col-span-1">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                <FilterX className="mr-2 h-4 w-4" /> Clear Filters
              </Button>
            </div>
          </div>
          <div className="relative">
            <Label htmlFor="filter-search-term">Search Description</Label>
            <SearchIcon className="absolute left-2.5 top-9 h-4 w-4 text-muted-foreground" />
            <Input 
              id="filter-search-term" 
              type="text" 
              placeholder="Search descriptions..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8" 
            />
          </div>
        </CardContent>
      </Card>


      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>A log of all your recorded income and expenses. Use filters above to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent>
            {filteredTransactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg font-semibold">No transactions match your filters!</p>
                    <p>Try adjusting your filters or add new transactions.</p>
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
                        {filteredTransactions.map((tx) => {
                            const txDate = parseISO(tx.date);
                            const displayDate = isValid(txDate) ? txDate.toLocaleDateString() : "Invalid Date";
                            return (
                                <TableRow key={tx.id}>
                                    <TableCell>{displayDate}</TableCell>
                                    <TableCell className="font-medium">{tx.description}</TableCell>
                                    <TableCell>{tx.category}</TableCell>
                                    <TableCell className={`capitalize ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {tx.type}
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </TableCell>
                                    <TableCell className="text-center space-x-1">
                                        <Button variant="ghost" size="icon" aria-label="Edit transaction" onClick={() => openEditForm(tx)}>
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
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
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

