"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoginCredentials } from '@/types/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { flushAllAuthData, setAllAuthData } from '@/lib/authUtils';
import { getAuthUrl } from '@/lib/ghlAuth';

function LoginForm() {
  const { authState, login } = useAuth();
  const { error: contextError, isLoading } = authState;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're coming from OAuth callback
    const from = searchParams.get('from');
    if (from === '/oauth/callback') {
      // Redirect back to GHL auth
      const redirectToGHL = async () => {
        try {
          const authUrl = await getAuthUrl();
          window.location.href = authUrl;
        } catch (error) {
          console.error('Failed to get auth URL:', error);
        }
      };
      redirectToGHL();
    }
  }, [searchParams]);

  const from = searchParams.get('from') || '/';
  
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'email' | 'apiKey' | 'general' | null>(null);
  const [showAdminOptions, setShowAdminOptions] = useState(false);
  
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

  const toggleAdminOptions = () => {
    setShowAdminOptions(!showAdminOptions);
  };
  
  const buttonText = isSubmitting ? 'Signing in...' : 'Sign in';
  
  const handleOAuthLogin = () => {
    setIsSubmitting(true);
    window.location.href = getAuthUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-md border-t-4 border-[#7c3aed]">
        <div>
          <h2 className="text-center text-3xl font-bold text-[#1e1b4b]">Sign in to NextProp.ai</h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors">
              create a new account
            </Link>
          </p>
        </div>

        {/* Add OAuth button here */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleOAuthLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
            </svg>
            Connect with GoHighLevel
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with API key</span>
            </div>
          </div>
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
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errorType === 'email' ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errorType === 'email' && (
                <p className="mt-1 text-xs text-red-600" id="email-error">
                  {localError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-1.243-.243A6 6 0 1118 8zm-6-4a1 1 0 10-2 0v1a1 1 0 102 0V4zm1 5a1 1 0 10-2 0v1a1 1 0 102 0V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="api-key"
                  name="apiKey"
                  type="text"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errorType === 'apiKey' ? 'border-red-300 ring-1 ring-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm`}
                  placeholder="Enter your GoHighLevel API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
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
                className="h-4 w-4 text-[#7c3aed] focus:ring-[#7c3aed] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors">
                Forgot your API key?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="nextprop-button w-full flex justify-center"
            >
              {isSubmitting && (
                <span className="mr-2">
                  <svg className="loader h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
              {buttonText}
            </button>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-500 bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="font-medium text-gray-600 mb-2">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-mono text-[#7c3aed] text-xs">demo@nextprop.ai</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-mono text-[#7c3aed] text-xs">demo-ghl-api-key-123</span>
              </div>
            </div>
          </div>

          {/* Admin tools as a dropdown in corner */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleAdminOptions}
              className="absolute bottom-0 right-0 text-xs text-gray-400 hover:text-gray-600 flex items-center"
              aria-label="Admin options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            
            {showAdminOptions && (
              <div className="absolute bottom-6 right-0 bg-white p-2 rounded shadow-md border border-gray-200 z-10 w-40">
                <button
                  type="button"
                  onClick={handleFlushAuth}
                  className="w-full text-left text-xs text-gray-600 hover:bg-gray-100 p-1 rounded"
                >
                  Flush All Auth Data
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading login page...</div>}>
      <LoginForm />
    </Suspense>
  );
}