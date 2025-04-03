import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { BoltIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, DocumentTextIcon, CurrencyDollarIcon, MapPinIcon, HomeIcon } from '@heroicons/react/24/outline';
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
const DEFAULT_BUYING_CRITERIA = "Properties between $500,000 and $2 million in the Bay Area, single-family homes, cosmetic rehabs only, no long-term projects";

// Add this constant after DEFAULT_BUYING_CRITERIA
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
];

const PROPERTY_TYPES = [
  "All", "Single-family", "Multi-family", "Condo", "Townhouse", "Commercial", "Land"
];

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

  // Update the component state for buying criteria
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000000 });
  const [region, setRegion] = useState('All States');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['All']);
  const [additionalCriteria, setAdditionalCriteria] = useState('');

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

  // Modify the useEffect that parses buying criteria
  useEffect(() => {
    // Parse buying criteria when loading config
    if (config.buyingCriteria) {
      try {
        // Simple parsing - this could be more sophisticated based on your data format
        const criteriaText = config.buyingCriteria;
        console.log('Parsing criteria text:', criteriaText);
        
        // Extract price range
        const priceRangeMatch = criteriaText.match(/between \$(\d+\.?\d*)( million)? and \$(\d+\.?\d*)( million)?/i);
        const maxPriceMatch = criteriaText.match(/up to \$(\d+\.?\d*)( million)?/i);
        
        if (priceRangeMatch) {
          console.log('Price range match:', priceRangeMatch);
          const minPriceValue = parseFloat(priceRangeMatch[1].replace(/,/g, ''));
          const maxPriceValue = parseFloat(priceRangeMatch[3].replace(/,/g, ''));
          const minPrice = priceRangeMatch[2] ? minPriceValue * 1000000 : minPriceValue;
          const maxPrice = priceRangeMatch[4] ? maxPriceValue * 1000000 : maxPriceValue;
          
          // Find the closest options in the dropdown
          const priceOptions = [0, 250000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 
                               2000000, 2250000, 2500000, 2750000, 3000000, 5000000, 10000000];
          
          let closestMin = priceOptions[0];
          let closestMax = priceOptions[0];
          
          for (const option of priceOptions) {
            if (Math.abs(option - minPrice) < Math.abs(closestMin - minPrice)) {
              closestMin = option;
            }
            if (Math.abs(option - maxPrice) < Math.abs(closestMax - maxPrice)) {
              closestMax = option;
            }
          }
          
          setPriceRange({ min: closestMin, max: closestMax });
          console.log('Set price range to:', { min: closestMin, max: closestMax });
        } else if (maxPriceMatch) {
          console.log('Max price match:', maxPriceMatch);
          const priceValue = parseFloat(maxPriceMatch[1].replace(/,/g, ''));
          const price = maxPriceMatch[2] ? priceValue * 1000000 : priceValue;
          
          // Find the closest option in the dropdown
          const priceOptions = [250000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 
                               2000000, 2250000, 2500000, 2750000, 3000000, 5000000, 10000000];
          
          let closest = priceOptions[0];
          for (const option of priceOptions) {
            if (Math.abs(option - price) < Math.abs(closest - price)) {
              closest = option;
            }
          }
          
          setPriceRange({ min: 0, max: closest });
          console.log('Set price to:', { min: 0, max: closest });
        } else {
          console.log('No price match found, using defaults');
          setPriceRange({ min: 0, max: 2000000 });
        }
        
        // Extract region
        let foundState = false;
        
        if (criteriaText.toLowerCase().includes('nationwide')) {
          setRegion('All States');
          foundState = true;
          console.log('Found region: All States (nationwide)');
        } else {
          for (const state of US_STATES) {
            if (criteriaText.toLowerCase().includes(state.toLowerCase())) {
              setRegion(state);
              foundState = true;
              console.log('Found region:', state);
              break;
            }
          }
        }
        
        // If no state found, default to All States
        if (!foundState) {
          setRegion('All States');
          console.log('No region found, using default: All States');
        }
        
        // Extract property type
        let foundType = false;
        
        if (criteriaText.toLowerCase().includes('all property types')) {
          setPropertyTypes(['All']);
          foundType = true;
          console.log('Found property type: All');
        } else {
          for (const type of PROPERTY_TYPES.slice(1)) { // Skip "All"
            if (criteriaText.toLowerCase().includes(type.toLowerCase())) {
              setPropertyTypes([type]);
              foundType = true;
              console.log('Found property type:', type);
              break;
            }
          }
        }
        
        if (!foundType) {
          setPropertyTypes(['All']);
          console.log('No property type found, using default: All');
        }
        
        // Extract additional criteria - treat anything after the standard format as additional
        const basicFormatRegex = /Properties up to \$[\d\.,]+ ?(million )?(nationwide|in [A-Za-z\s]+), ([A-Za-z\s\-]+properties|all property types)/i;
        const basicFormatMatch = criteriaText.match(basicFormatRegex);
        
        if (basicFormatMatch) {
          // Get everything after the basic format as additional criteria
          const fullMatch = basicFormatMatch[0];
          const additionalText = criteriaText.substring(criteriaText.indexOf(fullMatch) + fullMatch.length).replace(/^,\s*/, '').trim();
          
          if (additionalText) {
            setAdditionalCriteria(additionalText);
            console.log('Found additional criteria:', additionalText);
          } else {
            setAdditionalCriteria('');
            console.log('No additional criteria found');
          }
        } else {
          // If we can't match the format, try to extract after common phrases
          const commonPhrases = ['properties', 'property types', 'nationwide', 'in the'];
          let additionalText = criteriaText;
          
          for (const phrase of commonPhrases) {
            const index = additionalText.toLowerCase().indexOf(phrase);
            if (index > -1) {
              const phraseEnd = index + phrase.length;
              const afterPhrase = additionalText.substring(phraseEnd).replace(/^,\s*/, '');
              if (afterPhrase && afterPhrase.trim()) {
                additionalText = afterPhrase.trim();
              }
            }
          }
          
          // If we still have text and it's not just the original, it might be additional
          if (additionalText && additionalText !== criteriaText) {
            setAdditionalCriteria(additionalText);
            console.log('Extracted possible additional criteria:', additionalText);
          } else {
            setAdditionalCriteria('');
            console.log('Unable to extract additional criteria');
          }
        }
      } catch (e) {
        console.error('Error parsing buying criteria:', e);
        // Set safe defaults
        setPriceRange({ min: 0, max: 2000000 });
        setRegion('All States');
        setPropertyTypes(['All']);
        setAdditionalCriteria('');
        console.log('Error during parsing, using defaults');
      }
    } else {
      // If no criteria at all, set defaults
      setPriceRange({ min: 0, max: 2000000 });
      setRegion('All States');
      setPropertyTypes(['All']);
      setAdditionalCriteria('');
      console.log('No criteria text, using defaults');
    }
  }, [config.buyingCriteria]);

  // Add this inside the component, after state declarations
  useEffect(() => {
    // Initial setup: Make sure buying criteria is properly formatted from the start
    if (config.buyingCriteria === DEFAULT_BUYING_CRITERIA) {
      // If using the default, set all the structured form values
      setPriceRange({ min: 500000, max: 2000000 });
      setRegion('All States');
      setPropertyTypes(['All']);
      setAdditionalCriteria('cosmetic rehabs only, no long-term projects');
      
      // Format the buying criteria text based on the structured values
      // (This will be done in the next render cycle)
      setTimeout(updateBuyingCriteria, 0);
    }
  }, []);

  // Modify the existing useEffect at the end of the parsing effect
  useEffect(() => {
    // After parsing buying criteria and setting all form values,
    // update the buying criteria string to ensure it's formatted correctly
    // Skip if the component is still loading
    if (!isLoading && config.buyingCriteria) {
      // Delay to ensure all state updates from parsing have been applied
      const timer = setTimeout(() => {
        updateBuyingCriteria();
        console.log('Regenerated buying criteria after parsing');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [priceRange, region, propertyTypes, additionalCriteria, isLoading]);

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

  // Function to update buying criteria text based on structured fields
  const updateBuyingCriteria = () => {
    const formatPrice = (price: number) => {
      if (price >= 1000000) {
        const millions = price / 1000000;
        return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} million`;
      } else {
        return `$${price.toLocaleString()}`;
      }
    };
      
    // Format location text
    let locationText = region === 'All States' ? 'nationwide' : `in ${region}`;
    
    // Format property type text
    let propertyText = '';
    if (propertyTypes.includes('All')) {
      propertyText = 'all property types';
    } else {
      propertyText = propertyTypes.join(', ').toLowerCase();
      
      // Add proper suffix
      if (!propertyTypes.includes('Land')) {
        propertyText += ' properties';
      }
    }
    
    // Build the standard criteria text format with price range
    let criteriaText = priceRange.min > 0 
      ? `Properties between ${formatPrice(priceRange.min)} and ${formatPrice(priceRange.max)} ${locationText}`
      : `Properties up to ${formatPrice(priceRange.max)} ${locationText}`;
    
    criteriaText += `, ${propertyText}`;
    
    // Only add additional criteria if it exists and is not just whitespace
    if (additionalCriteria.trim()) {
      criteriaText += `, ${additionalCriteria.trim()}`;
    }
    
    // Update the config with the formatted criteria
    const updatedConfig = {
      ...config,
      buyingCriteria: criteriaText
    };
    
    setConfig(updatedConfig);
    
    // Also save to localStorage to ensure persistence
    // But don't await this to avoid blocking
    saveAIAgentConfig(updatedConfig)
      .then(() => {
        console.log('Buying criteria auto-saved to localStorage:', criteriaText);
        // Trigger refresh to ensure other components are notified
        triggerConfigRefresh();
      })
      .catch(error => {
        console.error('Error auto-saving buying criteria:', error);
      });
    
    return criteriaText;
  };

  // Handle changes to the price range
  const handlePriceChange = (value: number, field: 'min' | 'max') => {
    setPriceRange(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'min' && updated.min > updated.max) {
        updated.min = updated.max;
      }
      if (field === 'max' && updated.max < updated.min) {
        updated.max = updated.min;
      }
      return updated;
    });
    setTimeout(updateBuyingCriteria, 0);
  };

  // Handle changes to the region
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value);
    setTimeout(updateBuyingCriteria, 0);
  };

  // Handle changes to property types selection
  const handlePropertyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'All') {
      setPropertyTypes(['All']);
    } else {
      setPropertyTypes([value]);
    }
    setTimeout(updateBuyingCriteria, 0);
  };

  // Handle changes to additional criteria
  const handleAdditionalCriteriaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalCriteria(e.target.value);
    setTimeout(updateBuyingCriteria, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Make sure the buying criteria is up to date before saving
      updateBuyingCriteria();
      
      // Small delay to ensure the state has updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
        {/* Buying Criteria - Compact version with US states */}
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <BuildingOfficeIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Buying Criteria</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Range */}
            <div>
              <div className="flex items-center mb-2">
                <CurrencyDollarIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2" />
                <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                  Price Range
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <select
                    className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm text-sm"
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange(Number(e.target.value), 'min')}
                  >
                    <option value={0}>Min: No Limit</option>
                    <option value={250000}>Min: $250K</option>
                    <option value={500000}>Min: $500K</option>
                    <option value={750000}>Min: $750K</option>
                    <option value={1000000}>Min: $1M</option>
                    <option value={1250000}>Min: $1.25M</option>
                    <option value={1500000}>Min: $1.5M</option>
                    <option value={1750000}>Min: $1.75M</option>
                    <option value={2000000}>Min: $2M</option>
                    <option value={2250000}>Min: $2.25M</option>
                    <option value={2500000}>Min: $2.5M</option>
                  </select>
                </div>
                <div className="text-[var(--nextprop-text-tertiary)] text-sm">to</div>
                <div className="flex-1">
                  <select
                    className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm text-sm"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange(Number(e.target.value), 'max')}
                  >
                    <option value={250000}>Max: $250K</option>
                    <option value={500000}>Max: $500K</option>
                    <option value={750000}>Max: $750K</option>
                    <option value={1000000}>Max: $1M</option>
                    <option value={1250000}>Max: $1.25M</option>
                    <option value={1500000}>Max: $1.5M</option>
                    <option value={1750000}>Max: $1.75M</option>
                    <option value={2000000}>Max: $2M</option>
                    <option value={2250000}>Max: $2.25M</option>
                    <option value={2500000}>Max: $2.5M</option>
                    <option value={2750000}>Max: $2.75M</option>
                    <option value={3000000}>Max: $3M</option>
                    <option value={5000000}>Max: $5M</option>
                    <option value={10000000}>Max: $10M+</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Region - Updated to US States */}
            <div>
              <div className="flex items-center mb-2">
                <MapPinIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2" />
                <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                  State
                </label>
              </div>
              <select
                className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                value={region}
                onChange={handleRegionChange}
              >
                <option value="All States">All States (Nationwide)</option>
                <option value="Alabama">Alabama</option>
                <option value="Alaska">Alaska</option>
                <option value="Arizona">Arizona</option>
                <option value="Arkansas">Arkansas</option>
                <option value="California">California</option>
                <option value="Colorado">Colorado</option>
                <option value="Connecticut">Connecticut</option>
                <option value="Delaware">Delaware</option>
                <option value="Florida">Florida</option>
                <option value="Georgia">Georgia</option>
                <option value="Hawaii">Hawaii</option>
                <option value="Idaho">Idaho</option>
                <option value="Illinois">Illinois</option>
                <option value="Indiana">Indiana</option>
                <option value="Iowa">Iowa</option>
                <option value="Kansas">Kansas</option>
                <option value="Kentucky">Kentucky</option>
                <option value="Louisiana">Louisiana</option>
                <option value="Maine">Maine</option>
                <option value="Maryland">Maryland</option>
                <option value="Massachusetts">Massachusetts</option>
                <option value="Michigan">Michigan</option>
                <option value="Minnesota">Minnesota</option>
                <option value="Mississippi">Mississippi</option>
                <option value="Missouri">Missouri</option>
                <option value="Montana">Montana</option>
                <option value="Nebraska">Nebraska</option>
                <option value="Nevada">Nevada</option>
                <option value="New Hampshire">New Hampshire</option>
                <option value="New Jersey">New Jersey</option>
                <option value="New Mexico">New Mexico</option>
                <option value="New York">New York</option>
                <option value="North Carolina">North Carolina</option>
                <option value="North Dakota">North Dakota</option>
                <option value="Ohio">Ohio</option>
                <option value="Oklahoma">Oklahoma</option>
                <option value="Oregon">Oregon</option>
                <option value="Pennsylvania">Pennsylvania</option>
                <option value="Rhode Island">Rhode Island</option>
                <option value="South Carolina">South Carolina</option>
                <option value="South Dakota">South Dakota</option>
                <option value="Tennessee">Tennessee</option>
                <option value="Texas">Texas</option>
                <option value="Utah">Utah</option>
                <option value="Vermont">Vermont</option>
                <option value="Virginia">Virginia</option>
                <option value="Washington">Washington</option>
                <option value="West Virginia">West Virginia</option>
                <option value="Wisconsin">Wisconsin</option>
                <option value="Wyoming">Wyoming</option>
                <option value="District of Columbia">District of Columbia</option>
              </select>
            </div>
            
            {/* Property Type */}
            <div>
              <div className="flex items-center mb-2">
                <HomeIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2" />
                <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                  Property Type
                </label>
              </div>
              <select
                className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                value={propertyTypes[0]}
                onChange={handlePropertyTypeChange}
              >
                <option value="All">All Property Types</option>
                <option value="Single-family">Single-family</option>
                <option value="Multi-family">Multi-family</option>
                <option value="Condo">Condo/Apartment</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Commercial">Commercial</option>
                <option value="Land">Land/Lot</option>
              </select>
            </div>
          </div>
          
          {/* Additional Criteria */}
          <div className="mt-4">
            <label htmlFor="additionalCriteria" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-2">
              Additional Requirements (Optional)
            </label>
            <textarea
              id="additionalCriteria"
              value={additionalCriteria}
              onChange={handleAdditionalCriteriaChange}
              className="nextprop-input w-full p-3 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
              rows={2}
              placeholder="E.g., cosmetic rehabs only, no structural issues, etc."
            />
            <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1">
              Additional preferences beyond price, location, and property type
            </p>
          </div>
          
          {/* Only show debug preview in development mode and when NODE_ENV is explicitly set */}
          {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true' && (
            <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-300 text-xs text-gray-600">
              <div className="font-medium mb-1">Debug - Buying Criteria String:</div>
              <div>{config.buyingCriteria}</div>
            </div>
          )}
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