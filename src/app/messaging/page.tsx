'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Client component that uses useSearchParams
function MessagingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Forward all search parameters to the messaging-embed page
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    const queryString = params.toString();
    router.push(`/messaging-embed${queryString ? `?${queryString}` : ''}`);
  }, [router, searchParams]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-700">Redirecting to messages...</h2>
      </div>
    </div>
  );
}

// Page component with Suspense boundary
export default function MessagingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700">Loading...</h2>
        </div>
      </div>
    }>
      <MessagingContent />
    </Suspense>
  );
} 