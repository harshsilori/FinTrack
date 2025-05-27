
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserCircle, Bell, Palette, ShieldCheck, Database, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { useAssets, type Asset } from '@/contexts/AssetContext';
import { useTransactions, type Transaction } from '@/contexts/TransactionContext';
import { useGoals, type Goal } from '@/contexts/GoalContext';
import { useBudgets, type Budget } from '@/contexts/BudgetContext';
import { useDebts, type Debt } from '@/contexts/DebtContext';

// Sample Data Definitions
const sampleAssetsData: Asset[] = [
  { id: 'sampleAsset1', name: 'Sample Savings', category: 'bank', currency: 'USD', quantity: 1, currentPrice: 15000, lastUpdated: '2024-07-01' },
  { id: 'sampleAsset2', name: 'Sample Tech Stock', category: 'stock', currency: 'USD', quantity: 50, purchasePrice: 100, currentPrice: 120, tickerSymbol: 'SMPL', lastUpdated: '2024-07-01' },
  { id: 'sampleAsset3', name: 'Sample Crypto Coin', category: 'crypto', currency: 'USD', quantity: 200, purchasePrice: 1, currentPrice: 1.5, tickerSymbol: 'SMPLC', lastUpdated: '2024-07-01' },
];

const sampleTransactionsData: Transaction[] = [
  { id: 'sampleTx1', date: '2024-07-15', description: 'Sample Salary Deposit', amount: 2500, type: 'income', category: 'Salary' },
  { id: 'sampleTx2', date: '2024-07-16', description: 'Sample Groceries', amount: 85.50, type: 'expense', category: 'Groceries' },
  { id: 'sampleTx3', date: '2024-07-17', description: 'Sample Dinner Out', amount: 45.00, type: 'expense', category: 'Dining Out' },
];

const sampleGoalsData: Goal[] = [
  { id: 'sampleGoal1', name: 'Sample Vacation Fund', targetAmount: 2000, currentAmount: 300, targetDate: '2025-01-15', icon: 'Plane' },
  { id: 'sampleGoal2', name: 'Sample Emergency Pot', targetAmount: 5000, currentAmount: 1000, icon: 'ShieldCheck' },
];

const sampleBudgetsData: Budget[] = [
  { id: 'sampleBudget1', name: 'Monthly Sample Groceries', amount: 300, category: 'Groceries', period: 'monthly' },
  { id: 'sampleBudget2', name: 'Weekly Sample Fun', amount: 75, category: 'Entertainment', period: 'weekly' },
];

const sampleDebtsData: Debt[] = [
  { id: 'sampleDebt1', name: 'Sample Credit Card', totalAmount: 1500, amountPaid: 200, interestRate: 18.9 },
  { id: 'sampleDebt2', name: 'Sample Personal Loan', totalAmount: 8000, amountPaid: 1000, minimumPayment: 150 },
];


export default function SettingsPage() {
  const { toast } = useToast();
  const { replaceAllAssets } = useAssets();
  const { replaceAllTransactions } = useTransactions();
  const { replaceAllGoals } = useGoals();
  const { replaceAllBudgets } = useBudgets();
  const { replaceAllDebts } = useDebts();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentTheme, setAccentTheme] = useState('theme-default');

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    const storedAccentTheme = localStorage.getItem('accentTheme') || 'theme-default';
    setIsDarkMode(storedDarkMode);
    setAccentTheme(storedAccentTheme);
    if (storedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.classList.remove('theme-default', 'theme-forest', 'theme-sunset', 'theme-ocean');
    document.documentElement.classList.add(storedAccentTheme);
  }, []);

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem('darkMode', String(checked));
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAccentThemeChange = (theme: string) => {
    setAccentTheme(theme);
    localStorage.setItem('accentTheme', theme);
    document.documentElement.classList.remove('theme-default', 'theme-forest', 'theme-sunset', 'theme-ocean');
    document.documentElement.classList.add(theme);
  };

  const handleLoadSampleData = () => {
    replaceAllAssets(sampleAssetsData);
    replaceAllTransactions(sampleTransactionsData);
    replaceAllGoals(sampleGoalsData);
    replaceAllBudgets(sampleBudgetsData);
    replaceAllDebts(sampleDebtsData);
    toast({
      title: "Sample Data Loaded",
      description: "All existing data has been replaced with sample data.",
    });
  };


  const themeOptions = [
    { value: 'theme-default', label: 'Default Blue', primary: 'hsl(231 48% 48%)', accent: 'hsl(261 44% 58%)' },
    { value: 'theme-forest', label: 'Forest Green', primary: 'hsl(142 60% 35%)', accent: 'hsl(158 44% 48%)' },
    { value: 'theme-sunset', label: 'Sunset Orange', primary: 'hsl(24 90% 50%)', accent: 'hsl(4 80% 55%)' },
    { value: 'theme-ocean', label: 'Ocean Teal', primary: 'hsl(180 70% 40%)', accent: 'hsl(195 65% 55%)' },
  ];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences.
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Profile Settings</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your Name" defaultValue="Demo User" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" defaultValue="demo@example.com" />
            </div>
          </div>
          <Button>Save Profile</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Theme Settings</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Toggle between light and dark themes.
              </span>
            </Label>
            <Switch 
              id="dark-mode" 
              checked={isDarkMode}
              onCheckedChange={handleDarkModeToggle} 
            />
          </div>
          
          <div>
            <Label className="text-base">Accent Color</Label>
            <p className="text-sm text-muted-foreground mb-3">Choose an accent color palette for the app.</p>
            <RadioGroup value={accentTheme} onValueChange={handleAccentThemeChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themeOptions.map(theme => (
                <Label 
                  key={theme.value} 
                  htmlFor={theme.value}
                  className="flex flex-col items-start cursor-pointer rounded-md border border-muted p-4 hover:border-primary data-[state=checked]:border-primary data-[state=checked]:ring-2 data-[state=checked]:ring-primary"
                  data-state={accentTheme === theme.value ? 'checked' : 'unchecked'}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{theme.label}</span>
                    <RadioGroupItem value={theme.value} id={theme.value} className="shrink-0" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-10 rounded" style={{ backgroundColor: theme.primary }}></div>
                    <div className="h-6 w-10 rounded" style={{ backgroundColor: theme.accent }}></div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Separator />
      
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/> Notification Preferences</CardTitle>
          <CardDescription>Control how you receive notifications. (Functionality not implemented)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive updates and alerts via email.
              </span>
            </Label>
            <Switch id="email-notifications" defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>Push Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get real-time alerts on your device (if supported).
              </span>
            </Label>
            <Switch id="push-notifications" disabled />
          </div>
          <Button disabled>Save Notifications</Button>
        </CardContent>
      </Card>

      <Separator />
      
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/> Security</CardTitle>
          <CardDescription>Manage your account security settings. (Functionality not implemented)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" disabled/>
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" disabled/>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" disabled/>
          </div>
          <Button disabled>Change Password</Button>
        </CardContent>
      </Card>

      <Separator />

       <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary"/> Data Management</CardTitle>
          <CardDescription>Manage your application data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <AlertTriangle className="mr-2 h-4 w-4" /> Load Sample Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will replace ALL your current financial data (assets, transactions, goals, budgets, debts) with sample data. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLoadSampleData} className="bg-destructive hover:bg-destructive/80">
                  Load Sample Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
           <p className="text-xs text-muted-foreground">
            Loading sample data helps you explore the app's features. It will overwrite any existing data you have entered.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
