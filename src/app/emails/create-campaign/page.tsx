'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInstantly } from '@/contexts/InstantlyContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { createCampaign, loading } = useInstantly();
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    daily_limit: 100,
    email_gap: 5,
    email_list: 'Test List',
    email_template: 'Hi {{firstName}},\n\nI hope this email finds you well.\n\nSincerely,\nYour Name',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'daily_limit' || name === 'email_gap' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    try {
      // Prepare the campaign data
      const campaignData = {
        ...formData,
        template: 'Default Template',
        sequences: 'Sequence 1'
      };
      
      // The server will handle adding the user email tag
      
      await createCampaign(campaignData);
      router.push('/emails');
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    }
  };

  return (
    <DashboardLayout title="Create Campaign">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1e1b4b]">Create New Campaign</h1>
          <Link href="/emails" className="nextprop-outline-button flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </div>
        
        <div className="nextprop-card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
                {error}
              </div>
            )}
            
            <p className="text-sm text-gray-500 mb-6">
              Create a new email campaign. This campaign will only be visible to your account.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter campaign name"
                  className="nextprop-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Limit
                </label>
                <input 
                  type="number"
                  name="daily_limit"
                  value={formData.daily_limit}
                  onChange={handleInputChange}
                  min={1}
                  max={1000}
                  className="nextprop-input w-full"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum emails to send per day
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Gap (minutes)
                </label>
                <input 
                  type="number"
                  name="email_gap"
                  value={formData.email_gap}
                  onChange={handleInputChange}
                  min={1}
                  max={120}
                  className="nextprop-input w-full"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Minutes between each email
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email List
                </label>
                <select
                  name="email_list"
                  value={formData.email_list}
                  onChange={handleSelectChange}
                  className="nextprop-input w-full"
                >
                  <option value="Test List">Test List</option>
                  <option value="Marketing Leads">Marketing Leads</option>
                  <option value="Cold Outreach">Cold Outreach</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Template
                </label>
                <textarea
                  name="email_template"
                  value={formData.email_template}
                  onChange={handleInputChange}
                  placeholder="Enter email template"
                  rows={5}
                  className="nextprop-input w-full"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use {'{{firstName}}'}, {'{{lastName}}'}, etc. for personalization
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-8">
              <Link 
                href="/emails" 
                className="nextprop-outline-button"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={loading?.campaigns}
                className="nextprop-button"
              >
                {loading?.campaigns ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 