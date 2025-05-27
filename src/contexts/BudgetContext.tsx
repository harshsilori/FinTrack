
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  category: string;
  period: 'monthly' | 'bi-weekly' | 'weekly' | 'custom';
  customPeriodDetails?: string;
}

export const budgetPeriods = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-weekly', label: 'Bi-Weekly (Manual Tracking)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom (Manual Tracking)' },
];

export const budgetCategories = ['Groceries', 'Dining Out', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other'];


interface BudgetContextType {
  budgets: Budget[];
  addBudget: (newBudgetData: Omit<Budget, 'id'>) => void;
  updateBudget: (updatedBudget: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  replaceAllBudgets: (newBudgets: Budget[]) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const initialSampleBudgets: Budget[] = [
    { id: 'b1', name: 'Monthly Groceries', amount: 400, category: 'Groceries', period: 'monthly' },
    { id: 'b2', name: 'Entertainment Fund', amount: 150, category: 'Entertainment', period: 'monthly' },
    { id: 'b3', name: 'Weekly Transport', amount: 50, category: 'Transport', period: 'weekly' },
];

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>(initialSampleBudgets);

  const addBudget = useCallback((newBudgetData: Omit<Budget, 'id'>) => {
    const fullNewBudget: Budget = {
      ...newBudgetData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    setBudgets((prevBudgets) => [...prevBudgets, fullNewBudget]);
  }, []);

  const updateBudget = useCallback((updatedBudget: Budget) => {
    setBudgets((prevBudgets) =>
      prevBudgets.map((b) => (b.id === updatedBudget.id ? updatedBudget : b))
    );
  }, []);

  const deleteBudget = useCallback((budgetId: string) => {
    setBudgets((prevBudgets) => prevBudgets.filter((b) => b.id !== budgetId));
  }, []);

  const replaceAllBudgets = useCallback((newBudgets: Budget[]) => {
    setBudgets(newBudgets);
  }, []);

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, replaceAllBudgets }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgets = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};
