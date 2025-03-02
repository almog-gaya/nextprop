"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoginCredentials } from '@/types/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { flushAllAuthData, setAllAuthData } from '@/lib/authUtils';

export default function Login() {
  const { authState, login } = useAuth();
  const { error: contextError, isLoading } = authState;
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';
  
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'email' | 'apiKey' | 'general' | null>(null);
  
  useEffect(() => {
    setIsSubmitting(false);
    
    // Check if redirected from another page with a message
    const message = searchParams.get('message');
    if (message) {
      setLocalError(decodeURIComponent(message));
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLocalError(null);
    setErrorType(null);
    console.log("Form submitted, setting isSubmitting to true");
    
    if (!email) {
      setLocalError('Email address is required');
      setErrorType('email');
      setIsSubmitting(false);
      return;
    }
    
    if (!apiKey) {
      setLocalError('API key is required');
      setErrorType('apiKey');
      setIsSubmitting(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      setErrorType('email');
      setIsSubmitting(false);
      return;
    }
    
    if (apiKey.length < 20) {
      setLocalError('Please enter a valid API key (min 20 characters)');
      setErrorType('apiKey');
      setIsSubmitting(false);
      return;
    }
    
    try {
      await login({ email, password: apiKey });
      
      // In case login succeeded but redirection is delayed, ensure tokens are properly set
      // This helps ensure consistent authentication state
      const userData = {
        email,
        name: email.split('@')[0],
        apiKey: apiKey
      };
      
      setAllAuthData(userData, apiKey);
    } catch (err) {
      console.error('Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // Determine error type for better visual feedback
      if (errorMessage.toLowerCase().includes('credentials') || 
          errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('not found')) {
        if (errorMessage.toLowerCase().includes('api key')) {
          setErrorType('apiKey');
        } else if (errorMessage.toLowerCase().includes('email')) {
          setErrorType('email');
        } else {
          setErrorType('general');
        }
      }
      
      // Custom error messages for better user experience
      if (errorMessage.includes('Invalid credentials')) {
        setLocalError('Email or API key is incorrect');
      } else if (errorMessage.includes('Invalid API key format')) {
        setLocalError('The API key format is invalid');
        setErrorType('apiKey');
      } else {
        setLocalError(errorMessage);
      }
    } finally {
      console.log("Login attempt completed, setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };
  
  const handleFlushAuth = () => {
    flushAllAuthData();
    // Reset form fields
    setEmail('');
    setApiKey('');
    // Show confirmation
    setLocalError('All authentication data has been cleared.');
    setErrorType('general');
  };
  
  const buttonText = isSubmitting ? 'Signing in...' : 'Sign in';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">Sign in to NextProp.ai</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        
        {localError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{localError}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errorType === 'email' ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errorType === 'email' && (
                <p className="mt-1 text-xs text-red-600" id="email-error">
                  {localError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                id="api-key"
                name="apiKey"
                type="text"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errorType === 'apiKey' ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                placeholder="Enter your GoHighLevel API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              {errorType === 'apiKey' && (
                <p className="mt-1 text-xs text-red-600" id="api-key-error">
                  {localError}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Forgot your API key?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
            >
              {isSubmitting && (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-indigo-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
              {buttonText}
            </button>
          </div>
          
          <div className="mt-2 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p>
              For demo purposes, use:
              <br />
              <span className="font-mono font-medium">demo@nextprop.ai</span> with 
              <span className="font-mono font-medium"> demo-ghl-api-key-123</span>
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleFlushAuth}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Flush All Auth Data (For Testing)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 