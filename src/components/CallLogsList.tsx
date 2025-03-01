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
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">Recent Voicemails</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <PhoneIcon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Recipient</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Time</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Duration</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {calls.map((call) => (
              <React.Fragment key={call.id}>
                <tr className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {call.recipient.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="flex items-center">
                      {getStatusIcon(call.status)}
                      <span className="ml-1.5 capitalize">{call.status}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => toggleExpandCall(call.id)}
                      className="text-[#7c3aed] hover:text-[#6d28d9]"
                    >
                      {expandedCallId === call.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expandedCallId === call.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-700">Recipient Details</p>
                          <p className="mt-1 text-gray-600">Name: {call.recipient.name}</p>
                          <p className="text-gray-600">Company: {call.recipient.company}</p>
                          <p className="text-gray-600">Phone: {call.recipient.phone}</p>
                          <p className="text-gray-600">Address: {call.recipient.address}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Voicemail Details</p>
                          <p className="mt-1 text-gray-600">ID: {call.callSid || 'N/A'}</p>
                          <p className="text-gray-600">Sent Time: {new Date(call.timestamp).toLocaleString()}</p>
                          <p className="text-gray-600">Status: {call.status}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 