'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PipelinePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main dashboard which now has the pipeline integration
    router.push('/');
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-pulse">Redirecting to dashboard...</div>
    </div>
  );
} 