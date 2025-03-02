'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AutomatedCallForm, { CallData } from '@/components/AutomatedCallForm';
import CallLogsList, { CallLog } from '@/components/CallLogsList';
import { makeAutomatedCall, getCallLogs } from '@/lib/callService';
import { CallLogsSkeleton, CallFormSkeleton } from '@/components/SkeletonLoaders';

export default function CallsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCalls, setTotalCalls] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch call logs on component mount
  useEffect(() => {
    fetchCallLogs();
  }, [currentPage]);

  // Handle call form submission
  const handleCallSubmit = async (callData: CallData) => {
    setIsSubmitting(true);
    try {
      const newCall = await makeAutomatedCall(callData);
      setCallLogs(prev => [newCall, ...prev]);
      setTotalCalls(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting call:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch call logs with pagination
  const fetchCallLogs = async () => {
    setIsLoading(true);
    try {
      const { calls, total } = getCallLogs(currentPage, 10);
      setCallLogs(calls);
      setTotalCalls(total);
      setError(null);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setError('Failed to load voicemail logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render error message if there's an error
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 mb-6">
        <p>{error}</p>
        <button 
          onClick={fetchCallLogs} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout title="Ringless Voicemails">
      {renderError()}
      
      <div className="flex justify-end mb-4 space-x-4">
        <a 
          href="/calls/bulk" 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Bulk Upload Contacts
        </a>
        <a 
          href="/webhooks" 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View Webhook Responses
        </a>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Form */}
        <div className="lg:col-span-1">
          <AutomatedCallForm 
            onCallSubmit={handleCallSubmit} 
            isLoading={isSubmitting} 
          />
        </div>
        
        {/* Call Logs */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <CallLogsSkeleton />
          ) : (
            <CallLogsList 
              calls={callLogs} 
              isLoading={false} 
            />
          )}
          
          {/* Pagination - only show if we have more than 10 calls */}
          {!isLoading && totalCalls > 10 && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm text-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalCalls / 10)}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalCalls / 10)}
                className="px-3 py-1 border rounded-md text-sm text-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 