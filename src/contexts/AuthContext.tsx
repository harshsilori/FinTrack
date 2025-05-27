
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simple pseudo-hashing for demonstration. NOT FOR PRODUCTION.
const pseudoHashPassword = (password: string): string => {
  try {
    // A simple transformation. Replace with a real hashing library for production.
    return `localProtoHash|${password.split('').reverse().join('')}|${password.length}`;
  } catch (e) {
    // Fallback for environments where btoa might not be ideal or available (though unlikely for modern browsers)
    return `fallback|${password.split('').reverse().join('')}|${password.length}`;
  }
};

const USER_STORAGE_KEY = 'finTrackLocalUsers';
const CURRENT_USER_SESSION_KEY = 'finTrackCurrentUserEmail';

interface LocalUser {
  email: string;
  // passwordHash: string; // Storing plain password for this simplified local prototype as hashing comparison is tricky without libraries.
  // IN A REAL APP, NEVER STORE PLAIN PASSWORDS. HASH THEM.
  password: string; // Storing plain password for simplicity in this prototype.
}

interface CurrentUser {
  email: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  loadingAuthState: boolean;
  signUpWithEmail: (email: string, pass: string) => Promise<CurrentUser | null>;
  logInWithEmail: (email: string, pass: string) => Promise<CurrentUser | null>;
  logOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);
  const { toast } = useToast();

  const getLocalUsers = (): LocalUser[] => {
    try {
      const usersJson = localStorage.getItem(USER_STORAGE_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error("Error reading users from localStorage", error);
      return [];
    }
  };

  const saveLocalUsers = (users: LocalUser[]) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users to localStorage", error);
    }
  };

  useEffect(() => {
    // Check for an existing session on mount
    try {
      const loggedInUserEmail = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (loggedInUserEmail) {
        const users = getLocalUsers();
        const existingUser = users.find(u => u.email === loggedInUserEmail);
        if (existingUser) {
          setCurrentUser({ email: loggedInUserEmail });
        } else {
          // Clean up if session user doesn't exist in users list anymore
          localStorage.removeItem(CURRENT_USER_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Error reading current user from localStorage", error);
    }
    setLoadingAuthState(false);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string): Promise<CurrentUser | null> => {
    setLoadingAuthState(true);
    const users = getLocalUsers();
    const emailLowerCase = email.toLowerCase();

    if (users.find(u => u.email.toLowerCase() === emailLowerCase)) {
      toast({ title: "Sign Up Failed", description: "Email already exists.", variant: "destructive" });
      setLoadingAuthState(false);
      return null;
    }

    // const passwordHash = pseudoHashPassword(pass); // In a real app, use this
    // For prototype simplicity, storing plain password.
    const newUser: LocalUser = { email: emailLowerCase, password: pass };
    
    users.push(newUser);
    saveLocalUsers(users);

    const newCurrentUser = { email: emailLowerCase };
    setCurrentUser(newCurrentUser);
    try {
      localStorage.setItem(CURRENT_USER_SESSION_KEY, emailLowerCase);
    } catch (error) {
        console.error("Error setting current user in localStorage", error);
    }
    
    toast({ title: "Sign Up Successful", description: "Welcome!" });
    setLoadingAuthState(false);
    return newCurrentUser;
  }, [toast]);

  const logInWithEmail = useCallback(async (email: string, pass: string): Promise<CurrentUser | null> => {
    setLoadingAuthState(true);
    const users = getLocalUsers();
    const emailLowerCase = email.toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === emailLowerCase);

    if (!user) {
      toast({ title: "Login Failed", description: "User not found.", variant: "destructive" });
      setLoadingAuthState(false);
      return null;
    }

    // const inputPasswordHash = pseudoHashPassword(pass); // In a real app, compare hashes
    // Comparing plain passwords for prototype.
    if (user.password === pass) {
      const newCurrentUser = { email: user.email };
      setCurrentUser(newCurrentUser);
      try {
        localStorage.setItem(CURRENT_USER_SESSION_KEY, user.email);
      } catch (error) {
        console.error("Error setting current user in localStorage", error);
      }
      toast({ title: "Login Successful", description: "Welcome back!" });
      setLoadingAuthState(false);
      return newCurrentUser;
    } else {
      toast({ title: "Login Failed", description: "Invalid password.", variant: "destructive" });
      setLoadingAuthState(false);
      return null;
    }
  }, [toast]);

  const logOutUser = useCallback(async () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    } catch (error) {
      console.error("Error removing current user from localStorage", error);
    }
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
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
