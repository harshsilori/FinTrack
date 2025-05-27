
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Edit3, Trash2, Target, Calendar as CalendarIcon, DollarSign, ShieldCheck, Plane, Home, Car, Gift, CheckCircle, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useGoals, type Goal as ContextGoal } from '@/contexts/GoalContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays, isValid, parseISO } from 'date-fns';

const goalIcons: Record<string, React.ReactNode> = {
  Target: <Target className="h-8 w-8 text-primary" />,
  ShieldCheck: <ShieldCheck className="h-8 w-8 text-green-500" />,
  Plane: <Plane className="h-8 w-8 text-blue-500" />,
  Home: <Home className="h-8 w-8 text-orange-500" />,
  Car: <Car className="h-8 w-8 text-purple-500" />,
  Gift: <Gift className="h-8 w-8 text-pink-500" />,
  Default: <Target className="h-8 w-8 text-gray-500" />,
};

const initialGoalFormState: Partial<ContextGoal> = {
  name: '',
  targetAmount: 0,
  currentAmount: 0,
  targetDate: '',
  icon: 'Target',
};

export default function GoalsPage() {
  const { toast } = useToast();
  const { goals, addGoal, updateGoal, deleteGoal, addContribution } = useGoals();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentGoalForForm, setCurrentGoalForForm] = useState<Partial<ContextGoal>>(initialGoalFormState);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(0);

  const openForm = (goal?: ContextGoal) => {
    if (goal) {
      setCurrentGoalForForm({ ...goal, targetDate: goal.targetDate ? format(parseISO(goal.targetDate), 'yyyy-MM-dd') : undefined });
    } else {
      setCurrentGoalForForm(initialGoalFormState);
    }
    setIsFormOpen(true);
  };

  const handleSaveGoal = () => {
    if (!currentGoalForForm || !currentGoalForForm.name || !currentGoalForForm.targetAmount || currentGoalForForm.targetAmount <= 0) {
      toast({ title: "Error", description: "Please fill name and a valid target amount (>0).", variant: "destructive" });
      return;
    }

    const goalDataToSave = {
      name: currentGoalForForm.name,
      targetAmount: Number(currentGoalForForm.targetAmount),
      currentAmount: Number(currentGoalForForm.currentAmount || 0),
      targetDate: currentGoalForForm.targetDate || undefined,
      icon: currentGoalForForm.icon || 'Target',
    };

    if (currentGoalForForm.id) {
      updateGoal({ ...goalDataToSave, id: currentGoalForForm.id });
      toast({ title: "Goal Updated", description: `${goalDataToSave.name} has been updated.` });
    } else {
      addGoal(goalDataToSave);
      toast({ title: "Goal Added", description: `${goalDataToSave.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentGoalForForm(initialGoalFormState);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    toast({ title: "Goal Deleted", description: "Goal has been removed.", variant: "destructive" });
  };

  const openContributionModal = (goalId: string) => {
    setContributionGoalId(goalId);
    setContributionAmount(0);
  };

  const handleAddContribution = () => {
    if (contributionGoalId && contributionAmount > 0) {
      addContribution(contributionGoalId, contributionAmount);
      toast({ title: "Contribution Added", description: `Added ${formatCurrency(contributionAmount, 'USD')} to your goal.` }); // Assuming USD for now
      setContributionGoalId(null);
      setContributionAmount(0);
    } else {
      toast({ title: "Error", description: "Please enter a valid contribution amount.", variant: "destructive"});
    }
  };
  
  const formatCurrency = (value: number, currencyCode: string = 'USD') => {
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const GoalCardComponent = ({ goal }: { goal: ContextGoal }) => {
    const progressPercentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
      setIsCompleted(goal.currentAmount >= goal.targetAmount);
      if (goal.targetDate) {
        const target = parseISO(goal.targetDate);
        if (isValid(target)) {
          setDaysLeft(differenceInDays(target, new Date()));
        } else {
          setDaysLeft(null);
        }
      } else {
        setDaysLeft(null);
      }
    }, [goal.targetDate, goal.currentAmount, goal.targetAmount]);

    const iconNode = goalIcons[goal.icon || 'Default'] || goalIcons.Default;

    return (
      <Card className={`rounded-2xl shadow-lg flex flex-col ${isCompleted ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{goal.name}</CardTitle>
              <CardDescription>Target: {formatCurrency(goal.targetAmount)}</CardDescription>
            </div>
            {isCompleted ? <CheckCircle className="h-8 w-8 text-green-500" /> : iconNode}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex justify-between items-baseline">
            <p className="text-2xl font-semibold">{formatCurrency(goal.currentAmount)}</p>
            <p className="text-sm text-muted-foreground">of {formatCurrency(goal.targetAmount)}</p>
          </div>
          <Progress value={progressPercentage} className="h-3 rounded-lg" indicatorClassName={isCompleted ? 'bg-green-500' : (progressPercentage > 70 ? 'bg-blue-500' : 'bg-blue-400')} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercentage.toFixed(0)}% saved</span>
            {daysLeft !== null && !isCompleted && (
              <span>
                {daysLeft > 0 ? `${daysLeft} days left` : (daysLeft === 0 ? `Due today` : `${Math.abs(daysLeft)} days overdue`)}
              </span>
            )}
             {isCompleted && <span className="text-green-600 font-semibold">Goal Achieved!</span>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openContributionModal(goal.id)} disabled={isCompleted}>
             <DollarSign className="mr-1 h-4 w-4" /> Add Funds
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => openForm(goal)} aria-label="Edit goal">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)} aria-label="Delete goal">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  const availableIcons = Object.keys(goalIcons).filter(icon => icon !== 'Default');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">
            Set and track your financial aspirations.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setCurrentGoalForForm(initialGoalFormState);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{currentGoalForForm?.id ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
              <DialogDescription>
                Define your goal and track its progress.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal-name" className="text-right">Name</Label>
                <Input id="goal-name" value={currentGoalForForm?.name || ''} onChange={(e) => setCurrentGoalForForm(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" placeholder="e.g., New Car Fund"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal-target" className="text-right">Target Amount</Label>
                <Input id="goal-target" type="number" value={currentGoalForForm?.targetAmount || ''} onChange={(e) => setCurrentGoalForForm(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))} className="col-span-3" placeholder="e.g., 20000"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal-current" className="text-right">Current Amount</Label>
                <Input id="goal-current" type="number" value={currentGoalForForm?.currentAmount || ''} onChange={(e) => setCurrentGoalForForm(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))} className="col-span-3" placeholder="e.g., 5000"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal-date" className="text-right">Target Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`col-span-3 justify-start text-left font-normal ${!currentGoalForForm?.targetDate && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentGoalForForm?.targetDate ? format(parseISO(currentGoalForForm.targetDate), "PPP") : <span>Pick a date (Optional)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentGoalForForm?.targetDate ? parseISO(currentGoalForForm.targetDate) : undefined}
                      onSelect={(date) => setCurrentGoalForForm(prev => ({ ...prev, targetDate: date ? format(date, 'yyyy-MM-dd') : undefined}))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="goal-icon" className="text-right">Icon</Label>
                  <select
                    id="goal-icon"
                    value={currentGoalForForm?.icon || 'Target'}
                    onChange={(e) => setCurrentGoalForForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {availableIcons.map(iconKey => (
                        <option key={iconKey} value={iconKey}>{iconKey.replace(/([A-Z])/g, ' $1').trim()}</option>
                    ))}
                  </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSaveGoal}>Save Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog for Add Contribution */}
      <Dialog open={!!contributionGoalId} onOpenChange={(isOpen) => { if (!isOpen) setContributionGoalId(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Add funds to your goal: {goals.find(g => g.id === contributionGoalId)?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contribution-amount" className="text-right">Amount</Label>
              <Input
                id="contribution-amount"
                type="number"
                value={contributionAmount || ''}
                onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                className="col-span-3"
                placeholder="e.g., 100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributionGoalId(null)}>Cancel</Button>
            <Button onClick={handleAddContribution}>Add Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {goals.length === 0 && (
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Zap className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-semibold">No goals set yet!</p>
              <p>Click "Add New Goal" to define your financial aspirations.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <GoalCardComponent key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
