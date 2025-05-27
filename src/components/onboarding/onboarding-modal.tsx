
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  imageSrc: string;
  // imageHint removed
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to FinTrack Mobile!",
    description: "Your personal finance companion. Let's take a quick tour of what you can do.",
    imageSrc: "https://placehold.co/600x400.png",
  },
  {
    title: "All Your Finances in One Place",
    description: "Manually track assets like bank accounts, stocks, and crypto. Log your income and expenses with ease.",
    imageSrc: "https://placehold.co/600x400.png",
  },
  {
    title: "Budget Smarter, Reach Goals Faster",
    description: "Create budgets to manage spending and set financial goals to save for what matters most.",
    imageSrc: "https://placehold.co/600x400.png",
  },
  {
    title: "Unlock Financial Wisdom",
    description: "Get AI-driven insights on savings opportunities and assess your financial health.",
    imageSrc: "https://placehold.co/600x400.png",
  },
  {
    title: "You're All Set!",
    description: "You're ready to take control of your finances. Tip: You can load sample data from the Settings page to explore features quickly.",
    imageSrc: "https://placehold.co/600x400.png",
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = onboardingSteps[currentStep];

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && currentStep < onboardingSteps.length -1) {/* Prevent closing unless finished */} else if (!open) {onComplete()} }}>
      <DialogContent className="sm:max-w-[520px] p-0" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="relative w-full h-48 sm:h-64">
          <Image
            src={step.imageSrc}
            alt={step.title}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            // data-ai-hint removed
          />
        </div>
        <DialogHeader className="p-6 text-left">
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-md text-muted-foreground">
            {step.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row justify-between items-center p-6 border-t">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            Step {currentStep + 1} of {onboardingSteps.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
            {currentStep < onboardingSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={onComplete}>
                Get Started <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
