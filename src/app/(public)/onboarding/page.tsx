'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// Modal Component
function RegisterModal({ isOpen, onClose, plan, onSubmit }: {
  isOpen: boolean,
  onClose: () => void,
  plan: string,
  onSubmit: (data: { name: string, phone: string, email: string, plan: string }) => void
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, phone, email, plan });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Register for {plan} Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400">
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Proceed to checkout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Component to handle search params
function OnboardingContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const email = searchParams.get('email');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPlan = (planType: 'basic' | 'pro' | 'enterprise') => {
    setSelectedPlan(planType);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: { name: string, phone: string, email: string, plan: string }) => {
    setIsLoading(true);
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        isOnboarding: true,
        data: {
          plan: data.plan,
          name: data.name,
          phone: data.phone,
          email: data.email,
        }
      }),
    });

    const result = await response.json();

    if (result.url) {
      
      // store session in firestore
      const customerRef = doc(db, 'customers', data.email.toLowerCase());

      await setDoc(customerRef, {
        ...result,
      }, { merge: true });
      window.location.href = result.url;
    }
    setIsLoading(false);
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
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Pricing Plans</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Nextprop handles it all—no extra tools required. All plans include
            Live Zoom, Live Chat, Phone & SMS support.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 mb-12">
            {/* Basic Plan */}
            <Card
              className={`w-full md:w-80 shadow-lg border rounded-lg overflow-hidden flex flex-col h-auto transition-all duration-300 ${hoveredCard === 'basic' ? 'transform -translate-y-2 shadow-xl' : ''
                }`}
              onMouseEnter={() => setHoveredCard('basic')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="p-6 flex-grow">
                <h2 className="text-2xl font-bold text-purple-600 mb-4">Basic</h2>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$149</span>
                  <span className="text-gray-600">/mo</span>
                </div>
                <p className="text-gray-600 mb-4">Perfect for solopreneurs</p>
                <ul className="space-y-3 mb-6 text-left">
                  <li>1 AI Agent</li>
                  <li>1 Pipeline Configuration</li>
                  <li>1 Phone Number</li>
                </ul>
              </div>
              <div className="p-6 bg-gray-50 flex flex-col items-center mt-auto">
                <Button
                  onClick={() => handleSelectPlan('basic')}
                  disabled={isLoading || selectedPlan === 'basic'}
                  className="w-full bg-black text-white hover:bg-gray-800 mb-3"
                >
                  {isLoading && selectedPlan === 'basic' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                </Button>
                <p className="text-xs text-gray-500 text-center">Fast and Free Setup. Cancel Anytime.</p>
              </div>
            </Card>

            {/* Pro Plan */}
            <Card
              className={`w-full md:w-80 shadow-lg border-2 border-[#3045FF] rounded-lg overflow-hidden flex flex-col relative z-10 h-auto transition-all duration-300 ${hoveredCard === 'pro' ? 'transform -translate-y-2 shadow-xl' : ''
                }`}
              onMouseEnter={() => setHoveredCard('pro')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-4 right-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">Most Popular</span>
              </div>
              <div className="p-6 flex-grow bg-gradient-to-r from-[#3045FF] to-[#9A04FF]">
                <h2 className="text-2xl font-bold text-white mb-4">Pro</h2>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$299</span>
                  <span className="text-blue-200">/mo</span>
                </div>
                <p className="text-blue-100 mb-4">For teams of 2-5 members</p>
                <ul className="space-y-3 mb-6 text-left text-white">
                  <li>1 AI Agent</li>
                  <li>1 Pipeline Configuration</li>
                  <li>1 Phone Number</li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-r from-[#3045FF] to-[#9A04FF] flex flex-col items-center mt-auto">
                <Button
                  onClick={() => handleSelectPlan('pro')}
                  disabled={isLoading || selectedPlan === 'pro'}
                  className="w-full bg-[#ff4d4d] text-white hover:bg-red-500 mb-3"
                >
                  {isLoading && selectedPlan === 'pro' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                </Button>
                <p className="text-xs text-white text-center">Fast and Free Setup. Cancel Anytime.</p>
              </div>
            </Card>

            {/* Enterprise Plan */}
            <Card
              className={`w-full md:w-80 shadow-lg border rounded-lg overflow-hidden flex flex-col relative h-auto transition-all duration-300 ${hoveredCard === 'enterprise' ? 'transform -translate-y-2 shadow-xl' : ''
                }`}
              onMouseEnter={() => setHoveredCard('enterprise')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">Most Value</span>
              </div>
              <div className="p-6 flex-grow bg-gradient-to-b from-[#ffd166] to-[#ffe699]">
                <h2 className="text-2xl font-bold text-[#835c00] mb-4">Enterprise</h2>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#835c00]">$599</span>
                  <span className="text-[#835c00]">/mo</span>
                </div>
                <p className="text-[#835c00] mb-4">For larger teams of 5+ members</p>
                <ul className="space-y-3 mb-6 text-left text-[#835c00]">
                  <li>1 AI Agent</li>
                  <li>1 Pipeline Configuration</li>
                  <li>1 Phone Number</li>
                </ul>
              </div>
              <div className="p-6 bg-gray-50 flex flex-col items-center mt-auto">
                <Button
                  onClick={() => handleSelectPlan('enterprise')}
                  disabled={isLoading || selectedPlan === 'enterprise'}
                  className="w-full bg-black text-white hover:bg-gray-800 mb-3"
                >
                  {isLoading && selectedPlan === 'enterprise' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                </Button>
                <p className="text-xs text-gray-500 text-center">Fast and Free Setup. Cancel Anytime.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {selectedPlan && (
        <RegisterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plan={selectedPlan}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Loading...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}