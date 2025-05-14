'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const email = searchParams.get('email');

  const handleGetStarted = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'stripe@test.com',
          isOnboarding: true
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Thank You for Registering!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We've received your registration for {email || 'your account'}.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">
                What's Next?
              </h2>
              <ul className="text-left text-gray-600 space-y-3">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>We're currently processing your A2P verification</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You'll receive a confirmation email with your login credentials once your account is fully ready</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>This process typically takes 3-5 business days</span>
                </li>
              </ul>
            </div>
            <p className="text-gray-600 mb-8">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to NextProp
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Your all-in-one solution for real estate property management and lead generation
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Smart Lead Management</h3>
              <p className="text-gray-600">Efficiently track and manage your real estate leads</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Automated Communication</h3>
              <p className="text-gray-600">Stay connected with clients through automated messaging</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Property Analytics</h3>
              <p className="text-gray-600">Get insights into your property performance</p>
            </Card>
          </div>

          <div className="space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleGetStarted}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Get Started'}
                </Button>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 