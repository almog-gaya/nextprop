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

export default function CompareFeaturesPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);


  const handleCompareFeaturesClick = () => {

  };

  const handlePlansAndPricingClick = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden" style={{ backgroundImage: 'linear-gradient(90deg, #E6C2FF 0%, #B6BCFF 100%)' }}>
      <div className="container mx-auto px-4 py-10 text-center">
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


        {/* Trial and Features and Plans Container */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start w-full max-w-6xl mx-auto mt-12">
          {/* Trial and Features Text */}
          <div className="text-left text-sm font-semibold text-[#9C03FF] lg:w-1/4 lg:mt-6">
            <p className="mb-2">30 DAY FREE TRIAL</p>
            <p className="mb-2">UNLIMITED ONBOARDINGS</p>
            <p>FREE COURSES</p>
          </div>

          {/* Plans Header */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic */}
            <div className="p-6 text-center">
              <h3 className="text-[#9C03FF] font-bold text-lg">BASIC</h3>
              <p className="text-4xl font-extrabold text-gray-900">$149</p>
              <button className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-black rounded-md">Start Your 30 Day Free Trial</button>
              <p className="text-xs text-gray-500 mt-2">Fast and Free Setup. Cancel Anytime.</p>
            </div>
            {/* Pro */}
            <div className="p-6 text-center relative">
              <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-blue-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">Recommended</span>
              <h3 className="text-[#9C03FF] font-bold text-lg mt-4">PRO</h3>
              <p className="text-4xl font-extrabold text-gray-900">$299</p>
              <button className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md">Start Your 30 Day Free Trial</button>
              <p className="text-xs text-gray-500 mt-2">Fast and Free Setup. Cancel Anytime.</p>
            </div>
            {/* Enterprise */}
            <div className="p-6 text-center relative">
              <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-purple-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">Most Value</span>
              <h3 className="text-[#9C03FF] font-bold text-lg mt-4">ENTERPRISE</h3>
              <p className="text-4xl font-extrabold text-gray-900">$599</p>
              <button className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-black rounded-md">Start Your 30 Day Free Trial</button>
              <p className="text-xs text-gray-500 mt-2">Fast and Free Setup. Cancel Anytime.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
