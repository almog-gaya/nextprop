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
import { AlignCenter } from 'lucide-react';

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
                  backgroundColor: '#FFFFFF',
                  color: 'black',
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
                  backgroundColor: '#9C03FF',
                  color: 'white',
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
        <div className="w-full flex justify-center lg:justify-end mt-8 mb-4 px-4 lg:px-0">
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
        <div className="pt-8 flex ">
          <div className="text-[16.73px]  text-[#8a2be2]  border-r border-white/30 font-[600px] space-y-2"
            style={{
              width: '444px',
              height: '148px',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'start',
              paddingTop: '22px',
              paddingBottom: '22px'

            }}>
            <p>30 DAY FREE TRIAL</p>
            <p>UNLIMITED ONBOARDINGS</p>
            <p>FREE COURSES</p>
          </div>

          <div className="flex flex-col md:flex-row ">
            {[
              {
                title: "BASIC",
                price: "$149",
                btnColor: "bg-black text-white",
                tag: null,
              },
              {
                title: "PRO",
                price: "$299",
                btnColor: "bg-[#4f46e5] text-white",
                tag: "Recommended",
              },
              {
                title: "ENTERPRISE",
                price: "$599",
                btnColor: "bg-black text-white",
                tag: "Most Value",
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className="relative  border-r border-white/30  text-center text-black"
                style={{ width: '291px', height: '148px' }}
              >
                <div className="text-[#8a2be2] font-semibold text-sm mb-2">{plan.title}</div>

                {plan.tag && (
                  <div
                    className={`absolute -top-0 right-3 text-xs px-2 py-1 rounded-full ${plan.tag === "Recommended" ? "bg-[#4f46e5] text-white" : "bg-black text-white"
                      }`}
                  >
                    {plan.tag}
                  </div>
                )}

                <div style={{ fontSize: '33px', fontWeight: 600, }}>{plan.price}</div>
                <Button
                  className={` rounded-xl  mb-2 ${plan.btnColor}`}
                  style={{ fontSize: '12px', fontWeight: 600, width: '231px', height: '39px' }}
                >
                  Start Your 30 Day Free Trial
                </Button>
                <p className="text-xs text-gray-800" >
                  Fast and Free Setup. Cancel Anytime.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="w-full mx-auto mt-8 ">
          <table className="  divide-y divide-gray-200">

            <tbody className=" divide-y divide-gray-200">
              {/* Users Row */}
              <tr>
                <td className="text-sm font-medium text-gray-900 border"
                  style={{
                    width: '444px',
                    height: '50px',
                    textAlign: 'start',
                  }}>Users</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border"
                  style={{
                    width: '291px',
                    height: '50px',
                  }}>1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>15</td>
              </tr>
              {/* Phone Numbers Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border"
                  style={{
                    width: '444px',
                    height: '50px',
                    textAlign: 'start',
                  }}>Phone Numbers</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>5</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center border" style={{
                  width: '291px',
                  height: '50px',
                }}>15</td>
              </tr>
              {/* Table rows will be added here based on subsequent images */}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
}
