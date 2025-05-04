'use client';

import { useState } from 'react';
import { EnvelopeIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

type EmailLog = {
  id: string;
  to: string;
  subject: string;
  status: 'delivered' | 'failed' | 'pending';
  createdAt: string;
  contactName?: string;
};

type EmailLogsListProps = {
  emails: EmailLog[];
  isLoading?: boolean;
};

export default function EmailLogsList({ emails, isLoading = false }: EmailLogsListProps) {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const toggleExpandEmail = (emailId: string) => {
    if (expandedEmailId === emailId) {
      setExpandedEmailId(null);
    } else {
      setExpandedEmailId(emailId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="nextprop-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1e1b4b]">Recent Emails</h3>
          <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
            <EnvelopeIcon className="w-5 h-5" />
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

  if (emails.length === 0) {
    return (
      <div className="nextprop-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1e1b4b]">Recent Emails</h3>
          <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
            <EnvelopeIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="py-8 text-center text-gray-500">
          <EnvelopeIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p>No emails have been sent yet.</p>
          <p className="text-sm mt-1">Use the form to send your first email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">Recent Emails</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <EnvelopeIcon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="space-y-3">
        {emails.map((email) => (
          <div key={email.id} className="border rounded-lg overflow-hidden">
            <div 
              className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpandEmail(email.id)}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  {email.status === 'delivered' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : email.status === 'failed' ? (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {email.contactName || email.to}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(email.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {email.status === 'delivered' ? 'Delivered' : email.status === 'failed' ? 'Failed' : 'Pending'}
              </div>
            </div>
            
            {expandedEmailId === email.id && (
              <div className="p-3 border-t">
                <div className="mb-2">
                  <div className="text-xs text-gray-500">To:</div>
                  <div className="text-sm">{email.to}</div>
                </div>
                <div className="mb-2">
                  <div className="text-xs text-gray-500">Subject:</div>
                  <div className="text-sm font-medium">{email.subject}</div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  View message
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 