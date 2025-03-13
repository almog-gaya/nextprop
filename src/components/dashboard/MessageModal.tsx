'use client';

import React from 'react';
import { PhoneNumber } from '@/contexts/AuthContext';
import { GHLContact } from '@/types/dashboard';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'sms' | 'email' | null;
  contact: GHLContact | null;
  user: { email?: string; phoneNumbers?: PhoneNumber[] } | null;
  messageContent: {
    sms: string;
    emailSubject: string;
    emailBody: string;
  };
  setMessageContent: React.Dispatch<
    React.SetStateAction<{
      sms: string;
      emailSubject: string;
      emailBody: string;
    }>
  >;
  onSend: () => Promise<void>;
}

export default function MessageModal({
  isOpen,
  onClose,
  actionType,
  contact,
  user,
  messageContent,
  setMessageContent,
  onSend,
}: MessageModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-transparent rounded-xl shadow-xl w-full max-w-md sm:max-w-lg mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">
          {actionType === 'sms' ? 'Send SMS' : 'Send Email'}
        </h3>
        <p className="text-sm text-gray-600 mb-4 sm:mb-6">
          {actionType === 'sms'
            ? 'Send an SMS message to this contact'
            : 'Compose and send an email to this contact'}
        </p>

        {actionType === 'sms' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                value={user?.phoneNumbers?.[0]?.phoneNumber || ''}
              >
                {(user?.phoneNumbers || []).length > 0 ? (
                  user!.phoneNumbers!.map((number) => (
                    <option key={number.phoneNumber} value={number.phoneNumber}>
                      {number.phoneNumber}
                    </option>
                  ))
                ) : (
                  <option value="">No number available</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-gray-50 text-gray-700"
                value={contact?.phone || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                value={messageContent.sms}
                onChange={(e) => setMessageContent({ ...messageContent, sms: e.target.value })}
                placeholder="Enter your SMS message"
                rows={4}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-gray-50 text-gray-700"
                value={user?.email || 'no-reply@yourdomain.com'}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-gray-50 text-gray-700"
                value={contact?.email || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                value={messageContent.emailSubject}
                onChange={(e) => setMessageContent({ ...messageContent, emailSubject: e.target.value })}
                placeholder="Enter email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="mt-1 block w-full border border-gray-200 rounded-md p-2 sm:p-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-400 text-sm transition-all hover:border-gray-300"
                value={messageContent.emailBody}
                onChange={(e) => setMessageContent({ ...messageContent, emailBody: e.target.value })}
                placeholder="Enter your email message"
                rows={6}
              />
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100/80 text-gray-700 rounded-md hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            className="btn-primary px-4 py-2 text-white rounded-md bg-blue-500 hover:bg-blue-600 text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
            onClick={onSend}
            disabled={
              actionType === 'sms'
                ? !messageContent.sms || !((user?.phoneNumbers?.length ?? 0) > 0)
                : !messageContent.emailBody
            }
          >
            Send {actionType === 'sms' ? 'SMS' : 'Email'}
          </button>
        </div>
      </div>
    </div>
  );
}