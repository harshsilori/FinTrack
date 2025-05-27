
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserCircle, Bell, Palette, ShieldCheck, Database, AlertTriangle, UploadCloud, DownloadCloud } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

import { useAssets, type Asset } from '@/contexts/AssetContext';
import { useTransactions, type Transaction } from '@/contexts/TransactionContext';
import { useGoals, type Goal } from '@/contexts/GoalContext';
import { useBudgets, type Budget } from '@/contexts/BudgetContext';
import { useDebts, type Debt } from '@/contexts/DebtContext';

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
  const { assets, replaceAllAssets } = useAssets();
  const { transactions, replaceAllTransactions } = useTransactions();
  const { goals, replaceAllGoals } = useGoals();
  const { budgets, replaceAllBudgets } = useBudgets();
  const { debts, replaceAllDebts } = useDebts();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentTheme, setAccentTheme] = useState('theme-default');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBackupData = () => {
    const backupData = {
      assets,
      transactions,
      goals,
      budgets,
      debts,
      backupDate: new Date().toISOString(),
      appVersion: 'FinTrackMobile_v1.0_LocalBackup', 
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    const formattedDate = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    link.download = `fintrack_backup_${formattedDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);

    toast({
      title: "Data Backup Successful",
      description: "Your data has been exported to a JSON file.",
    });
  };

  const handleRestoreDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          toast({ title: "Error reading file", description: "File content is not valid text.", variant: "destructive" });
          return;
        }
        const importedData = JSON.parse(result);

        if (
          !importedData ||
          typeof importedData !== 'object' ||
          !Array.isArray(importedData.assets) ||
          !Array.isArray(importedData.transactions) ||
          !Array.isArray(importedData.goals) ||
          !Array.isArray(importedData.budgets) ||
          !Array.isArray(importedData.debts)
        ) {
          toast({ title: "Invalid Backup File", description: "The selected file is not a valid FinTrack backup.", variant: "destructive" });
          return;
        }
        
        replaceAllAssets(importedData.assets as Asset[]);
        replaceAllTransactions(importedData.transactions as Transaction[]);
        replaceAllGoals(importedData.goals as Goal[]);
        replaceAllBudgets(importedData.budgets as Budget[]);
        replaceAllDebts(importedData.debts as Debt[]);

        toast({
          title: "Data Restored Successfully",
          description: "Your data has been imported from the backup file.",
        });

      } catch (error) {
        console.error("Error parsing or restoring backup:", error);
        toast({ title: "Restore Failed", description: "Could not parse or restore the backup file. Make sure it's a valid FinTrack JSON backup.", variant: "destructive" });
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
        toast({ title: "Error reading file", description: reader.error?.message, variant: "destructive" });
         if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const themeOptions = [
    { value: 'theme-default', label: 'Default Blue', primary: 'hsl(231 48% 48%)', accent: 'hsl(261 44% 58%)' },
    { value: 'theme-forest', label: 'Forest Green', primary: 'hsl(142 60% 35%)', accent: 'hsl(158 44% 48%)' },
    { value: 'theme-sunset', label: 'Sunset Orange', primary: 'hsl(24 90% 50%)', accent: 'hsl(4 80% 55%)' },
    { value: 'theme-ocean', label: 'Ocean Teal', primary: 'hsl(180 70% 40%)', accent: 'hsl(195 65% 55%)' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
      </div>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your account and application preferences.
        </p>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl"><UserCircle className="h-5 w-5 text-primary"/> Profile Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Update your personal information. (Note: Password changes are handled through re-registration for local accounts)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
              <Input id="name" placeholder="Your Name" defaultValue="Demo User" className="text-sm h-9 sm:h-10"/>
            </div>
            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" defaultValue="demo@example.com" disabled className="text-sm h-9 sm:h-10"/>
            </div>
          </div>
          <Button disabled className="text-xs sm:text-sm">Save Profile (Name Only)</Button>
           <p className="text-xs text-muted-foreground">
            Email is tied to your local account and cannot be changed here. To change your password, please sign out and re-register.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl"><Palette className="h-5 w-5 text-primary"/> Theme Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
           <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span className="text-xs sm:text-sm">Dark Mode</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
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
            <Label className="text-sm sm:text-base">Accent Color</Label>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">Choose an accent color palette for the app.</p>
            <RadioGroup value={accentTheme} onValueChange={handleAccentThemeChange} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {themeOptions.map(theme => (
                <Label 
                  key={theme.value} 
                  htmlFor={theme.value}
                  className="flex flex-col items-start cursor-pointer rounded-md border border-muted p-3 sm:p-4 hover:border-primary data-[state=checked]:border-primary data-[state=checked]:ring-1 sm:data-[state=checked]:ring-2 data-[state=checked]:ring-primary"
                  data-state={accentTheme === theme.value ? 'checked' : 'unchecked'}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs sm:text-sm">{theme.label}</span>
                    <RadioGroupItem value={theme.value} id={theme.value} className="shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-4 w-6 sm:h-5 sm:w-8 rounded" style={{ backgroundColor: theme.primary }}></div>
                    <div className="h-4 w-6 sm:h-5 sm:w-8 rounded" style={{ backgroundColor: theme.accent }}></div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Separator />
      
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl"><Bell className="h-5 w-5 text-primary"/> Notification Preferences</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Control how you receive notifications. (Functionality not implemented)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span className="text-xs sm:text-sm">Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                Receive updates and alerts via email.
              </span>
            </Label>
            <Switch id="email-notifications" defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span className="text-xs sm:text-sm">Push Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs sm:text-sm">
                Get real-time alerts on your device (if supported).
              </span>
            </Label>
            <Switch id="push-notifications" disabled />
          </div>
          <Button disabled className="text-xs sm:text-sm">Save Notifications</Button>
        </CardContent>
      </Card>

      <Separator />
      
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl"><Database className="h-5 w-5 text-primary"/> Data Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage your application data. Backups are stored locally as JSON files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Button onClick={handleBackupData} variant="outline" className="w-full text-xs sm:text-sm">
                    <DownloadCloud className="mr-2 h-4 w-4" /> Backup All Data
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline" className="w-full text-xs sm:text-sm">
                       <UploadCloud className="mr-2 h-4 w-4" /> Restore Data from Backup
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restore Data from Backup?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will overwrite ALL your current application data with the data from the selected backup file. This cannot be undone. Are you sure you want to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={triggerFileSelect}>
                        Choose File & Restore
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleRestoreDataChange}
                    className="hidden"
                />
            </div>
           <p className="text-xs text-muted-foreground">
            Backup creates a JSON file of your data. Restore will replace all current data with the backup.
          </p>
           <Separator className="my-3 sm:my-4"/>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto text-xs sm:text-sm">
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
    
