"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getCurrentUser } from '../lib/supabase';
import { getBusinessByUserId, createBusinessForUser } from '../lib/client-business';
import { Business } from '../types/database';

type AuthResult = {
  data?: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  business: Business | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, businessName: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for active session on initial load
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get session and user
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          
          // Get the business associated with this user
          if (user) {
            const businessData = await getBusinessByUserId(user.id);
            setBusiness(businessData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const businessData = await getBusinessByUserId(session.user.id);
          setBusiness(businessData);
        } else {
          setBusiness(null);
        }
        
        // Force refresh to update UI
        router.refresh();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Sign in handler
  const handleSignIn = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      
      if (data?.user) {
        const businessData = await getBusinessByUserId(data.user.id);
        setBusiness(businessData);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up handler
  const handleSignUp = async (email: string, password: string, businessName: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      // Create the auth account
      const { data, error } = await signUp(email, password, {
        business_name: businessName,
      });
      
      if (error) {
        return { data, error };
      }
      
      if (data?.user) {
        // Create a business record for this user
        const businessData = await createBusinessForUser(data.user.id, {
          name: businessName,
          contact_email: email,     
          phone_number: '', 
          status: 'verified',
          verification_attempts: 0,
        });
        
        setBusiness(businessData);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (!error) {
        setUser(null);
        setSession(null);
        setBusiness(null);
        router.push('/login');
      }
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as AuthError };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    business,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Also export the context itself if needed
export default AuthContext; 