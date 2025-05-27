
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface Debt {
  id: string;
  name: string;
  totalAmount: number; 
  amountPaid: number;  
  interestRate?: number; 
  minimumPayment?: number; 
}

interface DebtContextType {
  debts: Debt[];
  addDebt: (newDebtData: Omit<Debt, 'id'>) => void;
  updateDebt: (updatedDebt: Debt) => void;
  deleteDebt: (debtId: string) => void;
  makePayment: (debtId: string, paymentAmount: number) => void;
  replaceAllDebts: (newDebts: Debt[]) => void; // New function
}

const DebtContext = createContext<DebtContextType | undefined>(undefined);

const initialSampleDebts: Debt[] = [
    {
      id: 'debt1',
      name: 'Student Loan - Great Lakes',
      totalAmount: 25000,
      amountPaid: 5000,
      interestRate: 4.5,
      minimumPayment: 250,
    },
    {
      id: 'debt2',
      name: 'Chase Sapphire Card',
      totalAmount: 3200,
      amountPaid: 1200,
      interestRate: 19.99,
    },
    {
      id: 'debt3',
      name: 'Car Loan - Ally Financial',
      totalAmount: 18000,
      amountPaid: 17500,
      minimumPayment: 350,
    }
];

export const DebtProvider = ({ children }: { children: ReactNode }) => {
  const [debts, setDebts] = useState<Debt[]>(initialSampleDebts);

  const addDebt = useCallback((newDebtData: Omit<Debt, 'id'>) => {
    const fullNewDebt: Debt = {
      ...newDebtData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    setDebts((prevDebts) => [...prevDebts, fullNewDebt]);
  }, []);

  const updateDebt = useCallback((updatedDebt: Debt) => {
    setDebts((prevDebts) =>
      prevDebts.map((d) => (d.id === updatedDebt.id ? updatedDebt : d))
    );
  }, []);

  const deleteDebt = useCallback((debtId: string) => {
    setDebts((prevDebts) => prevDebts.filter((d) => d.id !== debtId));
  }, []);

  const makePayment = useCallback((debtId: string, paymentAmount: number) => {
    setDebts((prevDebts) =>
      prevDebts.map((debt) => {
        if (debt.id === debtId) {
          const newAmountPaid = Math.min(debt.amountPaid + paymentAmount, debt.totalAmount);
          return { ...debt, amountPaid: newAmountPaid };
        }
        return debt;
      })
    );
  }, []);

  const replaceAllDebts = useCallback((newDebts: Debt[]) => {
    setDebts(newDebts);
  }, []);

  return (
    <DebtContext.Provider value={{ debts, addDebt, updateDebt, deleteDebt, makePayment, replaceAllDebts }}>
      {children}
    </DebtContext.Provider>
  );
};

export const useDebts = (): DebtContextType => {
  const context = useContext(DebtContext);
  if (!context) {
    throw new Error('useDebts must be used within a DebtProvider');
  }
  return context;
};
