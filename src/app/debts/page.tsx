
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Edit3, Trash2, CreditCard, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useDebts, type Debt as ContextDebt } from '@/contexts/DebtContext';
import { motion } from 'framer-motion';

const initialDebtFormState: Partial<ContextDebt> = {
  name: '',
  totalAmount: 0,
  amountPaid: 0,
  interestRate: undefined,
  minimumPayment: undefined,
};

const DebtCardComponent = ({ debt, onEdit, onDelete, onMakePayment }: { debt: ContextDebt; onEdit: (debt: ContextDebt) => void; onDelete: (id: string) => void; onMakePayment: (debt: ContextDebt) => void; }) => {
  const remainingBalance = debt.totalAmount - debt.amountPaid;
  const progressPercentage = debt.totalAmount > 0 ? Math.min((debt.amountPaid / debt.totalAmount) * 100, 100) : 0;
  const isPaidOff = remainingBalance <= 0;

  const formatCurrency = (value: number, currencyCode: string = 'USD') => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <motion.div
      className="h-full"
      whileHover={{ scale: 1.02, y: -3, transition: { type: "spring", stiffness: 300, damping: 15 } }}
      whileTap={{ scale: 0.99, transition: { type: "spring", stiffness: 400, damping: 10 } }}
    >
      <Card className={`rounded-2xl shadow-lg flex flex-col h-full ${isPaidOff ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{debt.name}</CardTitle>
              <CardDescription>
                {isPaidOff ? 'Paid Off!' : `Remaining: ${formatCurrency(remainingBalance)}`}
              </CardDescription>
              {debt.interestRate && <CardDescription className="text-xs">Interest Rate: {debt.interestRate}%</CardDescription>}
            </div>
            {isPaidOff ? <CheckCircle className="h-8 w-8 text-green-500" /> : <CreditCard className="h-8 w-8 text-primary" />}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex justify-between items-baseline">
            <p className="text-2xl font-semibold">{formatCurrency(debt.amountPaid)}</p>
            <p className="text-sm text-muted-foreground">of {formatCurrency(debt.totalAmount)} paid</p>
          </div>
          <Progress value={progressPercentage} className="h-3 rounded-lg" indicatorClassName={isPaidOff ? 'bg-green-500' : (progressPercentage > 70 ? 'bg-blue-500' : 'bg-blue-400')} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercentage.toFixed(0)}% paid off</span>
            {debt.minimumPayment && !isPaidOff && <span>Min. Payment: {formatCurrency(debt.minimumPayment)}</span>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onMakePayment(debt)} disabled={isPaidOff}>
            <DollarSign className="mr-1 h-4 w-4" /> Make Payment
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(debt)} aria-label="Edit debt">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(debt.id)} aria-label="Delete debt">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default function DebtsPage() {
  const { toast } = useToast();
  const { debts, addDebt, updateDebt, deleteDebt, makePayment } = useDebts();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentDebtForForm, setCurrentDebtForForm] = useState<Partial<ContextDebt>>(initialDebtFormState);
  
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [debtForPayment, setDebtForPayment] = useState<ContextDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const openForm = (debt?: ContextDebt) => {
    setCurrentDebtForForm(debt || initialDebtFormState);
    setIsFormOpen(true);
  };

  const handleSaveDebt = () => {
    if (!currentDebtForForm || !currentDebtForForm.name || !currentDebtForForm.totalAmount || currentDebtForForm.totalAmount <= 0) {
      toast({ title: "Error", description: "Please fill name and a valid total amount (>0). Amount paid cannot exceed total amount.", variant: "destructive" });
      return;
    }
    if (currentDebtForForm.amountPaid && currentDebtForForm.amountPaid > currentDebtForForm.totalAmount) {
      toast({ title: "Error", description: "Amount paid cannot be greater than the total debt amount.", variant: "destructive" });
      return;
    }


    const debtData: Omit<ContextDebt, 'id'> = {
      name: currentDebtForForm.name,
      totalAmount: Number(currentDebtForForm.totalAmount),
      amountPaid: Number(currentDebtForForm.amountPaid || 0),
      interestRate: currentDebtForForm.interestRate ? Number(currentDebtForForm.interestRate) : undefined,
      minimumPayment: currentDebtForForm.minimumPayment ? Number(currentDebtForForm.minimumPayment) : undefined,
    };

    if (currentDebtForForm.id) {
      updateDebt({ ...debtData, id: currentDebtForForm.id });
      toast({ title: "Debt Updated", description: `${debtData.name} has been updated.` });
    } else {
      addDebt(debtData);
      toast({ title: "Debt Added", description: `${debtData.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentDebtForForm(initialDebtFormState);
  };

  const handleDeleteDebt = (id: string) => {
    deleteDebt(id);
    toast({ title: "Debt Deleted", description: "Debt has been removed.", variant: "destructive" });
  };

  const openPaymentForm = (debt: ContextDebt) => {
    setDebtForPayment(debt);
    setPaymentAmount('');
    setIsPaymentFormOpen(true);
  };

  const handleMakePayment = () => {
    if (!debtForPayment || !paymentAmount) {
      toast({ title: "Error", description: "Please select a debt and enter a payment amount.", variant: "destructive" });
      return;
    }
    const parsedPaymentAmount = parseFloat(paymentAmount);
    if (isNaN(parsedPaymentAmount) || parsedPaymentAmount <= 0) {
      toast({ title: "Error", description: "Payment amount must be a positive number.", variant: "destructive" });
      return;
    }
    
    makePayment(debtForPayment.id, parsedPaymentAmount);
    toast({ title: "Payment Recorded", description: `Payment of ${parsedPaymentAmount.toLocaleString(undefined, {style:'currency', currency: 'USD'})} recorded for ${debtForPayment.name}.` });
    setIsPaymentFormOpen(false);
    setDebtForPayment(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debt Management</h1>
          <p className="text-muted-foreground">
            Track your loans and credit card balances.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setCurrentDebtForForm(initialDebtFormState);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Debt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{currentDebtForForm?.id ? 'Edit Debt' : 'Add New Debt'}</DialogTitle>
              <DialogDescription>
                Enter the details for your debt. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="debt-name" className="text-right">Name</Label>
                <Input id="debt-name" value={currentDebtForForm?.name || ''} onChange={(e) => setCurrentDebtForForm(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" placeholder="e.g., Student Loan"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="debt-total" className="text-right">Total Amount</Label>
                <Input id="debt-total" type="number" value={currentDebtForForm?.totalAmount || ''} onChange={(e) => setCurrentDebtForForm(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))} className="col-span-3" placeholder="e.g., 10000"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="debt-paid" className="text-right">Amount Paid</Label>
                <Input id="debt-paid" type="number" value={currentDebtForForm?.amountPaid || ''} onChange={(e) => setCurrentDebtForForm(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))} className="col-span-3" placeholder="e.g., 1000"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="debt-interest" className="text-right">Interest Rate (%)</Label>
                <Input id="debt-interest" type="number" value={currentDebtForForm?.interestRate || ''} onChange={(e) => setCurrentDebtForForm(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || undefined }))} className="col-span-3" placeholder="e.g., 4.5 (Optional)"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="debt-min-payment" className="text-right">Min. Payment</Label>
                <Input id="debt-min-payment" type="number" value={currentDebtForForm?.minimumPayment || ''} onChange={(e) => setCurrentDebtForForm(prev => ({ ...prev, minimumPayment: parseFloat(e.target.value) || undefined }))} className="col-span-3" placeholder="e.g., 150 (Optional)"/>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSaveDebt}>Save Debt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Make Payment Dialog */}
      <Dialog open={isPaymentFormOpen} onOpenChange={(isOpen) => {
          setIsPaymentFormOpen(isOpen);
          if (!isOpen) setDebtForPayment(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Record a payment for: {debtForPayment?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-amount" className="text-right">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 100"
              />
            </div>
             {debtForPayment && <p className="col-span-4 text-sm text-muted-foreground text-right">Remaining Balance: { (debtForPayment.totalAmount - debtForPayment.amountPaid).toLocaleString(undefined, {style:'currency', currency: 'USD'}) }</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentFormOpen(false)}>Cancel</Button>
            <Button onClick={handleMakePayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {debts.length === 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-semibold">No debts tracked yet!</p>
              <p>Click "Add New Debt" to start managing your liabilities.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {debts.map((debt) => (
          <DebtCardComponent 
            key={debt.id} 
            debt={debt} 
            onEdit={openForm}
            onDelete={handleDeleteDebt}
            onMakePayment={openPaymentForm}
          />
        ))}
      </div>
    </div>
  );
}
