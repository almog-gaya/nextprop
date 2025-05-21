'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6">
      {/* Gradient border wrapper */}
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#3045FF] to-[#9A04FF] p-[1px] shadow-2xl">
        {/* Actual white card */}
        <div className="rounded-[inherit] bg-white py-8 px-6 sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900">
            Register for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3045FF] to-[#9A04FF]">{plan}</span> Plan
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label htmlFor="phone" className="mb-1 text-sm font-medium text-gray-700">Phone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label htmlFor="email" className="mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg bg-gray-100 px-6 text-sm font-semibold text-gray-700 shadow hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-lg bg-gradient-to-r from-[#3045FF] to-[#9A04FF] px-6 text-sm font-semibold text-white shadow hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-[#9A04FF]"
              >
                Proceed to Checkout
              </Button>
            </div>
          </form>
        </div>
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
              If you have any questions, please don't hesitate to contact our support team. at support@nextprop.ai or +1 (929) 595-3158
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

  // --------------------------- ICON HELPERS ---------------------------
  const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );

  // --------------------------- DATA ---------------------------
  const commonFeatures = [
    'Free Skip Tracing',
    'Free Cash Buyer Searches',
    'Drip Campaign',
    'Direct Mail',
    'Call, Text and Email',
    'List Stacking',
    'Gmail Integration',
    'KPI Dashboard',
    'SEO Optimised Website',
    'Driving For Dollars',
    'E-signature',
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#7c3aed] overflow-x-hidden">
      

      {/* Main content */}
      <main className="w-full overflow-x-hidden">
        <div className="container mx-auto px-4 py-10 transform origin-top">
          <div className="text-center mx-auto ">
            <h1 className="text-6xl md:text-8xl font-extrabold leading-none text-white mb-6">Pricing Plans</h1>
            <p className="text-lg md:text-2xl ">
              Nextprop handles it all—no extra tools required.
              <br />
              All plans include Live Zoom, Live Chat, Phone &amp; SMS support.
            </p>
          </div>

          <div className="mt-12 flex flex-col lg:flex-row gap-10 lg:items-start">
            {/* ---------------- Included in All Plans ---------------- */}
            <div className="-mt-8 w-full lg:w-72 rounded-3xl bg-gradient-to-br from-[#3045FF] to-[#9A04FF] p-6 text-white shadow-xl">
              <h3 className="text-2xl font-bold text-center mb-6">Included In All Plans</h3>
              <ul className="space-y-4">
                {commonFeatures.map((feature) => (
                  <li key={feature} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <CheckIcon className="w-5 h-5 mr-3" />
                      {feature}
                    </span>
                    {/* Optional info icon */}
                    <InfoIcon className="w-4 h-4 opacity-70" />
                  </li>
                ))}
              </ul>
            </div>

            {/* ---------------- Pricing Cards ---------------- */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Basic */}
              <div
                className="relative rounded-3xl bg-white p-6 shadow-lg flex flex-col hover:shadow-xl transition"
                onMouseEnter={() => setHoveredCard('basic')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <h3 className="text-purple-700 font-semibold text-lg mb-2">Basic</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">$149</span>
                  <span className="text-gray-700 ml-1">/mo</span>
                </div>
                <p className="text-gray-600 mb-4">Perfect for solopreneurs</p>
                <ul className="text-gray-600 space-y-2 mb-8">
                  <li>1 AI Agent</li>
                  <li>1 Pipeline Configuration</li>
                  <li>1 Phone Number</li>
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSelectPlan('basic')}
                    disabled={isLoading || selectedPlan === 'basic'}
                    className="w-full bg-[#7c3aed]  hover:bg-[#6d28d9] text-white py-3 text-sm"
                  >
                    {isLoading && selectedPlan === 'basic' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-3">Fast and Free Setup. Cancel Anytime.</p>
                </div>
              </div>

              {/* Pro */}
              <div
                className="relative rounded-3xl bg-gradient-to-br from-[#3045FF] to-[#9A04FF] p-6 shadow-lg flex flex-col text-white hover:shadow-xl transition"
                onMouseEnter={() => setHoveredCard('pro')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <span className="absolute top-4 right-4 bg-white/90 text-gray-700 text-xs font-medium rounded-full px-3 py-1">Most Popular</span>
                <h3 className="font-semibold text-lg mb-2">Pro</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold">$299</span>
                  <span className="ml-1">/mo</span>
                </div>
                <p className="mb-4">For teams of 2-5 members</p>
                <ul className="space-y-2 mb-8">
                  <li>1 AI Agent</li>
                  <li>1 Pipeline Configuration</li>
                  <li>1 Phone Number</li>
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSelectPlan('pro')}
                    disabled={isLoading || selectedPlan === 'pro'}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm"
                  >
                    {isLoading && selectedPlan === 'pro' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                  </Button>
                  <p className="text-xs text-center text-white/90 mt-3">Fast and Free Setup. Cancel Anytime.</p>
                </div>
              </div>

              {/* Enterprise */}
              <div
                className="relative rounded-3xl bg-white p-6 shadow-lg flex flex-col hover:shadow-xl transition"
                onMouseEnter={() => setHoveredCard('enterprise')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <span className="absolute top-4 right-4 bg-gray-200 text-gray-700 text-xs font-medium rounded-full px-3 py-1">Most Value</span>
                <h3 className="text-purple-700 font-semibold text-lg mb-2">Enterprise</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">$599</span>
                  <span className="text-gray-700 ml-1">/mo</span>
                </div>
                <p className="text-gray-600 mb-4">For larger teams of 5+ members</p>
                <ul className="text-gray-600 space-y-2 mb-8">
                  <li>1 AI Agent</li>
                  <li>1 Pipeline Configuration</li>
                  <li>1 Phone Number</li>
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSelectPlan('enterprise')}
                    disabled={isLoading || selectedPlan === 'enterprise'}
                    className="w-full bg-[#7c3aed]  hover:bg-[#6d28d9] text-white py-3 text-sm"
                  >
                    {isLoading && selectedPlan === 'enterprise' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-3">Fast and Free Setup. Cancel Anytime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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