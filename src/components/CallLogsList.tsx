"use client";

import React, { useState } from 'react';
import { PhoneIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

export interface CallLog {
  id: string;
  timestamp: string;
  recipient: {
    name: string;
    company: string;
    phone: string;
    address: string;
  };
  status: 'completed' | 'failed' | 'pending';
  duration?: number; // in seconds
  callSid?: string; // unique ID from the call service
  message?: string; // response message from the API
  campaignId?: string; // ID of the campaign if sent via campaign
}

interface CallLogsListProps {
  calls: CallLog[];
  isLoading?: boolean;
}

export default function CallLogsList({ calls, isLoading = false }: CallLogsListProps) {
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const toggleExpandCall = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const getStatusIcon = (status: CallLog['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return (
          <svg className="animate-spin h-5 w-5 text-[#7c3aed]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="nextprop-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1e1b4b]">Recent Voicemails</h3>
          <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
            <PhoneIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="py-8 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-[#7c3aed]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="nextprop-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1e1b4b]">Recent Voicemails</h3>
          <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
            <PhoneIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="py-8 text-center text-gray-500">
          <PhoneIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p>No voicemails have been sent yet.</p>
          <p className="text-sm mt-1">Use the form above to send your first ringless voicemail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <svg className="animate-spin h-8 w-8 text-[#7c3aed]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-700">Loading recent voicemails...</span>
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <PhoneIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No voicemails</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by sending your first voicemail.</p>
        </div>
      ) : (
        calls.map((call) => (
          <div key={call.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpandCall(call.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-6 w-6 text-[#7c3aed]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{call.recipient.name}</p>
                  <p className="text-xs text-gray-500">{call.recipient.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}
                  </p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(call.status)}
                    <span className="ml-1 text-xs capitalize text-gray-500">{call.status}</span>
                  </div>
                </div>
                <svg 
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedCallId === call.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {expandedCallId === call.id && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500">Recipient</span>
                    <p className="mt-1">{call.recipient.address}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Call ID</span>
                    <p className="mt-1 font-mono text-xs">{call.callSid || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Duration</span>
                    <p className="mt-1">{formatDuration(call.duration)}</p>
                  </div>
                  {call.campaignId && (
                    <div className="col-span-2 mt-2">
                      <span className="font-medium text-gray-500">Campaign ID</span>
                      <p className="mt-1 font-mono text-xs">{call.campaignId}</p>
                    </div>
                  )}
                  {call.message && (
                    <div className="col-span-2 mt-2">
                      <span className="font-medium text-gray-500">Message</span>
                      <p className="mt-1 text-sm text-gray-700">{call.message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
} 