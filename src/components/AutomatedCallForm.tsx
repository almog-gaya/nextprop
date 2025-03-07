"use client";

import { useState, useEffect } from 'react';
import { PhoneIcon, SpeakerWaveIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface AutomatedCallFormProps {
  onCallSubmit: (callData: CallData) => void;
  isLoading?: boolean;
}

export interface CallData {
  first_name: string;
  phone: string;
  street_name: string;
  script: string;
}

export default function AutomatedCallForm({ onCallSubmit, isLoading = false }: AutomatedCallFormProps) {
  const [formData, setFormData] = useState<CallData>({
    first_name: '',
    phone: '',
    street_name: '',
    script: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CallData, string>>>({});
  const [recentCalls, setRecentCalls] = useState<CallData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load recent calls from localStorage on mount
  useEffect(() => {
    try {
      const savedCalls = localStorage.getItem('nextprop_recent_calls');
      if (savedCalls) {
        setRecentCalls(JSON.parse(savedCalls));
      }
    } catch (error) {
      console.error('Failed to load recent calls:', error);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof CallData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Generate default script when first_name or street_name changes
  const updateDefaultScript = (first_name: string, street_name: string) => {
    if (first_name && street_name && !formData.script) {
      const defaultScript = `Hello ${first_name}, I noticed your property on ${street_name} and wanted to connect with you about it. Please call me back when you get a chance. Thank you!`;
      setFormData(prev => ({ ...prev, script: defaultScript }));
    }
  };

  // Update script when name or street changes (only if script was empty)
  useEffect(() => {
    updateDefaultScript(formData.first_name, formData.street_name);
  }, [formData.first_name, formData.street_name]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CallData, string>> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Recipient name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (!formData.street_name.trim()) {
      newErrors.street_name = 'Street name is required';
    }
    
    if (!formData.script.trim()) {
      newErrors.script = 'Voicemail script is required';
    } else if (formData.script.length > 500) {
      newErrors.script = 'Script exceeds maximum length (500 characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onCallSubmit(formData);
    
    // Save to recent calls (only store last 5)
    const updatedCalls = [formData, ...recentCalls.slice(0, 4)];
    setRecentCalls(updatedCalls);
    try {
      localStorage.setItem('nextprop_recent_calls', JSON.stringify(updatedCalls));
    } catch (error) {
      console.error('Failed to save recent calls:', error);
    }
    
    // Reset form
    setFormData({
      first_name: '',
      phone: '',
      street_name: '',
      script: ''
    });
  };

  const handleUseRecent = (call: CallData) => {
    setFormData(call);
  };

  return (
    <div className="nextprop-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1e1b4b]">Set Up Ringless Voicemail</h3>
        <div className="text-[#7c3aed] bg-purple-50 p-3 rounded-full">
          <PhoneIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Recent calls section */}
      {recentCalls.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Recipients</h4>
            <button 
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setRecentCalls([]);
                localStorage.removeItem('nextprop_recent_calls');
              }}
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentCalls.map((call, index) => (
              <button
                key={index}
                className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-800"
                onClick={() => handleUseRecent(call)}
              >
                <span>{call.first_name}</span>
                <span className="ml-1 text-gray-400">({call.phone})</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John Smith"
              className={`nextprop-input py-2 px-3 w-full rounded-md ${errors.first_name ? 'border-red-500' : ''}`}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+11234567890"
              className={`nextprop-input py-2 px-3 w-full rounded-md ${errors.phone ? 'border-red-500' : ''}`}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
            )}
          </div>

          <div>
            <label htmlFor="street_name" className="block text-sm font-medium text-gray-700 mb-1">
              Street Name
            </label>
            <input
              type="text"
              id="street_name"
              name="street_name"
              value={formData.street_name}
              onChange={handleChange}
              placeholder="123 Main St"
              className={`nextprop-input py-2 px-3 w-full rounded-md ${errors.street_name ? 'border-red-500' : ''}`}
            />
            {errors.street_name && (
              <p className="mt-1 text-xs text-red-600">{errors.street_name}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                Voicemail Script
              </label>
              <button 
                type="button"
                className="text-xs text-[#7c3aed] hover:text-purple-800 flex items-center"
                onClick={() => setShowPreview(!showPreview)}
              >
                <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
              </button>
            </div>
            <textarea
              id="script"
              name="script"
              rows={3}
              value={formData.script}
              onChange={handleChange}
              placeholder="Enter the script for the voicemail..."
              className={`nextprop-input py-2 px-3 w-full rounded-md resize-none ${errors.script ? 'border-red-500' : ''}`}
            ></textarea>
            <div className="flex justify-between mt-1">
              {errors.script ? (
                <p className="text-xs text-red-600">{errors.script}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  {formData.script.length} / 500 characters
                </p>
              )}
            </div>
          </div>

          {/* Script preview */}
          {showPreview && formData.script && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-gray-700">Preview</p>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPreview(false)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 italic">{formData.script}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-[#7c3aed] hover:bg-purple-800'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send Voicemail'}
          </button>
        </div>
      </form>
    </div>
  );
} 