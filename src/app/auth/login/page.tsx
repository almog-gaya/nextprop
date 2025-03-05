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
        </div>
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