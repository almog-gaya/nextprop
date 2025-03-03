'use client';

import { InfoIcon, Home } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function MessagingEmbedPage() {
  return (
    <DashboardLayout title="Messaging">
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6">
        <div className="max-w-lg w-full bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <InfoIcon className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Messaging Feature Unavailable
              </h3>
              <p className="text-gray-700 mb-4">
                The GoHighLevel messaging feature cannot be accessed. This could be due to:
              </p>
              <ul className="list-disc pl-5 mb-4 text-gray-600 space-y-1">
                <li>API key configuration issue</li>
                <li>Missing permissions in your GoHighLevel account</li>
                <li>The Conversations feature is not enabled in your account</li>
                <li>GoHighLevel API v2 requires OAuth2 authentication</li>
              </ul>
              <p className="text-sm text-gray-600 mb-4">
                Please contact your administrator for assistance or use the GoHighLevel platform directly to access messaging.
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Home size={16} /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 