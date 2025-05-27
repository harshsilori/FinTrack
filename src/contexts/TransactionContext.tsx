
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransactionBatch: (newTransactions: Omit<Transaction, 'id'>[]) => void;
  deleteTransaction: (transactionId: string) => void;
  updateTransaction: (updatedTransaction: Transaction) => void; 
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  replaceAllTransactions: (newTransactions: Transaction[]) => void; // New function
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const initialSampleTransactions: Transaction[] = [
    { id: 't1', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], description: 'Groceries from SuperMart', amount: 75.50, type: 'expense', category: 'Groceries' },
    { id: 't2', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], description: 'Monthly Salary', amount: 3500, type: 'income', category: 'Salary' },
    { id: 't3', date: new Date().toISOString().split('T')[0], description: 'Coffee with a friend', amount: 12.00, type: 'expense', category: 'Dining Out' },
    { id: 't4', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], description: 'Electricity Bill', amount: 120.00, type: 'expense', category: 'Utilities' },
    { id: 't5', date: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(15)).toISOString().split('T')[0], description: 'Old Internet Bill', amount: 60.00, type: 'expense', category: 'Utilities' },
  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialSampleTransactions);

  const addTransactionBatch = useCallback((newTransactionsData: Omit<Transaction, 'id'>[]) => {
    const fullNewTransactions: Transaction[] = newTransactionsData.map((txData, index) => ({
      ...txData,
      id: `${Date.now().toString()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
    }));
    setTransactions((prevTransactions) => [...prevTransactions, ...fullNewTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions((prevTransactions) => prevTransactions.filter((tx) => tx.id !== transactionId));
  }, []);

  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((tx) =>
        tx.id === updatedTransaction.id ? updatedTransaction : tx
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  }, []);

  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === year && txDate.getMonth() === month - 1;
    });
  }, [transactions]);

  const replaceAllTransactions = useCallback((newTransactions: Transaction[]) => {
    setTransactions(newTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);


  return (
    <TransactionContext.Provider value={{ transactions, addTransactionBatch, deleteTransaction, updateTransaction, getTransactionsByMonth, replaceAllTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
