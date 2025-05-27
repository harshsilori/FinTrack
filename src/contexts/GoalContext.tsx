
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; 
  icon?: string; 
}

interface GoalContextType {
  goals: Goal[];
  addGoal: (newGoalData: Omit<Goal, 'id'>) => void;
  updateGoal: (updatedGoal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  addContribution: (goalId: string, amount: number) => void;
  replaceAllGoals: (newGoals: Goal[]) => void; // New function
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

const initialSampleGoals: Goal[] = [
    {
      id: 'goal1',
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 2500,
      targetDate: '2025-12-31',
      icon: 'ShieldCheck',
    },
    {
      id: 'goal2',
      name: 'Vacation to Japan',
      targetAmount: 5000,
      currentAmount: 1200,
      targetDate: '2025-06-01',
      icon: 'Plane',
    },
];

export const GoalProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>(initialSampleGoals);

  const addGoal = useCallback((newGoalData: Omit<Goal, 'id'>) => {
    const fullNewGoal: Goal = {
      ...newGoalData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    setGoals((prevGoals) => [...prevGoals, fullNewGoal]);
  }, []);

  const updateGoal = useCallback((updatedGoal: Goal) => {
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals((prevGoals) => prevGoals.filter((g) => g.id !== goalId));
  }, []);

  const addContribution = useCallback((goalId: string, amount: number) => {
    setGoals((prevGoals) =>
      prevGoals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) } 
          : g
      )
    );
  }, []);

  const replaceAllGoals = useCallback((newGoals: Goal[]) => {
    setGoals(newGoals);
  }, []);

  return (
    <GoalContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, addContribution, replaceAllGoals }}>
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = (): GoalContextType => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
};
