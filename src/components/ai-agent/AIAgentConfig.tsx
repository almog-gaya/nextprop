import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { BoltIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { AIAgentConfig as AIAgentConfigType } from '@/types/ai-agent';
import { saveAIAgentConfig, loadAIAgentConfig } from '@/lib/ai-agent';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

// Create a custom event to signal config changes
export const triggerConfigRefresh = () => {
  // Use a custom event to notify other components about the config change
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('ai-agent-config-changed');
    window.dispatchEvent(event);
  }
};

// Function to sync config with server
const syncConfigWithServer = async (config: AIAgentConfigType) => {
  try {
    const response = await fetch('/api/ai-agent/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync config with server');
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing config with server:', error);
    return false;
  }
};

// Default buying criteria text
const DEFAULT_BUYING_CRITERIA = "Properties up to $2 million in the Bay Area, single-family homes, cosmetic rehabs only, no long-term projects";

export default function AIAgentConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AIAgentConfigType>({
    isEnabled: false,
    tone: 'friendly',
    length: 'medium',
    customInstructions: '',
    updatedAt: new Date(),
    agentName: 'Jane Smith',
    speakingOnBehalfOf: '',
    contactPhone: '',
    contactEmail: '',
    buyingCriteria: DEFAULT_BUYING_CRITERIA,
    dealObjective: 'creative-finance',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  // Update config with user details when user data is available
  useEffect(() => {
    if (user) {
      const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const userPhone = user.phone || (user.phoneNumbers && user.phoneNumbers.length > 0 ? user.phoneNumbers[0].phoneNumber : '');
      const userEmail = user.email || '';
      
      setConfig(prevConfig => {
        // Prepare updated config with user data
        const updatedConfig = {
          ...prevConfig,
          // Only update fields that aren't already set by the user
          agentName: prevConfig.agentName || 'Jane Smith',
          speakingOnBehalfOf: prevConfig.speakingOnBehalfOf || userName || 'NextProp Real Estate',
          contactPhone: prevConfig.contactPhone || userPhone,
          contactEmail: prevConfig.contactEmail || userEmail,
          buyingCriteria: prevConfig.buyingCriteria || DEFAULT_BUYING_CRITERIA,
          // Ensure we have a valid deal objective
          dealObjective: prevConfig.dealObjective || 'creative-finance',
        };
        
        // Immediately save this to persistence so it's available server-side
        saveAIAgentConfig(updatedConfig)
          .then(() => {
            console.log('Updated AI Agent config with user details:', {
              agentName: updatedConfig.agentName,
              speakingOnBehalfOf: updatedConfig.speakingOnBehalfOf,
              contactPhone: updatedConfig.contactPhone ? 'set' : 'not set',
              contactEmail: updatedConfig.contactEmail ? 'set' : 'not set',
              buyingCriteria: updatedConfig.buyingCriteria ? 'set' : 'not set',
              dealObjective: updatedConfig.dealObjective
            });
            triggerConfigRefresh();
          })
          .catch(error => {
            console.error('Error auto-saving user details to config:', error);
          });
        
        return updatedConfig;
      });
    } else {
      // Even with no user, ensure we have valid defaults for all fields
      setConfig(prevConfig => {
        if (!prevConfig.speakingOnBehalfOf || !prevConfig.agentName) {
          const updatedConfig = {
            ...prevConfig,
            agentName: prevConfig.agentName || 'Jane Smith',
            speakingOnBehalfOf: prevConfig.speakingOnBehalfOf || 'NextProp Real Estate',
            buyingCriteria: prevConfig.buyingCriteria || DEFAULT_BUYING_CRITERIA,
            dealObjective: prevConfig.dealObjective || 'creative-finance',
          };
          
          // Save immediately
          saveAIAgentConfig(updatedConfig)
            .then(() => {
              console.log('Set default values for AI Agent config:', {
                agentName: updatedConfig.agentName,
                speakingOnBehalfOf: updatedConfig.speakingOnBehalfOf,
                buyingCriteria: updatedConfig.buyingCriteria ? 'set' : 'not set',
                dealObjective: updatedConfig.dealObjective
              });
              triggerConfigRefresh();
            })
            .catch(error => {
              console.error('Error saving default AI Agent config values:', error);
            });
          
          return updatedConfig;
        }
        return prevConfig;
      });
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const savedConfig: AIAgentConfigType = await loadAIAgentConfig();
      
      // Ensure all defaults are set
      const configWithDefaults = {
        ...savedConfig,
        agentName: savedConfig.agentName || 'Jane Smith',
        buyingCriteria: savedConfig.buyingCriteria || DEFAULT_BUYING_CRITERIA,
        dealObjective: savedConfig.dealObjective || 'creative-finance',
        tone: savedConfig.tone || 'friendly',
        length: savedConfig.length || 'medium'
      };
      
      // Merge with user data if available for any fields that aren't set
      if (user) {
        const userName = user.name || `${user.firstName || ''}${user.lastName ? ' ' + user.lastName : ''}`.trim();
        const userPhone = user.phone || (user.phoneNumbers && user.phoneNumbers.length > 0 ? user.phoneNumbers[0].phoneNumber : '');
        const userEmail = user.email || '';
        
        configWithDefaults.speakingOnBehalfOf = configWithDefaults.speakingOnBehalfOf || userName || 'NextProp Real Estate';
        configWithDefaults.contactPhone = configWithDefaults.contactPhone || userPhone;
        configWithDefaults.contactEmail = configWithDefaults.contactEmail || userEmail;
      } else if (!configWithDefaults.speakingOnBehalfOf) {
        // If no user and no speaking on behalf of, set a default
        configWithDefaults.speakingOnBehalfOf = 'NextProp Real Estate';
      }
      
      // Log the complete config that's being set
      console.log('Loaded complete AI Agent config:', {
        agentName: configWithDefaults.agentName,
        speakingOnBehalfOf: configWithDefaults.speakingOnBehalfOf,
        tone: configWithDefaults.tone,
        length: configWithDefaults.length,
        hasContactInfo: !!(configWithDefaults.contactPhone || configWithDefaults.contactEmail),
        hasBuyingCriteria: !!configWithDefaults.buyingCriteria,
        dealObjective: configWithDefaults.dealObjective,
        isEnabled: configWithDefaults.isEnabled
      });
      
      // Update local state
      setConfig(configWithDefaults);
      
      // Save back to ensure all fields are persisted
      await saveAIAgentConfig(configWithDefaults);
      
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    // Update local state immediately
    setConfig(prev => ({ ...prev, isEnabled: checked }));
    
    // Auto-save when the toggle changes for better UX
    // Use the checked value directly to avoid race condition with the state update
    setTimeout(() => {
      saveAIAgentConfig({ 
        ...config, 
        isEnabled: checked // Use the checked parameter directly
      })
        .then(() => {
          toast.success(`AI Agent ${checked ? 'enabled' : 'disabled'}`);
          triggerConfigRefresh();
        })
        .catch(error => {
          console.error('Error auto-saving config:', error);
          toast.error('Failed to update AI Agent status');
          // Revert the state if the save failed
          setConfig(prev => ({ ...prev, isEnabled: !checked }));
        });
    }, 0);
  };

  const handleDealObjectiveChange = (dealObjective: AIAgentConfigType['dealObjective']) => {
    setConfig(prev => ({ ...prev, dealObjective }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to local storage first
      await saveAIAgentConfig(config);
      
      // Then sync with server
      await syncConfigWithServer(config);
      
      toast.success('AI Agent configuration saved successfully');
      
      // Force a refresh of the debug panel
      triggerConfigRefresh();
      
      // After saving, fetch again to ensure we have the latest
      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Generate placeholders based on user data if available
  const placeholders = {
    agentName: 'Jane Smith',
    speakingOnBehalfOf: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'NextProp User',
    contactPhone: user?.phone || (user?.phoneNumbers && user?.phoneNumbers.length > 0 ? user?.phoneNumbers[0].phoneNumber : '') || '(415) 555-1234',
    contactEmail: user?.email || 'user@nextprop.ai',
  };

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg p-6 border border-blue-100">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-blue-600 p-3 rounded-full shadow-md">
          <BoltIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            AI Agent Configuration
          </h1>
          <p className="text-gray-600 text-sm">Configure your automated real estate assistant</p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Enable AI Agent</h3>
            <p className="text-gray-600">Allow the AI agent to automatically respond to messages</p>
          </div>
          <Switch
            checked={config.isEnabled}
            onChange={handleToggle}
            className={`${
              config.isEnabled ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-inner`}
          >
            <span
              className={`${
                config.isEnabled ? 'translate-x-8' : 'translate-x-1'
              } inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md`}
            />
          </Switch>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Identity */}
        <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
            <UserCircleIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Agent Identity</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                id="agentName"
                name="agentName"
                value={config.agentName}
                onChange={handleInputChange}
                className="nextprop-input w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
            
            <div>
              <label htmlFor="speakingOnBehalfOf" className="block text-sm font-medium text-gray-700 mb-1">
                Speaking on Behalf of
              </label>
              <input
                type="text"
                id="speakingOnBehalfOf"
                name="speakingOnBehalfOf"
                value={config.speakingOnBehalfOf || ''}
                onChange={handleInputChange}
                placeholder={placeholders.speakingOnBehalfOf}
                className="nextprop-input w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <PhoneIcon className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={config.contactPhone || ''}
                  onChange={handleInputChange}
                  placeholder={placeholders.contactPhone}
                  className="nextprop-input w-full p-2.5 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <EnvelopeIcon className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={config.contactEmail || ''}
                  onChange={handleInputChange}
                  placeholder={placeholders.contactEmail}
                  className="nextprop-input w-full p-2.5 rounded-r-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {/* Buying Criteria */}
        <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Buying Criteria</h3>
          </div>
          <div>
            <label htmlFor="buyingCriteria" className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Details
            </label>
            <textarea
              id="buyingCriteria"
              name="buyingCriteria"
              value={config.buyingCriteria}
              onChange={handleInputChange}
              className="nextprop-input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-2 italic">Include price range, location preferences, property types, etc.</p>
          </div>
        </div>

        {/* Deal Objective */}
        <div className="bg-white rounded-lg border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Deal Objective</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([
              { value: 'creative-finance', label: 'Creative Finance' },
              { value: 'cash-offer', label: 'Cash Offer' },
              { value: 'off-market', label: 'Off Market Deals' },
              { value: 'short-sale', label: 'Short Sale' }
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => handleDealObjectiveChange(option.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  config.dealObjective === option.value
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-400 text-blue-700 border shadow-sm'
                    : 'border border-gray-300 text-gray-700 hover:bg-blue-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <button
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transform transition-transform hover:scale-105"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
} 