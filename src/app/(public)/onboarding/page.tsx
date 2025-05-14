'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const email = searchParams.get('email');
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleGetStarted = () => {
    router.push('/register');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8e1e7] via-[#e3e6fa] to-[#c7e6fa]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#3b2fd6] mb-2">Welcome to NextProp</h1>
          <p className="text-xl text-gray-700 mb-8">Your all-in-one solution for real estate property management and lead generation</p>

          <h2 className="text-3xl font-bold text-[#3b2fd6] mb-2">Pricing Plans</h2>
          <p className="text-lg text-gray-700 mb-12">Choose the plan that fits your real estate business needs</p>
          <div className="relative flex flex-col md:flex-row justify-center items-center mb-8">
            {/* Basic Card Group */}
            <div
              className={`flex flex-col items-center relative md:-mr-6 transition-transform duration-300 cursor-pointer
                ${hoveredCard === 'basic' ? 'z-30 -translate-y-4' : 'z-10'}
              `}
              style={{ width: '290px', minWidth: '220px', maxWidth: '100%' }}
              onMouseEnter={() => setHoveredCard('basic')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card
                className="flex flex-col justify-between p-8 rounded-2xl shadow-xl bg-black border-2 border-black w-full h-[480px]"
              >
                <div>
                  <span className="text-2xl font-bold text-white">Basic</span>
                  <p className="text-sm font-semibold text-white mb-4 mt-6">Perfect for solo entrepreneurs</p>
                  <ul className="text-white text-left mb-6 space-y-2">
                    <li>1 AI Agent</li>
                    <li>1 Pipeline/Campaign</li>
                    <li>1 Phone number</li>
                    <li>250 Free scraping Properties & Agents info</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xl font-bold text-white mb-1">Free Trial - 7 Days Access</div>
                </div>
              </Card>
              <div className="mt-2 mb-4 mx-8 text-xs text-black font-bold text-center w-auto transition-all duration-300">
                <div>NO Setup Fee - Fully customized system in 3-5 days.</div>
                <div>No long-term commitment. Cancel anytime.</div>
              </div>
            </div>
            {/* Pro Card Group */}
            <div
              className={`flex flex-col items-center relative transition-transform duration-300 cursor-pointer
                ${hoveredCard === 'pro' ? 'z-30 -translate-y-4' : 'z-20'}
              `}
              style={{ width: '290px', minWidth: '220px', maxWidth: '100%' }}
              onMouseEnter={() => setHoveredCard('pro')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card
                className="relative flex flex-col justify-between p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#7b5cff] to-[#4f2ccf] border-4 border-[#b7aaff] text-white scale-105 w-full h-[480px]"
              >
                <span className="absolute top-4 right-4 bg-[#ffb800] text-xs font-bold px-3 py-1 rounded-full text-[#4f2ccf] shadow">Recommended</span>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <p className="text-sm font-semibold mb-4">For teams of 2-5 members</p>
                  <ul className="text-white/90 text-left mb-6 space-y-2">
                    <li>3 AI Agents</li>
                    <li>3 Pipelines/Campaigns</li>
                    <li>Bulk Email Feature for Submitting Low Offers</li>
                    <li>VIP Support - Done for You</li>
                    <li>1,000 Free scraping Properties & Agents info</li>
                  </ul>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">$697</div>
                  <div className="mb-2">Per Month</div>
                </div>
              </Card>
              <div className="pt-4 mb-4 mx-8 text-xs text-[#3b2fd6] text-center w-auto transition-all duration-300">
                <div>Scraping contacts, SMS, emails, calls, and phone numbers are billed separately based on usage.</div>
              </div>
            </div>
            {/* Enterprise Card Group */}
            <div
              className={`flex flex-col items-center relative md:-ml-6 transition-transform duration-300 cursor-pointer
                ${hoveredCard === 'enterprise' ? 'z-30 -translate-y-4' : 'z-10'}
              `}
              style={{ width: '290px', minWidth: '220px', maxWidth: '100%' }}
              onMouseEnter={() => setHoveredCard('enterprise')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card
                className="flex flex-col justify-between p-8 rounded-2xl shadow-xl bg-gradient-to-br from-[#ffe9b3] via-[#ffd700] to-[#ffb800] border-2 border-[#ffd700] w-full h-[480px]"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#b48800] mb-2">Enterprise</h3>
                  <p className="text-sm font-semibold text-[#b48800] mb-4">For larger teams of 5+ members</p>
                  <ul className="text-[#b48800] text-left mb-6 space-y-2">
                    <li>25 AI Agents</li>
                    <li>25 Pipelines/Campaigns</li>
                    <li>VIP Support &gt; DONE FOR YOU</li>
                    <li>10,000 Free Scraping Deals & Contacts</li>
                  </ul>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#b48800] mb-1">$1,499</div>
                  <div className="text-[#b48800] mb-2">Per Month</div>
                </div>
              </Card>
              <div className="mt-2 mb-4 mx-8 text-xs text-[#b48800] text-center w-auto transition-all duration-300">
                <div>Add an additional AI agent for just $97/month</div>
              </div>
            </div>
          </div>

          <div className="space-x-4 mb-8">
            {user ? (
              <Link href="/">
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