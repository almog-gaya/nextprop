import React, { useEffect, useState } from 'react';
import { PhoneIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

interface PhoneLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  verifyPhoneNumber: string;
  setVerifyPhoneNumber: (value: string) => void;
  verificationStatus: 'idle' | 'loading' | 'success' | 'error';
  verificationMessage: string;
  phoneDetails: any;
  onLookup: (phone: string) => void;
  resetVerificationModal: () => void;
}

const PhoneLookupModal: React.FC<PhoneLookupModalProps> = ({
  isOpen,
  onClose,
  verifyPhoneNumber,
  setVerifyPhoneNumber,
  verificationStatus,
  verificationMessage,
  phoneDetails,
  onLookup,
  resetVerificationModal,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] overflow-y-auto"
      onClick={() => {
        onClose();
        resetVerificationModal();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto my-8 p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
          <h3 className="text-xl font-semibold text-gray-900">Phone Number Lookup</h3>
          <button
            onClick={() => {
              onClose();
              resetVerificationModal();
            }}
            className="w-[30px] h-[30px] flex items-center justify-center p-0 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-200"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="tel"
              id="phone"
              className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="+1 (123) 456-7890"
              value={verifyPhoneNumber}
              onChange={e => setVerifyPhoneNumber(e.target.value)}
              onBlur={e => {
                const phone = e.target.value.trim();
                if (phone && !phone.startsWith('+')) setVerifyPhoneNumber(`+${phone}`);
              }}
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {verificationStatus !== 'idle' && (
          <div
            className={`mb-4 p-3 rounded-md ${verificationStatus === 'loading' ? 'bg-blue-50 text-blue-800' : verificationStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            <div className="flex items-start">
              {verificationStatus === 'loading' && (
                <svg className="animate-spin h-5 w-5 mr-2 mt-0.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
              )}
              {verificationStatus === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5" />}
              {verificationStatus === 'error' && <XCircleIcon className="h-5 w-5 mr-2 mt-0.5" />}
              <div>
                <p>{verificationStatus === 'loading' ? 'Validating phone number...' : verificationMessage}</p>
                {phoneDetails && (
                  <div className="mt-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-semibold">Country Code:</div>
                      <div>{phoneDetails.country_code || 'N/A'}</div>
                      <div className="font-semibold">Carrier:</div>
                      <div>{phoneDetails.carrier?.name || 'N/A'}</div>
                      <div className="font-semibold">Type:</div>
                      <div>{phoneDetails.line_type_intelligence?.type || 'N/A'}</div>
                      <div className="font-semibold">Valid:</div>
                      <div>{phoneDetails.valid ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 sticky bottom-0 bg-white pt-3 border-t border-gray-200">
          <button
            onClick={() => {
              onClose();
              resetVerificationModal();
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Close
          </button>
          <button
            onClick={() => onLookup(verifyPhoneNumber)}
            disabled={verificationStatus === 'loading' || !verifyPhoneNumber}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center"
          >
            {verificationStatus === 'loading' ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                </svg>
                Validating...
              </>
            ) : (
              <>
                <InformationCircleIcon className="h-4 w-4 mr-2" />
                Lookup Phone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PhoneLookupModal; 