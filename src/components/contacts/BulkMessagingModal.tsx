import React from 'react';
import { ChatBubbleLeftRightIcon, DocumentTextIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface BulkMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContacts: any[];
  selectedMessageType: 'sms' | 'email' | 'voicemail' | null;
  setSelectedMessageType: (type: 'sms' | 'email' | 'voicemail' | null) => void;
  smsText: string;
  setSmsText: (text: string) => void;
  emailSubject: string;
  setEmailSubject: (subject: string) => void;
  emailBody: string;
  setEmailBody: (body: string) => void;
  isBulkInProcess: boolean;
  onSend: () => void;
}

const BulkMessagingModal: React.FC<BulkMessagingModalProps> = ({
  isOpen,
  onClose,
  selectedContacts,
  selectedMessageType,
  setSelectedMessageType,
  smsText,
  setSmsText,
  emailSubject,
  setEmailSubject,
  emailBody,
  setEmailBody,
  isBulkInProcess,
  onSend
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50  z-[9999]">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div 
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Send Bulk Message</h3>
                <button
                  onClick={() => {
                    onClose();
                    setSelectedMessageType(null);
                  }}
                  className="w-[30px] h-[30px] flex items-center justify-center p-0 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Send a message to {selectedContacts.length} selected contacts.
              </p>

              {selectedMessageType ? (
                <div>
                  {selectedMessageType === 'sms' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMS Message</label>
                      <textarea
                        value={smsText}
                        onChange={(e) => setSmsText(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-2 h-32"
                        placeholder="Enter your SMS message here..."
                      />
                    </div>
                  )}

                  {selectedMessageType === 'email' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2"
                          placeholder="Email subject..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
                        <textarea
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 h-32"
                          placeholder="Enter your email content here..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setSelectedMessageType(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Back to Options
                    </button>
                    <button
                      onClick={onSend}
                      disabled={isBulkInProcess}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center justify-center"
                    >
                      {isBulkInProcess ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        `Send to ${selectedContacts.length} Contacts`
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setSelectedMessageType('sms')}
                    className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500 mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">SMS Message</h4>
                      <p className="text-sm text-gray-500">Send a text message to selected contacts</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedMessageType('email')}
                    className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-6 w-6 text-green-500 mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">Email</h4>
                      <p className="text-sm text-gray-500">Send an email to selected contacts</p>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('ringless-voicemails')}
                    className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <PhoneIcon className="h-6 w-6 text-purple-500 mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">Ringless Voicemail</h4>
                      <p className="text-sm text-gray-500">Send a voicemail without ringing their phone</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMessagingModal; 