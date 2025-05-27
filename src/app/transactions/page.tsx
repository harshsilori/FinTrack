
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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger, // Added missing import
} from '@/components/ui/alert-dialog';
import { parseISO, isValid, format, startOfMonth, endOfMonth } from 'date-fns';

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
  startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  type: 'all',
  category: 'all',
  searchTerm: '',
};

const appDefinedCategories = ['Groceries', 'Utilities', 'Salary', 'Entertainment', 'Transport', 'Healthcare', 'Education', 'Dining Out', 'Shopping', 'Rent/Mortgage', 'Investment', 'Gifts', 'Other'].sort();

export default function TransactionsPage() {
  const { toast } = useToast();
  const { transactions: savedTransactions, addTransactionBatch, deleteTransaction, updateTransaction } = useTransactions();
  
  const [formTransactions, setFormTransactions] = useState<FormTransaction[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initialize with one row using client-side ID after mount
    setFormTransactions([{ ...initialTransactionRowData, id: generateClientUniqueId(), category: appDefinedCategories[0] || '' }]);
  }, []);

  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [currentTransactionForEdit, setCurrentTransactionForEdit] = useState<Transaction>(initialEditFormState);
  
  const [filterStartDate, setFilterStartDate] = useState(defaultFilterState.startDate);
  const [filterEndDate, setFilterEndDate] = useState(defaultFilterState.endDate);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(defaultFilterState.type as 'all' | 'income' | 'expense');
  const [filterCategory, setFilterCategory] = useState(defaultFilterState.category);
  const [searchTerm, setSearchTerm] = useState(defaultFilterState.searchTerm);

  const availableCategories = useMemo(() => {
    const allCats = savedTransactions.map(tx => tx.category).concat(appDefinedCategories);
    return ['all', ...Array.from(new Set(allCats)).filter(Boolean).sort()];
  }, [savedTransactions]);

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
        tx.id === id ? { ...tx, type: value, category: tx.category || (appDefinedCategories[0] || '') } : tx 
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
      { ...initialTransactionRowData, id: generateClientUniqueId(), category: appDefinedCategories[0] || '' },
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
    setFormTransactions([{ ...initialTransactionRowData, id: generateClientUniqueId(), category: appDefinedCategories[0] || '' }]);
  };

  const openEditForm = (transaction: Transaction) => {
    setCurrentTransactionForEdit(transaction);
    setIsEditFormOpen(true);
  };

  const handleEditFormChange = (field: keyof Omit<Transaction, 'id' | 'amount'>, value: string | 'income' | 'expense') => {
    setCurrentTransactionForEdit(prev => ({
        ...prev!,
        [field]: value,
        ...(field === 'type' && {category: prev!.category || (appDefinedCategories[0] || '')})
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
      let txDate;
      try {
        txDate = parseISO(tx.date);
        if (!isValid(txDate)) throw new Error("Invalid date");
      } catch (e) {
        console.error("Error parsing transaction date for filtering:", tx.date, e);
        return false; 
      }
      
      let isAfterStartDate = true;
      if (filterStartDate && isValid(parseISO(filterStartDate))) {
        try {
          isAfterStartDate = txDate >= parseISO(filterStartDate);
        } catch (e) { isAfterStartDate = false; }
      }
      
      let isBeforeEndDate = true;
      if (filterEndDate && isValid(parseISO(filterEndDate))) {
         try {
          isBeforeEndDate = txDate <= parseISO(filterEndDate);
        } catch (e) { isBeforeEndDate = false; }
      }
      
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      const matchesSearchTerm = searchTerm === '' || tx.description.toLowerCase().includes(searchTerm.toLowerCase());

      return isAfterStartDate && isBeforeEndDate && matchesType && matchesCategory && matchesSearchTerm;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [savedTransactions, filterStartDate, filterEndDate, filterType, filterCategory, searchTerm]);

  const clearFilters = () => {
    setFilterStartDate(defaultFilterState.startDate);
    setFilterEndDate(defaultFilterState.endDate);
    setFilterType(defaultFilterState.type as 'all' | 'income' | 'expense');
    setFilterCategory(defaultFilterState.category);
    setSearchTerm(defaultFilterState.searchTerm);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
        <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Transaction Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
            Add new transactions or manage your existing entries.
            </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => handleImportPlaceholder("Bank Statement Import (PDF/CSV)")} className="w-full sm:w-auto text-xs sm:text-sm">
                <Upload className="mr-2 h-4 w-4" /> Import Statement
            </Button>
            <Button variant="outline" onClick={() => handleImportPlaceholder("Bill Scanner (Image OCR)")} className="w-full sm:w-auto text-xs sm:text-sm">
                <Camera className="mr-2 h-4 w-4" /> Scan Bill
            </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">Batch Transaction Entry</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Enter details for multiple transactions below. Click "Save Entered Transactions" at the bottom when done.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          {!isMounted && <p className="text-muted-foreground text-center py-4 text-sm">Loading transaction entry form...</p>}
          {isMounted && formTransactions.map((tx) => (
            <div key={tx.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-end p-2 md:p-3 border rounded-lg shadow-sm bg-card">
              <div className="md:col-span-2">
                <Label htmlFor={`date-${tx.id}`} className="text-xs">Date</Label>
                <Input
                  id={`date-${tx.id}`}
                  type="date"
                  value={tx.date}
                  onChange={(e) => handleInputChange(tx.id, 'date', e.target.value)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor={`description-${tx.id}`} className="text-xs">Description</Label>
                <Input
                  id={`description-${tx.id}`}
                  placeholder="e.g., Coffee, Salary"
                  value={tx.description}
                  onChange={(e) => handleInputChange(tx.id, 'description', e.target.value)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`amount-${tx.id}`} className="text-xs">Amount</Label>
                <Input
                  id={`amount-${tx.id}`}
                  type="number"
                  placeholder="0.00"
                  value={tx.amount}
                  onChange={(e) => handleInputChange(tx.id, 'amount', e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`type-${tx.id}`} className="text-xs">Type</Label>
                <Select
                  value={tx.type}
                  onValueChange={(value: 'income' | 'expense') => handleTypeChange(tx.id, value)}
                >
                  <SelectTrigger id={`type-${tx.id}`} className="text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`category-${tx.id}`} className="text-xs">Category</Label>
                 <Select
                  value={tx.category || (appDefinedCategories[0] || '')}
                  onValueChange={(value) => handleCategoryChange(tx.id, value)}
                >
                  <SelectTrigger id={`category-${tx.id}`} className="text-xs sm:text-sm h-9 sm:h-10">
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
                  className="h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {isMounted && (
            <Button variant="outline" onClick={addTransactionRow} className="mt-3 sm:mt-4 w-full md:w-auto text-xs sm:text-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Transaction Row
            </Button>
          )}
        </CardContent>
        <CardFooter className="p-3 sm:p-4 md:p-6">
          <Button onClick={handleSaveAllBatch} className="w-full md:w-auto text-xs sm:text-sm" disabled={!isMounted || formTransactions.length === 0}>
            <Save className="mr-2 h-4 w-4" /> Save Entered Transactions
          </Button>
        </CardFooter>
      </Card>

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
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-3 sm:gap-x-4 gap-y-2">
              <Label htmlFor="edit-date" className="text-left sm:text-right text-xs sm:text-sm">Date</Label>
              <Input id="edit-date" type="date" value={currentTransactionForEdit.date} onChange={(e) => handleEditFormChange('date', e.target.value)} className="col-span-1 sm:col-span-3 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-3 sm:gap-x-4 gap-y-2">
              <Label htmlFor="edit-description" className="text-left sm:text-right text-xs sm:text-sm">Description</Label>
              <Input id="edit-description" value={currentTransactionForEdit.description} onChange={(e) => handleEditFormChange('description', e.target.value)} className="col-span-1 sm:col-span-3 text-sm" placeholder="e.g., Lunch meeting" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-3 sm:gap-x-4 gap-y-2">
              <Label htmlFor="edit-amount" className="text-left sm:text-right text-xs sm:text-sm">Amount</Label>
              <Input id="edit-amount" type="number" value={currentTransactionForEdit.amount.toString()} onChange={(e) => handleEditAmountChange(e.target.value)} className="col-span-1 sm:col-span-3 text-sm" placeholder="0.00" min="0.01" step="0.01" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-3 sm:gap-x-4 gap-y-2">
              <Label htmlFor="edit-type" className="text-left sm:text-right text-xs sm:text-sm">Type</Label>
              <Select value={currentTransactionForEdit.type} onValueChange={(value: 'income' | 'expense') => handleEditFormChange('type', value)}>
                <SelectTrigger id="edit-type" className="col-span-1 sm:col-span-3 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-3 sm:gap-x-4 gap-y-2">
              <Label htmlFor="edit-category" className="text-left sm:text-right text-xs sm:text-sm">Category</Label>
              <Select value={currentTransactionForEdit.category} onValueChange={(value) => handleEditFormChange('category', value)}>
                <SelectTrigger id="edit-category" className="col-span-1 sm:col-span-3 text-sm">
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

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">Filter Transactions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Refine the list of transactions displayed below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
            <div>
              <Label htmlFor="filter-start-date" className="text-xs sm:text-sm">Start Date</Label>
              <Input id="filter-start-date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="text-xs sm:text-sm h-9 sm:h-10" />
            </div>
            <div>
              <Label htmlFor="filter-end-date" className="text-xs sm:text-sm">End Date</Label>
              <Input id="filter-end-date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="text-xs sm:text-sm h-9 sm:h-10" />
            </div>
            <div>
              <Label htmlFor="filter-type" className="text-xs sm:text-sm">Type</Label>
              <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
                <SelectTrigger id="filter-type" className="text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="filter-category" className="text-xs sm:text-sm">Category</Label>
              <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value)}>
                <SelectTrigger id="filter-category" className="text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="relative sm:col-span-2 lg:col-span-1">
                <Label htmlFor="filter-search-term" className="text-xs sm:text-sm">Search Description</Label>
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                    id="filter-search-term" 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs sm:text-sm h-9 sm:h-10" 
                    />
                </div>
            </div>
             <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                <FilterX className="mr-2 h-4 w-4" /> Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">All Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">A log of all your recorded income and expenses. Use filters above to narrow down the list.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
            {filteredTransactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-4">
                    <AlertTriangle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-4 text-primary" />
                    <p className="text-md sm:text-lg font-semibold">No transactions match your filters!</p>
                    <p className="text-sm">Try adjusting your filters or add new transactions.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[80px] px-2 py-2 sm:px-3 text-xs">Date</TableHead>
                            <TableHead className="min-w-[120px] px-2 py-2 sm:px-3 text-xs">Description</TableHead>
                            <TableHead className="min-w-[90px] px-2 py-2 sm:px-3 text-xs">Category</TableHead>
                            <TableHead className="min-w-[60px] px-2 py-2 sm:px-3 text-xs">Type</TableHead>
                            <TableHead className="text-right min-w-[80px] px-2 py-2 sm:px-3 text-xs">Amount</TableHead>
                            <TableHead className="text-center min-w-[70px] px-2 py-2 sm:px-3 text-xs">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => {
                            let displayDate = "Invalid Date";
                            try {
                              if (tx.date && isValid(parseISO(tx.date))) {
                                  displayDate = format(parseISO(tx.date), "P");
                              }
                            } catch (e) {
                              console.error("Error formatting date for display:", tx.date, e);
                            }
                            return (
                                <TableRow key={tx.id}>
                                    <TableCell className="px-2 py-2 sm:px-3 text-xs">{displayDate}</TableCell>
                                    <TableCell className="font-medium px-2 py-2 sm:px-3 text-xs">{tx.description}</TableCell>
                                    <TableCell className="px-2 py-2 sm:px-3 text-xs">{tx.category}</TableCell>
                                    <TableCell className={`capitalize px-2 py-2 sm:px-3 text-xs ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {tx.type}
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold px-2 py-2 sm:px-3 text-xs ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </TableCell>
                                    <TableCell className="text-center px-2 py-2 sm:px-3 space-x-0">
                                        <Button variant="ghost" size="icon" aria-label="Edit transaction" onClick={() => openEditForm(tx)} className="h-7 w-7 sm:h-8 sm:w-8">
                                            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" aria-label="Delete transaction" className="h-7 w-7 sm:h-8 sm:w-8">
                                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
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
