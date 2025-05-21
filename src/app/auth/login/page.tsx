"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAuthUrl } from '@/lib/ghlAuth';
import Image from 'next/image';

function LoginForm() {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setIsSubmitting(false);

    // Check if redirected from another page with a message
    const message = searchParams.get('message');
    if (message) {
      setLocalError(decodeURIComponent(message));
    }
  }, [searchParams]);

  const handleOAuthLogin = () => {
    /// logout....
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    setIsSubmitting(true);
    window.location.href = getAuthUrl();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left – Purple brand panel (hidden on small screens) */}
      <div className="hidden lg:flex w-full lg:w-2/3 bg-[#7c3aed] items-center justify-center p-8">
        <div className="flex flex-col items-center justify-center text-center max-w-xl">
          {/* Phone/dashboard composite image */}
          <Image
            src="/CRM-new.png"
            alt="CRM dashboard preview"
            width={700}
            height={700}
            className="h-auto w-full max-w-xl"
            priority
          />

          {/* Testimonial quote */}
          <p className="mt-8 text-white text-lg italic leading-relaxed">
            "Switching to NextProp.ai cut my follow-up time in half and boosted our close rate by 40% in just one quarter."
          </p>
          <div className="mt-4 text-white flex items-center space-x-3">
            <div className="w-16 h-16 relative rounded-full overflow-hidden">
              <Image
                src="/emily.jpeg"
                alt="Emily Carter"
                width={1700}
                height={1700}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="text-left">
              <p className="font-semibold">Emily Carter</p>
              <p className="text-sm opacity-80">Acquisitions Manager, Skyline Realty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right – White panel that holds the sign-in card */}
      <div className="flex w-full lg:w-1/3 items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-xl shadow-gray-300 border border-gray-400">
          {/* Logo - Centered */}
          <div className="flex justify-center">
            <Image
              src="/logo_white.png"
              alt="NextProp.ai Logo"
              width={200}
              height={50}
            />
          </div>
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
                <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
                <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" />
              </svg>
              Connect with GoHighLevel
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-[#7c3aed] hover:text-[#6d28d9]">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
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