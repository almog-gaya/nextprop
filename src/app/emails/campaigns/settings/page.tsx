'use client';

import React, { useState } from 'react';
import { useInstantly } from '@/contexts/InstantlyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { CogIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CampaignSettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: process.env.NEXT_PUBLIC_INSTANTLY_API_KEY || '',
    defaultFromName: 'Your Company',
    defaultFromEmail: 'hello@yourcompany.com',
    enableAnalytics: true,
    autoSyncCampaigns: true,
    notificationEmail: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Settings updated:', settings);
      alert('Settings updated successfully');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <DashboardLayout title="Campaign Settings">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1e1b4b]">Campaign Settings</h1>
            <p className="text-gray-600">
              Configure your email campaign settings
            </p>
          </div>
          <Link 
            href="/emails" 
            className="nextprop-outline-button flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="nextprop-card">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-purple-100 text-[#7c3aed] mr-4">
                <CogIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1e1b4b] text-lg">API Configuration</h3>
                <p className="text-gray-600 text-sm">Configure your Instantly API connection settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block mb-1 text-sm font-medium text-gray-700">
                  Instantly API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  className="nextprop-input w-full"
                  placeholder="Enter your Instantly API key"
                  value={settings.apiKey}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  You can find your API key in your Instantly account settings
                </p>
              </div>
            </div>
          </div>

          <div className="nextprop-card">
            <div className="mb-6">
              <h3 className="font-semibold text-[#1e1b4b] text-lg">Default Sender Information</h3>
              <p className="text-gray-600 text-sm">The default information used when creating new campaigns</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="defaultFromName" className="block mb-1 text-sm font-medium text-gray-700">
                  Default Sender Name
                </label>
                <input
                  type="text"
                  id="defaultFromName"
                  name="defaultFromName"
                  className="nextprop-input w-full"
                  placeholder="Your Company"
                  value={settings.defaultFromName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="defaultFromEmail" className="block mb-1 text-sm font-medium text-gray-700">
                  Default Sender Email
                </label>
                <input
                  type="email"
                  id="defaultFromEmail"
                  name="defaultFromEmail"
                  className="nextprop-input w-full"
                  placeholder="hello@yourcompany.com"
                  value={settings.defaultFromEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="nextprop-card">
            <div className="mb-6">
              <h3 className="font-semibold text-[#1e1b4b] text-lg">Synchronization & Analytics</h3>
              <p className="text-gray-600 text-sm">Configure how campaign data is synchronized and analyzed</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <label htmlFor="enableAnalytics" className="text-sm font-medium text-gray-700">
                    Enable Analytics Tracking
                  </label>
                  <p className="text-sm text-gray-500">
                    Automatically track opens, clicks, and replies for your campaigns
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableAnalytics"
                    name="enableAnalytics"
                    className="h-4 w-4 text-[#7c3aed] rounded border-gray-300"
                    checked={settings.enableAnalytics}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <label htmlFor="autoSyncCampaigns" className="text-sm font-medium text-gray-700">
                    Auto-synchronize Campaigns
                  </label>
                  <p className="text-sm text-gray-500">
                    Automatically sync campaign data from Instantly every hour
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSyncCampaigns"
                    name="autoSyncCampaigns"
                    className="h-4 w-4 text-[#7c3aed] rounded border-gray-300"
                    checked={settings.autoSyncCampaigns}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="notificationEmail" className="block mb-1 text-sm font-medium text-gray-700">
                  Notification Email
                </label>
                <input
                  type="email"
                  id="notificationEmail"
                  name="notificationEmail"
                  className="nextprop-input w-full"
                  placeholder="notifications@yourcompany.com"
                  value={settings.notificationEmail}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email to receive notifications about campaign activity (optional)
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="nextprop-button"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 