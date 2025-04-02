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
    isEnabled: true,
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
        isEnabled: true,
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
      // Ensure isEnabled is always true before saving
      const configToSave = {
        ...config,
        isEnabled: true
      };
      
      // Save to local storage first
      await saveAIAgentConfig(configToSave);
      
      // Then sync with server
      await syncConfigWithServer(configToSave);
      
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--nextprop-primary)]"></div>
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
    <div className="bg-gradient-to-br from-[var(--nextprop-surface)] to-[var(--nextprop-surface-hover)] rounded-lg shadow-lg p-6 border border-[var(--nextprop-border)]">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-[var(--nextprop-primary)] p-3 rounded-full shadow-md">
          <BoltIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--nextprop-text-primary)] bg-gradient-to-r from-[var(--nextprop-primary)] to-[var(--nextprop-primary-light)] bg-clip-text text-transparent">
            AI Agent Configuration
          </h1>
          <p className="text-[var(--nextprop-text-secondary)] text-sm">Configure your automated real estate assistant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Identity */}
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <UserCircleIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Agent Identity</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                Agent Name
              </label>
              <input
                type="text"
                id="agentName"
                name="agentName"
                value={config.agentName}
                onChange={handleInputChange}
                className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
              />
            </div>
            
            <div>
              <label htmlFor="speakingOnBehalfOf" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                Speaking on Behalf of
              </label>
              <input
                type="text"
                id="speakingOnBehalfOf"
                name="speakingOnBehalfOf"
                value={config.speakingOnBehalfOf || ''}
                onChange={handleInputChange}
                placeholder={placeholders.speakingOnBehalfOf}
                className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <EnvelopeIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Contact Information</h3>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="contactPhone" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--nextprop-border)] bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-tertiary)]">
                  <PhoneIcon className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={config.contactPhone || ''}
                  onChange={handleInputChange}
                  placeholder={placeholders.contactPhone}
                  className="nextprop-input w-full p-2.5 rounded-r-lg border border-[var(--nextprop-border)] focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                />
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor="contactEmail" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                Email Address
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--nextprop-border)] bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-tertiary)]">
                  <EnvelopeIcon className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={config.contactEmail || ''}
                  onChange={handleInputChange}
                  placeholder={placeholders.contactEmail}
                  className="nextprop-input w-full p-2.5 rounded-r-lg border border-[var(--nextprop-border)] focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {/* Buying Criteria */}
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <BuildingOfficeIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Buying Criteria</h3>
          </div>
          <div>
            <label htmlFor="buyingCriteria" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-2">
              Purchase Details
            </label>
            <textarea
              id="buyingCriteria"
              name="buyingCriteria"
              value={config.buyingCriteria}
              onChange={handleInputChange}
              className="nextprop-input w-full p-3 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
              rows={4}
            />
            <p className="text-sm text-[var(--nextprop-text-tertiary)] mt-2 italic">Include price range, location preferences, property types, etc.</p>
          </div>
        </div>

        {/* Deal Objective */}
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <DocumentTextIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Deal Objective</h3>
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
                    ? 'bg-gradient-to-r from-[var(--nextprop-primary-light)]/10 to-[var(--nextprop-accent)]/20 border-[var(--nextprop-primary-light)] text-[var(--nextprop-primary-dark)] border shadow-sm'
                    : 'border border-[var(--nextprop-border)] text-[var(--nextprop-text-secondary)] hover:bg-[var(--nextprop-surface-hover)]'
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
          className="px-6 py-2.5 bg-gradient-to-r from-[var(--nextprop-primary)] to-[var(--nextprop-primary-light)] text-white rounded-lg hover:from-[var(--nextprop-primary-dark)] hover:to-[var(--nextprop-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transform transition-transform hover:scale-105"
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