'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Modal Component
function RegisterModal({ isOpen, onClose, plan, onSubmit }: {
  isOpen: boolean,
  onClose: () => void,
  plan: string,
  onSubmit: (data: { name: string, phone: string, email: string, plan: string, businessName: string }) => void
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, phone, email, plan, businessName });
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
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Business Name */}
            <div className="flex flex-col">
              <label htmlFor="businessName" className="mb-1 text-sm font-medium text-gray-700">Business Name</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
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
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
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
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm shadow-sm transition placeholder-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
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
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const email = searchParams.get('email');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      // Simulate API call to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, userId: user?.id }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        const { error } = await response.json();
        console.error('Failed to create checkout session:', error);
        // Handle error (e.g., show a toast message)
        alert(error || 'Failed to initiate checkout. Please try again.');
      }
    } catch (error) {
      console.error('An error occurred during checkout initiation:', error);
      // Handle network or other errors
      alert('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null); // Reset selected plan after attempt
    }
  };

  const handleCompareFeaturesClick = () => {
    // router.push('/compare-features');
  };

  const handlePlansAndPricingClick = () => {
    // Stay on the current page, or scroll to the pricing section if needed
    // For now, it just stays on the page.
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-purple-800 mb-4">
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
              If you have any questions, please don't hesitate to contact our support team at support@nextprop.ai or +1 (929) 595-3158
            </p>
            <Link href="/">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#7c3aed] overflow-x-hidden" style={{ backgroundImage: 'linear-gradient(90deg, #E6C2FF 0%, #B6BCFF 100%)' }}>
      {/* Main content */}
      <main className="w-full overflow-x-hidden">
        <div className="container mx-auto px-4 py-10 transform origin-top">
          <div className="text-center mx-auto">
            <p style={{ fontSize: '54px', fontWeight: 900, color: 'black' }}>Pricing Plans</p>
            <p style={{ fontSize: '18px', fontWeight: 500, color: '#59595C' }}>
              Nextprop handles it all—no extra tools required.
              <br />
              All plans include Live Zoom, Live Chat, Phone & SMS support.
            </p>
            {/* Added buttons container */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
              {/* Button group */}
              <div className="flex items-center gap-4" style={{ padding: '10px' }}>
                <button
                  className="text-sm font-semibold"
                  style={{
                    backgroundColor: '#9C03FF',
                    color: 'white',
                    padding: '7px 21px',
                    borderRadius: '10px',
                    border: '1px solid #D1D1D1',
                  }}
                  onClick={handlePlansAndPricingClick}
                >
                  Plans & Pricing
                </button>
                <button
                  className="text-sm font-semibold"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: 'black',
                    padding: '7px 21px',
                    borderRadius: '10px',
                    border: '1px solid #D1D1D1',
                  }}
                    onClick={handleCompareFeaturesClick}
                >
                  Compare Features
                </button>
              </div>
        
            </div>
          </div>

          {/* Switch group placed above pricing cards and aligned right */}
          <div className="w-full flex justify-center lg:justify-end mt-6 px-4 lg:px-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'black' }}>Save up to 29%</span>
              <span style={{ color: '#9C03FF' }}>Yearly</span>
              {/* Basic switch placeholder */}
              <div className="w-10 h-6 bg-purple-600 rounded-full flex items-center p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full transform translate-x-0"></div>
              </div>
              <span style={{ color: '#59595C' }}>Monthly</span>
            </div>
          </div>

          <div className="mt-12 flex flex-col lg:flex-row gap-10 lg:items-start lg:gap-16">
            {/* ---------------- Included in All Plans ---------------- */}
            <div className="-mt-15 w-full lg:w-72 rounded-3xl bg-gradient-to-br from-[#3045FF] to-[#9A04FF]  text-white shadow-xl" style={{ backgroundImage: 'linear-gradient(89.63deg, #3045FF 0.28%, #9A04FF 99.64%)', width: '285.5px', borderRadius: '15px', padding: '24px', gap: '8px' }}>
              <p className="text-2xl font-bold text-start mb-2" style={{ fontSize: '20.8px', lineHeight: '30px', color: 'white' }}>Included In All Plans</p>
              <ul className="space-y-4">
                {commonFeatures.map((feature) => (
                  <li key={feature} className="flex items-center justify-between text-sm">
                    <span className="flex items-center" style={{ fontWeight: 500, fontSize: '14.61px', lineHeight: '16px', color: 'white' }}>
                      <CheckIcon className="w-[14px] h-[14px] mr-3" />
                      {feature}
                    </span>
                    <InfoIcon className="w-[17px] h-[17px] opacity-70" />
                  </li>
                ))}
              </ul>
            </div>

            {/* ---------------- Pricing Cards ---------------- */}
            <div className=" flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {/* Basic */}
              <div
                className="relative rounded-3xl bg-white p-6 shadow-lg flex flex-col hover:shadow-xl transition hover:scale-105 hover:z-10"
                onMouseEnter={() => setHoveredCard('basic')}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ width: '282.95px', height: '336.96px', borderRadius: '12.17px', }}
              >
                <h3 className="text-purple-700 font-semibold text-lg mb-2" style={{ fontWeight: 700, fontSize: '15.56px', lineHeight: '15.21px', color: '#9C03FF' }}>Basic</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold text-gray-900" style={{ fontWeight: 700, fontSize: '23.94px', lineHeight: '31.19px' }}>$149</span>
                  <span className="text-black ml-1">/mo</span>
                </div>
                <p className="text-gray-600 mb-4" style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>Perfect for solopreneurs</p>
                <ul className="text-gray-600 space-y-2 mb-8">
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 AI Agent</li>
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 Pipeline Configuration</li>
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 Phone Number</li>
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSelectPlan('basic')}
                    disabled={isLoading || selectedPlan === 'basic'}
                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-3 text-sm"
                    style={{ backgroundColor: '#3244FF', fontWeight: 700, fontSize: '10.7px', lineHeight: '100%', textAlign: 'center' }}
                  >
                    {isLoading && selectedPlan === 'basic' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-3" style={{ fontWeight: 400, fontSize: '10.65px', lineHeight: '100%', textAlign: 'center' }}>Fast and Free Setup. Cancel Anytime.</p>
                </div>
              </div>

              {/* Pro */}
              <div
                className="relative rounded-3xl bg-gradient-to-br from-[#3045FF] to-[#9A04FF] p-6 shadow-lg flex flex-col text-white hover:shadow-xl transition hover:scale-105 hover:z-10"
                onMouseEnter={() => setHoveredCard('pro')}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ backgroundImage: 'linear-gradient(89.63deg, #3045FF 0.28%, #9A04FF 99.64%)', width: '282.95px', height: '336.96px', borderRadius: '12.17px' }}
              >
                <span className="absolute top-4 border ml-[35px] border-[#D1D1D1] bg-transparent text-white text-[10px] font-[600px] rounded-full px-3 py-1">Most Popular</span>
                <h3 className="font-semibold text-lg mb-2" style={{ fontWeight: 700, fontSize: '15.56px', lineHeight: '15.21px', color: '#ffffff' }}>Pro</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold" style={{ fontWeight: 700, fontSize: '23.94px', lineHeight: '31.19px' }}>$299</span>
                  <span className="ml-1">/mo</span>
                </div>
                <p className="mb-4" style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>For teams of 2-5 members</p>
                <ul className="space-y-2 mb-8">
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 AI Agent</li>
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 Pipeline Configuration</li>
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 Phone Number</li>
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSelectPlan('pro')}
                    disabled={isLoading || selectedPlan === 'pro'}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm"
                    style={{ backgroundColor: '#FF3B2A', fontWeight: 700, fontSize: '10.7px', lineHeight: '100%', textAlign: 'center' }}
                  >
                    {isLoading && selectedPlan === 'pro' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                  </Button>
                  <p className="text-xs text-center text-white/90 mt-3" style={{ fontWeight: 400, fontSize: '10.65px', lineHeight: '100%', textAlign: 'center' }}>Fast and Free Setup. Cancel Anytime.</p>
                </div>
              </div>

              {/* Enterprise */}
              <div
                className="relative rounded-3xl bg-white p-6 shadow-lg flex flex-col hover:shadow-xl transition hover:scale-105 hover:z-10"
                onMouseEnter={() => setHoveredCard('enterprise')}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ width: '282.95px', height: '336.96px', borderRadius: '12.17px', }}
              >
                <span
                  className="absolute top-4.5 ml-[85px] bg-[#D1D1D1] rounded-full text-black text-[10px] font-[600] px-3 py-1"
                  style={{
                    border: '2px solid #D1D1D1',

                  }}
                >
                  Most Value
                </span>
                <h3 className="text-purple-700 font-semibold text-lg mb-2" style={{ fontWeight: 700, fontSize: '15.56px', lineHeight: '15.21px', color: '#9C03FF' }}>Enterprise</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold text-gray-900" style={{ fontWeight: 700, fontSize: '23.94px', lineHeight: '31.19px' }}>$599</span>
                  <span className="text-black-700 ml-1">/mo</span>
                </div>
                <p className="text-gray-600 mb-4" style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>For larger teams of 5+ members</p>
                <ul className="text-gray-600 space-y-2 mb-8">
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 AI Agent</li>
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 Pipeline Configuration</li>
                  <li style={{ fontWeight: 600, fontSize: '11.22px', lineHeight: '15.21px' }}>1 Phone Number</li>
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleSelectPlan('enterprise')}
                    disabled={isLoading || selectedPlan === 'enterprise'}
                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-3 text-sm"
                    style={{ backgroundColor: '#3244FF', fontWeight: 700, fontSize: '10.7px', lineHeight: '100%', textAlign: 'center' }}
                  >
                    {isLoading && selectedPlan === 'enterprise' ? 'Loading...' : 'Start Your 30 Day Free Trial'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-3" style={{ fontWeight: 400, fontSize: '10.65px', lineHeight: '100%', textAlign: 'center' }}>Fast and Free Setup. Cancel Anytime.</p>
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
          onSubmit={handleSelectPlan}
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
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