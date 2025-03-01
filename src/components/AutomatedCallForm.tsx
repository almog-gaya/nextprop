"use client";

import { useState } from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';

interface AutomatedCallFormProps {
  onCallSubmit: (callData: CallData) => void;
  isLoading?: boolean;
}

export interface CallData {
  first_name: string;
  phone: string;
  full_address: string;
}

export default function AutomatedCallForm({ onCallSubmit, isLoading = false }: AutomatedCallFormProps) {
  const [formData, setFormData] = useState<CallData>({
    first_name: '',
    phone: '',
    full_address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCallSubmit(formData);
  };

  return (
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">Set Up Ringless Voicemail</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <PhoneIcon className="w-5 h-5" />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              required
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John Smith"
              className="nextprop-input py-2 px-3 w-full rounded-md"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+11234567890"
              className="nextprop-input py-2 px-3 w-full rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          <div>
            <label htmlFor="full_address" className="block text-sm font-medium text-gray-700 mb-1">
              Full Address
            </label>
            <textarea
              id="full_address"
              name="full_address"
              required
              value={formData.full_address}
              onChange={handleChange}
              placeholder="123 Main St, Anytown, CA 12345"
              className="nextprop-input py-2 px-3 w-full rounded-md"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="nextprop-button w-full flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <PhoneIcon className="w-4 h-4 mr-2" />
                Send Voicemail
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 