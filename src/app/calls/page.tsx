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
      
      <div className="space-y-6">
        {/* Header section */}
        <div className="nextprop-card p-6">
          <h2 className="text-xl font-semibold text-[#1e1b4b] mb-2">Voicemail Campaigns</h2>
          <p className="text-gray-600 mb-6">Send personalized voicemails to multiple contacts with controlled delivery schedules.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-[#7c3aed] rounded-lg p-5">
              <h3 className="font-medium text-[#1e1b4b]">Total Contacts</h3>
              <p className="text-2xl font-bold text-[#7c3aed] mt-1">{totalCalls}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-teal-50 border-l-4 border-green-500 rounded-lg p-5">
              <h3 className="font-medium text-[#1e1b4b]">Delivered</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{callLogs.filter(log => log.status === 'completed').length}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 border-l-4 border-blue-500 rounded-lg p-5">
              <h3 className="font-medium text-[#1e1b4b]">Pending</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">{callLogs.filter(log => log.status === 'pending').length}</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-4 mt-6 justify-between items-center">
            <a 
              href="/calls/bulk" 
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-[#7c3aed] border border-transparent rounded-md shadow-sm hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed]"
            >
              Create New Campaign
            </a>
            
            <button
              type="button"
              onClick={() => document.getElementById('manual-voicemail-section')?.classList.toggle('hidden')}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-[#7c3aed] bg-white border border-[#7c3aed] rounded-md shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed]"
            >
              Manual Voicemail
            </button>
          </div>
        </div>
        
        {/* Campaign Delivery Settings */}
        <div className="nextprop-card p-6">
          <h3 className="text-lg font-semibold text-[#1e1b4b] mb-4">Campaign Delivery Settings</h3>
   
          <div className="mt-6">
            <button
              type="button"
              className="px-5 py-2.5 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save Settings
            </button>
          </div>
        </div>
        
        {/* Manual Call Form - Hidden by default */}
        <div id="manual-voicemail-section" className="hidden">
          <div className="nextprop-card p-6">
            <AutomatedCallForm 
              onCallSubmit={handleCallSubmit} 
              isLoading={isSubmitting} 
            />
          </div>
        </div>
        
        {/* Call Logs */}
        <div className="nextprop-card p-6">
          <h3 className="text-lg font-semibold text-[#1e1b4b] mb-4">Voicemail History</h3>
          
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
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(totalCalls / 10)}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalCalls / 10)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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