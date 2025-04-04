"use client";

import { useState, useEffect } from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { listCampaigns, listVoiceClones, Campaign, VoiceClone } from '@/lib/voicedropCampaignService';

interface AutomatedCallFormProps {
  onCallSubmit: (callData: CallData) => void;
  isLoading?: boolean;
}

export interface CallData {
  first_name: string;
  phone: string;
  street_name: string;
  script: string;
  campaignId?: string;
  voiceCloneId?: string;
}

export default function AutomatedCallForm({ onCallSubmit, isLoading = false }: AutomatedCallFormProps) {
  const [formData, setFormData] = useState<CallData>({
    first_name: '',
    phone: '',
    street_name: '',
    script: ''
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch campaigns and voice clones on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        // Fetch campaigns
        const campaignsData = await listCampaigns();
        setCampaigns(campaignsData);
        
        // Fetch voice clones
        const voiceClonesData = await listVoiceClones();
        setVoiceClones(voiceClonesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // If a campaign is selected, update the script with the campaign's script
    if (name === 'campaignId' && value) {
      const selectedCampaign = campaigns.find(campaign => campaign._id === value);
      if (selectedCampaign) {
        setFormData(prev => ({ ...prev, script: selectedCampaign.Script }));
      }
    }
  };

  // Generate default script when first_name or street_name changes
  const updateDefaultScript = (first_name: string, street_name: string) => {
    // Only update if no campaign is selected and no script is set
    if (first_name && street_name && !formData.script && !formData.campaignId) {
      const defaultScript = `Hello ${first_name}, I noticed your property on ${street_name} and wanted to connect with you about it. Please call me back when you get a chance. Thank you!`;
      setFormData(prev => ({ ...prev, script: defaultScript }));
    }
  };

  // Update script when name or street changes (only if script was empty)
  React.useEffect(() => {
    updateDefaultScript(formData.first_name, formData.street_name);
  }, [formData.first_name, formData.street_name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCallSubmit(formData);
  };

  // Filter active campaigns only
  const activeCampaigns = campaigns.filter(
    campaign => campaign["Campaign Status"] === "Active" || 
                campaign["Campaign Status"] === "Upload Completed" || 
                campaign["Campaign Status"] === "Paused"
  );

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
            <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign (Optional)
            </label>
            <select
              id="campaignId"
              name="campaignId"
              value={formData.campaignId || ''}
              onChange={handleChange}
              className="nextprop-input py-2 px-3 w-full rounded-md"
              disabled={isLoadingData}
            >
              <option value="">Send as direct message (no campaign)</option>
              {isLoadingData ? (
                <option>Loading campaigns...</option>
              ) : (
                activeCampaigns.map(campaign => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.Name} ({campaign["Campaign Status"]})
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a campaign to add this prospect to an existing campaign
            </p>
          </div>

          <div>
            <label htmlFor="voiceCloneId" className="block text-sm font-medium text-gray-700 mb-1">
              Voice Clone
            </label>
            <select
              id="voiceCloneId"
              name="voiceCloneId"
              value={formData.voiceCloneId || ''}
              onChange={handleChange}
              className="nextprop-input py-2 px-3 w-full rounded-md"
              disabled={isLoadingData}
            >
              <option value="">Use default voice</option>
              {isLoadingData ? (
                <option>Loading voice clones...</option>
              ) : (
                voiceClones.map(voiceClone => (
                  <option key={voiceClone.id} value={voiceClone.id}>
                    {voiceClone.name}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose a voice clone or use the default
            </p>
          </div>

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
            <label htmlFor="street_name" className="block text-sm font-medium text-gray-700 mb-1">
              Street Name
            </label>
            <input
              type="text"
              id="street_name"
              name="street_name"
              required
              value={formData.street_name}
              onChange={handleChange}
              placeholder="Main Street"
              className="nextprop-input py-2 px-3 w-full rounded-md"
            />
          </div>

          <div>
            <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-1">
              Voicemail Script
            </label>
            <textarea
              id="script"
              name="script"
              required
              value={formData.script}
              onChange={handleChange}
              placeholder="Enter your personalized voicemail script here"
              className="nextprop-input py-2 px-3 w-full rounded-md"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">Personalize your message using the recipient's name and property details</p>
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