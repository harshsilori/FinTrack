
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loadingAuthState: boolean;
  signUpWithEmail: (email: string, pass: string) => Promise<User | null>;
  logInWithEmail: (email: string, pass: string) => Promise<User | null>;
  logOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuthState(false);
    });
    return () => unsubscribe();
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Sign Up Successful", description: "Welcome!" });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing up:", authError);
      toast({ title: "Sign Up Failed", description: authError.message || "An unknown error occurred.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const logInWithEmail = useCallback(async (email: string, pass: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Login Successful", description: "Welcome back!" });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging in:", authError);
      toast({ title: "Login Failed", description: authError.message || "Invalid email or password.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const logOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error logging out:", authError);
      toast({ title: "Logout Failed", description: authError.message || "An error occurred during logout.", variant: "destructive" });
    }
  }, [toast]);

  const value = {
    currentUser,
    loadingAuthState,
    signUpWithEmail,
    logInWithEmail,
    logOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
