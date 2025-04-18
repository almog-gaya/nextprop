import React from 'react';
import CampaignSettingsForm from './CampaignSettingsForm';
import { useAuth } from '@/contexts/AuthContext';

interface CampaignFormProps {
  campaignName: string;
  script: string;
  phoneNumbers: string[];
  selectedPhoneNumber: string | null;
  voiceClones: any[];
  selectedVoiceClone: string;
  settings: any;
  selectedContacts: any[];
  onNameChange: (value: string) => void;
  onScriptChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onVoiceCloneChange: (value: string) => void;
  onSettingsSave: (settings: any) => void;
  onGenerateScript: () => void;
  onCreateCampaign: () => void;
  onRefreshVoiceClones: () => void;
  isVoiceMailModule: boolean;
}

export default function CampaignForm({
  campaignName,
  script,
  phoneNumbers,
  selectedPhoneNumber,
  voiceClones,
  selectedVoiceClone,
  settings,
  selectedContacts,
  onNameChange,
  onScriptChange,
  onPhoneNumberChange,
  onVoiceCloneChange,
  onSettingsSave,
  onGenerateScript,
  onCreateCampaign,
  onRefreshVoiceClones,
  isVoiceMailModule,
}: CampaignFormProps) {
  const { user } = useAuth();
  // Counter for step numbers
  let stepNumber = 2;

  return (
    <div className="space-y-5">
      {/* Campaign Name */}
      <div className="border border-gray-200 rounded-md p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          
          <h4 className="text-sm font-medium text-gray-700 mb-2">Step {stepNumber++}: Campaign Name</h4>
        </label>
        <input
          id="campaignName"
          type="text"
          className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-gray-50 px-4 py-3"
          value={campaignName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter campaign name"
        />
      </div>

      {/* Phone Number Selection */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
          
          <h4 className="text-sm font-medium text-gray-700 mb-2">Step {stepNumber++}: Select From Number</h4>

        </label>
        <select
          id="phoneNumber"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
          value={selectedPhoneNumber || ''}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
        >
          <option value="" className="text-gray-500">Select a number</option>
          {phoneNumbers.map((phone) => (
            <option key={phone} value={phone} className="text-gray-900">
              {phone}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Clone Selection - Only shown if isVoiceMailModule is true */}
      {isVoiceMailModule && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <label htmlFor="voiceClone" className="block text-sm font-medium text-gray-700 mb-2">
            
            <h4 className="text-sm font-medium text-gray-700 mb-2">Step {stepNumber++}: Select Voice Clone (Optional)</h4>
          </label>
          <div className="flex space-x-2">
            <select
              id="voiceClone"
              className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={selectedVoiceClone}
              onChange={(e) => onVoiceCloneChange(e.target.value)}
            >
              <option value="">Use default system voice</option>
              {voiceClones.map((clone) => (
                <option key={clone.id} value={clone.id}>
                  {clone.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRefreshVoiceClones}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Script Input */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Step {stepNumber++}: Campaign Script</h4>
        </label>
        <textarea
          id="script"
          className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-gray-50 px-4 py-3"
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          rows={4}
          placeholder="Enter your voicemail script here..."
        />
        <div className="mt-3">
          <p className="text-sm text-gray-500 mb-2">Click to insert variables into your script:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onScriptChange(script + "{{first_name}}")}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 border border-purple-200"
              title="Inserts the contact's first name ({{first_name}})"
            >
              Contact First Name
            </button>
            <button
              type="button"
              onClick={() => onScriptChange(script + "{{street_name}}")}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 border border-purple-200"
              title="Inserts the property street name ({{street_name}})"
            >
              Street Name
            </button>
            {/* <button
              type="button"
              onClick={() => onScriptChange(script + "{{property_url}}")}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 border border-purple-200"
              title="Inserts the property URL ({{property_url}})"
            >
              Property URL
            </button>
            <button
              type="button"
              onClick={() => onScriptChange(script + "{{property_price}}")}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 border border-purple-200"
              title="Inserts the property price ({{property_price}})"
            >
              Property Price
            </button> */}
            {user && (
              <button
                type="button"
                onClick={() => onScriptChange(script + user.name)}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 border border-purple-200"
                title={`Inserts your name: ${user.name}`}
              >
                Your Name ({user.name})
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onGenerateScript}
          className="mt-3 text-sm text-purple-600 hover:text-purple-500"
        >
          Generate Default Script
        </button>
      </div>

      {/* Campaign Settings */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Step {stepNumber++}: Campaign Settings</h4>
        <CampaignSettingsForm settings={settings} onSave={onSettingsSave} isVoiceMailModule={isVoiceMailModule} isAutomationsModule={false} />
      </div>

      {/* Create Campaign Button */}
      <div className="border border-gray-200 rounded-md p-6 bg-gradient-to-r from-green-50 to-green-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-800">Step {stepNumber}: Launch Campaign</h4>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
            {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''} Selected
          </span>
        </div>
        
        <button
          onClick={onCreateCampaign}
          disabled={selectedContacts.length === 0 || !selectedPhoneNumber || !script || !campaignName}
          className={`w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${selectedContacts.length > 0 && selectedPhoneNumber && script && campaignName
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              : 'bg-gray-400 cursor-not-allowed'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          Launch Campaign
        </button>
      </div>
    </div>
  );
}