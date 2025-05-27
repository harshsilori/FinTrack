
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert ArrayBuffer to hex string
async function arrayBufferToHex(buffer: ArrayBuffer): Promise<string> {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map(value => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });
  return hexCodes.join('');
}

// Async function to hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToHex(hashBuffer);
}


const USER_STORAGE_KEY = 'finTrackLocalUsers_v2'; // Changed key due to new password format
const CURRENT_USER_SESSION_KEY = 'finTrackCurrentUserEmail_v2';

interface LocalUser {
  email: string;
  passwordHash: string; // Changed from plain password
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
    try {
      const loggedInUserEmail = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (loggedInUserEmail) {
        const users = getLocalUsers();
        const existingUser = users.find(u => u.email === loggedInUserEmail);
        if (existingUser) {
          setCurrentUser({ email: loggedInUserEmail });
        } else {
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
    if (pass.length < 6) {
        toast({ title: "Sign Up Failed", description: "Password must be at least 6 characters long.", variant: "destructive" });
        setLoadingAuthState(false);
        return null;
    }

    const newPasswordHash = await hashPassword(pass);
    const newUser: LocalUser = { email: emailLowerCase, passwordHash: newPasswordHash };
    
    users.push(newUser);
    saveLocalUsers(users);

    const newCurrentUser = { email: emailLowerCase };
    setCurrentUser(newCurrentUser);
    try {
      localStorage.setItem(CURRENT_USER_SESSION_KEY, emailLowerCase);
    } catch (error) {
        console.error("Error setting current user in localStorage", error);
    }
    
    toast({ title: "Sign Up Successful", description: "Welcome! Your password has been securely stored. (Note: Old accounts require re-registration)" });
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

    const inputPasswordHash = await hashPassword(pass);
    if (user.passwordHash === inputPasswordHash) {
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
