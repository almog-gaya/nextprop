"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignupCredentials } from '@/types/auth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { flushAllAuthData } from '@/lib/authUtils';
import { supabase } from '@/lib/supabase';

// Mock users for demonstration (in a real app, this would be in a database)
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'demo@nextprop.ai',
    name: 'Demo User',
    ghlApiKey: 'demo-ghl-api-key-123',
    ghlLocationId: 'demo-location-123',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

// Initial auth state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Create the auth context
const AuthContext = createContext<{
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  updateGhlApiKey: (apiKey: string, locationId?: string) => Promise<void>;
}>({
  authState: initialState,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateGhlApiKey: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get auth data from cookies first
        const token = Cookies.get('nextprop_token');
        const storedUser = localStorage.getItem('nextprop_user');
        
        if (token && storedUser) {
          const user = JSON.parse(storedUser) as User;
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setAuthState({
            ...initialState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          ...initialState,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First, validate the API key format
      const apiKey = credentials.password;
      
      // Basic validation - ensure key exists and has reasonable length
      if (!apiKey || apiKey.length < 20) {
        throw new Error('Invalid API key format: Key must be at least 20 characters');
      }
      
      // Check for JWT format (three parts separated by dots)
      const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      
      // Check for traditional API key format
      const apiKeyPattern = /^[a-zA-Z0-9_-]{20,}$/;
      
      // Validate the API key format
      const isValidFormat = jwtPattern.test(apiKey) || apiKeyPattern.test(apiKey);
      if (!isValidFormat) {
        throw new Error('Invalid API key format: Does not match expected format');
      }
      
      // In a real app, this would be an API call
      // For demonstration, we're using mock data
      const user = MOCK_USERS.find(u => u.email === credentials.email);
      
      if (!user) {
        throw new Error('Account not found. Please check your email or create a new account');
      }
      
      // Verify the password/apiKey (this is where we're fixing the security issue)
      if (user.ghlApiKey !== apiKey) {
        throw new Error('Invalid API key. Please check your API key and try again');
      }
      
      // Update last login
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem('nextprop_user', JSON.stringify(updatedUser));
      
      // Set the token in both localStorage and cookies
      localStorage.setItem('nextprop_token', 'mock-jwt-token');
      Cookies.set('nextprop_token', 'mock-jwt-token', { 
        expires: 7, // 7 days
        path: '/',
        sameSite: 'strict'
      });
      
      setAuthState({
        user: updatedUser,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
      
      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
    }
  };

  // Signup function
  const signup = async (credentials: SignupCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First, validate the API key format
      const apiKey = credentials.password;
      
      // Basic validation - ensure key exists and has reasonable length
      if (!apiKey || apiKey.length < 20) {
        throw new Error('Invalid API key format: Key must be at least 20 characters');
      }
      
      // Check for JWT format (three parts separated by dots)
      const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      
      // Check for traditional API key format
      const apiKeyPattern = /^[a-zA-Z0-9_-]{20,}$/;
      
      // Validate the API key format
      const isValidFormat = jwtPattern.test(apiKey) || apiKeyPattern.test(apiKey);
      if (!isValidFormat) {
        throw new Error('Invalid API key format: Does not match expected format');
      }
      
      // Check if user already exists
      if (MOCK_USERS.find(u => u.email === credentials.email)) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      // Create new user
      const newUser: User = {
        id: String(MOCK_USERS.length + 1),
        email: credentials.email,
        name: credentials.name,
        ghlApiKey: apiKey,
        ghlLocationId: credentials.ghlLocationId,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      // In a real app, we would add the user to the database
      // For demo purposes, we're just adding to the MOCK_USERS array
      MOCK_USERS.push(newUser);
      
      // Store in localStorage
      localStorage.setItem('nextprop_user', JSON.stringify(newUser));
      
      // Set the token in both localStorage and cookies
      localStorage.setItem('nextprop_token', 'mock-jwt-token');
      Cookies.set('nextprop_token', 'mock-jwt-token', { 
        expires: 7, // 7 days
        path: '/',
        sameSite: 'strict'
      });
      
      setAuthState({
        user: newUser,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
      
      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Signup failed',
      }));
    }
  };

  // Logout function
  const logout = async () => {

    /// logout via supabase
    // Clear token from cookies
    Cookies.remove('nextprop_token');
  
    const { error } = await supabase.auth.signOut()
    console.log(`Complete logout: ${error}`)

    // Use our utility to clear all auth data
    flushAllAuthData();
    
    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null
    });
    
    // Navigate to login
    router.push('/auth/login');
  };

  // Update GHL API key
  const updateGhlApiKey = async (apiKey: string, locationId?: string) => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      const updatedUser = {
        ...authState.user,
        ghlApiKey: apiKey,
        ghlLocationId: locationId || authState.user.ghlLocationId,
      };
      
      // In a real app, we would update the user in the database
      
      // Update localStorage
      localStorage.setItem('nextprop_user', JSON.stringify(updatedUser));
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error: any) {
      console.error('Update API key error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        signup,
        logout,
        updateGhlApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 