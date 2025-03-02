"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { validateApiKey, createGhlApiClient } from '@/lib/enhancedApi';
import { flushAllAuthData } from '@/lib/authUtils';

// Define User type
interface User {
  email: string;
  apiKey: string;
  name: string;
  locationId?: string;
}

// Define Auth Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, apiKey: string) => Promise<void>;
  register: (email: string, apiKey: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  handleApiError: (error: any) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage if available
    const loadUser = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    };
    
    loadUser();
  }, []);

  // Test API key validity safely
  const testApiKeyValidity = async (apiKey: string): Promise<boolean> => {
    try {
      // Make a lightweight API call to test validity
      const client = createGhlApiClient(apiKey);
      await client.get('/contacts', { params: { limit: 1 } });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      // For other errors (like rate limiting), assume key might be valid
      console.warn('Error testing API key validity', error);
      return true;
    }
  };

  // Update the registration function to auto-login
  const register = async (email: string, apiKey: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to register with API key:', apiKey.substring(0, 10) + '...');
      
      // Check if validateApiKey is defined
      if (typeof validateApiKey !== 'function') {
        console.error('validateApiKey is not a function!', validateApiKey);
        throw new Error('System error: API key validation function is not available');
      }
      
      // Validate API key format
      const isValidFormat = validateApiKey(apiKey);
      console.log('API key format validation result:', isValidFormat);
      
      if (!isValidFormat) {
        throw new Error('Invalid API key format');
      }
      
      // Test API key validity with a real request
      const isValid = await testApiKeyValidity(apiKey);
      if (!isValid) {
        throw new Error('Invalid API key. Please check and try again.');
      }
      
      // Try to extract location_id from JWT if available
      let locationId = '';
      try {
        // JWT tokens are in format header.payload.signature
        // We need to decode the payload (part 2)
        const parts = apiKey.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.location_id) {
            locationId = payload.location_id;
            console.log('Extracted location ID from JWT:', locationId);
          }
        }
      } catch (e) {
        console.warn('Could not extract location ID from JWT', e);
      }
      
      // Create user object
      const userData = {
        email,
        apiKey,
        name: email.split('@')[0],
        locationId, // Store the location ID if extracted
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      // Set user in state
      setUser(userData);
      
      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Modify login to be identical to register for consistency
  const login = register;

  const logout = () => {
    flushAllAuthData(); // Use the utility function to clear all auth data
    setUser(null);
    router.push('/auth/login');
  };

  const handleApiError = (error: any) => {
    console.error('API error:', error);
    
    // Check for authentication errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setError('Your API key is invalid or expired. Please login again.');
      logout();
      return;
    }
    
    // Handle rate limiting
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      setError('Rate limit exceeded. Please try again in a few minutes.');
      return;
    }
    
    // Generic error
    setError('An error occurred. Please try again.');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login,
      register,
      logout, 
      setError,
      handleApiError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create and export the useAuth hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Also export the context itself if needed
export default AuthContext; 