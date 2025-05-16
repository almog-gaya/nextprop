'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Switch } from '@headlessui/react';
import { BoltIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, DocumentTextIcon, CurrencyDollarIcon, MapPinIcon, HomeIcon, FunnelIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { AIAgentConfig as AIAgentConfigType } from '@/types/ai-agent';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

// Create a custom event to signal config changes
export const triggerConfigRefresh = () => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('ai-agent-config-changed');
    window.dispatchEvent(event);
  }
};

// Function to sync config with server
// const syncConfigWithServer = async (config: AIAgentConfigType) => {
//   try {
//     const response = await fetch('/api/ai-agent/config', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(config),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to sync config with server');
//     }
//     return true;
//   } catch (error) {
//     console.error('Error syncing config with server:', error);
//     return false;
//   }
// };

// Function to save config to Firestore
const saveAIAgentConfig = async (config: AIAgentConfigType, userId: string) => {
  try {
    const configRef = doc(db, 'ai-agent-configs', userId);
    await setDoc(configRef, {
      ...config,
      updatedAt: new Date().toISOString(),
      userId: userId
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving config to Firestore:', error);
    throw error;
  }
};

// Function to load config from Firestore
const loadAIAgentConfig = async (userId: string): Promise<AIAgentConfigType> => {
  try {
    const configRef = doc(db, 'ai-agent-configs', userId);
    const docSnap = await getDoc(configRef);


    // Default Q&A entries
    const defaultQA = [
      {
        id: 'qa_properties',
        question: 'What type of properties are you looking to buy?',
        answer: 'We are primarily interested in single-family homes in the Bay Area. We focus on cosmetic rehabs and avoid long-term projects like new construction.',
        isEnabled: true
      },
      {
        id: 'qa_budget',
        question: 'What is your budget for the purchase?',
        answer: 'We don\'t have a fixed budget. We are open to any price range, as long as the property doesn\'t exceed $2 million, and the owner is willing to consider a cash offer.',
        isEnabled: true
      },
      {
        id: 'qa_agreement',
        question: 'Are you willing to sign a representation agreement?',
        answer: 'Yes, we can sign a representation agreement for specific properties. We also prefer to have the agent who brings us the purchase handle the sale as well.',
        isEnabled: true
      },
      {
        id: 'qa_closing',
        question: 'What is the estimated time to close the transaction?',
        answer: 'We can close quickly if the offer is accepted and all requirements are met. The process usually takes weeks to complete.',
        isEnabled: true
      },
      {
        id: 'qa_outside',
        question: 'Are you interested in properties outside of the Bay Area?',
        answer: 'Currently, we focus on properties within the Bay Area, but we\'re open to reviewing nearby options if the deal is attractive.',
        isEnabled: true
      },
      {
        id: 'qa_repairs',
        question: 'What happens if the property needs repairs?',
        answer: 'That\'s not a problem. We specialize in cosmetic rehabs and have our own construction company to handle any necessary repairs.',
        isEnabled: true
      }
    ];

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isEnabled: data.isEnabled ?? true,
        enabledPipelines: Array.isArray(data.enabledPipelines) ? data.enabledPipelines : [],
        tone: data.tone || 'friendly',
        length: data.length || 'medium',
        customInstructions: data.customInstructions || '',
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        agentName: data.agentName || 'Jane Smith',
        companyName: data.companyName || '',
        speakingOnBehalfOf: data.speakingOnBehalfOf || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        companyWebsite: data.companyWebsite || '',
        companyAbout: data.companyAbout || '',
        buyingCriteria: data.buyingCriteria || DEFAULT_BUYING_CRITERIA,
        dealObjective: data.dealObjective || 'realtor-creative-finance',

        propertyType: data.propertyType,
        maxPrice: data.maxPrice || 2000000,
        minPrice: data.minPrice || 0,
        region: data.region || 'All States',

        qaEntries: Array.isArray(data.qaEntries) ? data.qaEntries : defaultQA,
      };
    }

    // Default config if no document exists
    return {
      isEnabled: true,
      enabledPipelines: [],
      tone: 'friendly',
      length: 'medium',
      customInstructions: '',
      updatedAt: new Date(),
      agentName: 'Jane Smith',
      companyName: '',
      speakingOnBehalfOf: '',
      contactPhone: '',
      contactEmail: '',
      companyWebsite: '',
      companyAbout: '',
      buyingCriteria: DEFAULT_BUYING_CRITERIA,
      dealObjective: 'realtor-creative-finance',
      propertyType: 'Single-family',
      maxPrice: 2000000,
      minPrice: 0,
      region: 'All States',
      qaEntries: defaultQA,
    };
  } catch (error) {
    console.error('Error loading config from Firestore:', error);
    throw error;
  }
};

// Default buying criteria text
const DEFAULT_BUYING_CRITERIA = "Properties between $500,000 and $2 million in the Bay Area, single-family homes, cosmetic rehabs only, no long-term projects";

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

type Pipeline = {
  id: string;
  name: string;
  stages?: any[];
};

const EXAMPLE_MESSAGES = [
  "Do I know you?",
  "I'm thinking of selling my house at 123 Main St, San Francisco. What do you think it's worth?",
  "I have a property in Oakland that needs a lot of work. Are you interested?",
  "This property is already listed on MLS. Would you like to make an offer?",
  "What's your budget for Bay Area properties?",
  "I have a commercial property available. Are you interested?",
  "Can I call you to discuss a property I'm thinking of selling?",
  "How fast can you close on a property?",
  "Do you handle properties with tenants?",
  "What kind of properties are you looking for?"
];

export default function AIAgentConfig({
  selectedAgentId,
  activeSection,
  hideContainer = false,
  onConfigChange
}: {
  selectedAgentId: string | null;
  activeSection?: string;
  hideContainer?: boolean;
  onConfigChange?: (config: AIAgentConfigType) => void;
}) {
  const { user } = useAuth();
  const [config, setConfig] = useState<AIAgentConfigType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  // Test panel state
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<{ text: string, isUser: boolean, isLoading?: boolean }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000000 });
  const [region, setRegion] = useState('All States');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['All']);
  const [additionalCriteria, setAdditionalCriteria] = useState('');
  const [additionalPropertyTypes, setAdditionalPropertyTypes] = useState('');

  // Add this state variable at the top of the component with the other state variables
  const [fullPrompt, setFullPrompt] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Add this function to handle toggling the prompt visibility
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const togglePromptVisibility = () => setShowFullPrompt(!showFullPrompt);

  // Add this at the top of the component with other state declarations
  const prevConfigRef = useRef<AIAgentConfigType | null>(null);

  // Load initial config and pipelines
  useEffect(() => {
    if (user?.id && selectedAgentId) {
      loadConfig();
      fetchPipelines();
    }
  }, [user?.id, selectedAgentId]);

  // Load user details only if fields are empty
  useEffect(() => {
    if (user && user.id && config) {
      const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const userPhone = user.phone || (user.phoneNumbers && user.phoneNumbers.length > 0 ? user.phoneNumbers[0].phoneNumber : '');
      const userEmail = user.email || '';
      const userWebsite = user.website || '';

      const needsUpdate = !config.companyName || !config.speakingOnBehalfOf || !config.contactPhone || !config.contactEmail || !config.companyWebsite;

      if (needsUpdate) {
        const updatedConfig = {
          ...config,
          companyName: config.companyName || user.firstName || '',
          speakingOnBehalfOf: config.speakingOnBehalfOf || 'NextProp Real Estate',
          contactPhone: config.contactPhone || userPhone,
          contactEmail: config.contactEmail || userEmail,
          companyWebsite: config.companyWebsite || userWebsite,
        };

        // Check if updatedConfig is different from current config
        const hasChanges =
          updatedConfig.companyName !== config.companyName ||
          updatedConfig.speakingOnBehalfOf !== config.speakingOnBehalfOf ||
          updatedConfig.contactPhone !== config.contactPhone ||
          updatedConfig.contactEmail !== config.contactEmail ||
          updatedConfig.companyWebsite !== config.companyWebsite;

        if (hasChanges) {
          console.log(`[Load user details only if fields are empty] setCONFIG`);
          setConfig(updatedConfig);
          saveAIAgentConfig(updatedConfig, user.id)
            .then(() => triggerConfigRefresh())
            .catch(error => console.error('Error auto-saving user details:', error));
        }
      }
    }
  }, [user]);

  // Parse buying criteria when config loads
  useEffect(() => {
    if (config?.buyingCriteria) {
      parseBuyingCriteria(config.buyingCriteria);
    }
  }, [config?.buyingCriteria]);

  // Update buying criteria when inputs change
  useEffect(() => {
    if (!isLoading && config) {
      const timer = setTimeout(() => {
        const currentConfig = {
          ...config,
          buyingCriteria: config.buyingCriteria,
          propertyType: config.propertyType,
          maxPrice: priceRange.max,
          minPrice: priceRange.min,
          region: region,
          additionalPropertyTypes: additionalPropertyTypes,
        };

        // Only update if there are actual changes and the region hasn't been manually set
        const hasChanges =
          currentConfig.buyingCriteria !== config.buyingCriteria ||
          currentConfig.propertyType !== config.propertyType ||
          currentConfig.maxPrice !== config.maxPrice ||
          currentConfig.minPrice !== config.minPrice ||
          currentConfig.additionalPropertyTypes !== config.additionalPropertyTypes;

        if (hasChanges) {
          updateBuyingCriteria();
        }
      }, 500); // Increased debounce time to 500ms
      return () => clearTimeout(timer);
    }
  }, [priceRange, propertyTypes, additionalCriteria, additionalPropertyTypes, isLoading, config?.buyingCriteria]);

  const fetchPipelines = async () => {
    try {
      setLoadingPipelines(true);
      const response = await fetch('/api/pipelines');
      if (!response.ok) throw new Error('Failed to fetch pipelines');
      const data = await response.json();

      const pipelineData = Array.isArray(data)
        ? data.map((p: any) => ({ id: p.id, name: p.name, stages: p.stages }))
        : data.pipelines?.map((p: any) => ({ id: p.id, name: p.name, stages: p.stages })) || [];

      setPipelines(pipelineData);
    } catch (err) {
      console.error('Error fetching pipelines:', err);
    } finally {
      setLoadingPipelines(false);
    }
  };

  /**
   * WORKFLOW Related API Calls
  */
  const isWorkflowExists = async (): Promise<boolean> => {
    const result = await fetch(`/api/workflow`);
    const data = await result.json();
    return data.isExists;
  }

  const getCurrentWorkflowId = async () => {
    try {
      const result = await fetch(`/api/workflow`);
      const data = await result.json();
      return data?.rows[0]?.id;
    } catch (_) { }
  }

  const createWorkFlow = async () => {
    const result = await fetch(`/api/workflow`, {
      method: 'POST',
    });

    const data = await result.json();
    return data;
  }

  const updateWorkFlow = async (workflowId: string, triggerId: string, templateId: string) => {
    const result = await fetch(`/api/workflow`, {
      method: 'PUT',
      body: JSON.stringify({
        workflowId,
        triggerId,
        templateId
      })
    });

    const data = await result.json();
    return data;
  }

  const deleteWorkFlow = async (workflowId: string) => {
    const result = await fetch(`/api/workflow`, {
      method: 'DELETE',
      body: JSON.stringify({
        workflowId
      })
    });
    const data = await result.json();
    return data;
  }

  const loadConfig = async () => {
    if (!user?.id || !selectedAgentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get the multi-agent config
      const { getMultiAgentConfig } = await import('@/lib/ai-agent');
      const multiAgentConfig = await getMultiAgentConfig(user.id);

      // Get the selected agent
      const agentConfig = multiAgentConfig.agents[selectedAgentId];

      if (!agentConfig) {
        throw new Error(`Agent ${selectedAgentId} not found`);
      }

      // Load additional property types if they exist
      if (agentConfig.additionalPropertyTypes) {
        setAdditionalPropertyTypes(agentConfig.additionalPropertyTypes);
      }

      // Set the region state from the loaded config
      // Always use the region from the config, even if it's empty
      setRegion(agentConfig.region || 'All States');

      // Set the config after setting all the individual states
      setConfig(agentConfig);

      if (!agentConfig.qaEntries || agentConfig.qaEntries.length === 0) {
        console.log('No qa entries found, loading default');
        // get default qa entries
        const defaultConfig = await loadAIAgentConfig('default');
        const config = {
          ...agentConfig,
          qaEntries: defaultConfig.qaEntries || []
        }
        const { updateAgentConfig } = await import('@/lib/ai-agent');
        await updateAgentConfig(user.id, selectedAgentId, config);

        // Also save to local storage for backward compatibility
        await saveAIAgentConfig(config, user.id);

        // Sync with server
        // await syncConfigWithServer(config);
        setConfig(config);
      }
    } catch (error) {
      console.error('Error loading config:', error);

      // Get a default config
      const defaultConfig = await loadAIAgentConfig('default');

      // Set default region state
      setRegion('All States');

      setConfig({
        isEnabled: true,
        enabledPipelines: [],
        tone: 'friendly',
        length: 'medium',
        customInstructions: '',
        updatedAt: new Date(),
        agentName: 'Jane Smith',
        companyName: '',
        speakingOnBehalfOf: '',
        contactPhone: '',
        contactEmail: '',
        companyWebsite: '',
        companyAbout: '',
        buyingCriteria: DEFAULT_BUYING_CRITERIA,
        dealObjective: 'realtor-creative-finance',
        propertyType: 'Single-family',
        maxPrice: 2000000,
        minPrice: 0,
        region: 'All States',
        qaEntries: defaultConfig.qaEntries || [],
        additionalPropertyTypes: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseBuyingCriteria = (criteriaText: string) => {
    try {
      const priceRangeMatch = criteriaText.match(/between \$(\d+\.?\d*)( million)? and \$(\d+\.?\d*)( million)?/i);
      const maxPriceMatch = criteriaText.match(/up to \$(\d+\.?\d*)( million)?/i);

      if (priceRangeMatch) {
        const minPrice = priceRangeMatch[2] ? parseFloat(priceRangeMatch[1]) * 1000000 : parseFloat(priceRangeMatch[1]);
        const maxPrice = priceRangeMatch[4] ? parseFloat(priceRangeMatch[3]) * 1000000 : parseFloat(priceRangeMatch[3]);
        setPriceRange({ min: Math.round(minPrice), max: Math.round(maxPrice) });
      } else if (maxPriceMatch) {
        const maxPrice = maxPriceMatch[2] ? parseFloat(maxPriceMatch[1]) * 1000000 : parseFloat(maxPriceMatch[1]);
        setPriceRange({ min: 0, max: Math.round(maxPrice) });
      }

      // Only update region if it's not already set
      if (!region || region === 'All States') {
        const foundState = US_STATES.find(state => criteriaText.toLowerCase().includes(state.toLowerCase()));
        if (foundState) {
          setRegion(foundState);
        } else if (criteriaText.toLowerCase().includes('nationwide')) {
          setRegion('All States');
        }
      }

      const foundType = PROPERTY_TYPES.slice(1).find(type => criteriaText.toLowerCase().includes(type.toLowerCase()));
      setPropertyTypes(foundType ? [foundType] : ['All']);

      const additionalTypesMatch = criteriaText.match(/\(([^)]+)\)/);
      if (additionalTypesMatch && additionalTypesMatch[1]) {
        setAdditionalPropertyTypes(additionalTypesMatch[1]);
      } else {
        setAdditionalPropertyTypes('');
      }

      const basicFormatRegex = /Properties (?:between|up to) \$[\d\.,]+(?: million)? (?:million )?(nationwide|in [A-Za-z\s]+), ([A-Za-z\s\-]+properties|all property types)/i;
      const basicMatch = criteriaText.match(basicFormatRegex);
      if (basicMatch) {
        const additionalText = criteriaText.substring(criteriaText.indexOf(basicMatch[0]) + basicMatch[0].length).replace(/^,\s*/, '').trim();
        setAdditionalCriteria(additionalText);
      } else {
        setAdditionalCriteria('');
      }
    } catch (e) {
      console.error('Error parsing buying criteria:', e);
      setPriceRange({ min: 500000, max: 2000000 });
      setPropertyTypes(['All']);
      setAdditionalPropertyTypes('');
      setAdditionalCriteria('');
    }
  };

  const updateBuyingCriteria = () => {
    if (!config) return;

    const formatPrice = (price: number) => price >= 1000000 ? `$${price / 1000000} million` : `$${price.toLocaleString()}`;
    const locationText = region === 'All States' ? 'nationwide' : `in ${region}`;

    let propertyText = propertyTypes.includes('All') ? 'all property types' : `${propertyTypes.join(', ').toLowerCase()} properties`;

    if (additionalPropertyTypes) {
      propertyText += ` (${additionalPropertyTypes})`;
    }

    const criteriaText = priceRange.min > 0
      ? `Properties between ${formatPrice(priceRange.min)} and ${formatPrice(priceRange.max)} ${locationText}, ${propertyText}`
      : `Properties up to ${formatPrice(priceRange.max)} ${locationText}, ${propertyText}`;

    const newCriteria = additionalCriteria.trim() ? `${criteriaText}, ${additionalCriteria.trim()}` : criteriaText;

    const updatedConfig = {
      ...config,
      buyingCriteria: newCriteria,
      propertyType: propertyText,
      maxPrice: priceRange.max,
      minPrice: priceRange.min,
      region: region,
      additionalPropertyTypes: additionalPropertyTypes,
    };

    // Only update if there are actual changes
    if (
      updatedConfig.buyingCriteria !== config.buyingCriteria ||
      updatedConfig.propertyType !== config.propertyType ||
      updatedConfig.maxPrice !== config.maxPrice ||
      updatedConfig.minPrice !== config.minPrice ||
      updatedConfig.region !== config.region ||
      updatedConfig.additionalPropertyTypes !== config.additionalPropertyTypes
    ) {
      setConfig(updatedConfig);

      if (user?.id) {
        saveAIAgentConfig(updatedConfig, user.id)
          .then(() => triggerConfigRefresh())
          .catch(error => console.error('Error auto-saving buying criteria:', error));
      }
    }
  };

  const handleTogglePipeline = (pipeline: Pipeline) => {
    if (!config) return;
    setConfig(prev => {
      if (!prev) return prev;
      const updatedPipelines = prev.enabledPipelines.some(p => p.id === pipeline.id)
        ? prev.enabledPipelines.filter(p => p.id !== pipeline.id)
        : [...prev.enabledPipelines, { id: pipeline.id, name: pipeline.name }];
      return { ...prev, enabledPipelines: updatedPipelines };
    });
  };

  const handleToggleAllPipelines = (enable: boolean) => {
    if (!config) return;
    setConfig(prev => prev ? {
      ...prev,
      enabledPipelines: enable ? pipelines.map(p => ({ id: p.id, name: p.name })) : []
    } : prev);
  };

  const handleDealObjectiveChange = (dealObjective: AIAgentConfigType['dealObjective']) => {
    if (!config) return;
    setConfig(prev => prev ? { ...prev, dealObjective } : prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!config) return;
    const { name, value } = e.target;
    setConfig(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const handleRegionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRegion(value);

    // Update config with new region value
    if (config) {
      const updatedConfig = {
        ...config,
        region: value
      };
      setConfig(updatedConfig);

      // Save to Firebase after a delay (debounce)
      if (user?.id) {
        const timer = setTimeout(() => {
          saveAIAgentConfig(updatedConfig, user.id)
            .then(() => triggerConfigRefresh())
            .catch(error => console.error('Error saving region update:', error));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  };

  const handlePriceChange = (value: number, field: 'min' | 'max') => {
    setPriceRange(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'min' && updated.min > updated.max) updated.min = updated.max;
      if (field === 'max' && updated.max < updated.min) updated.max = updated.min;
      return updated;
    });
  };

  const handleSave = async () => {
    console.log('handleSave');
    if (!user?.id || !config || !selectedAgentId) {
      toast.error('User not authenticated or config not loaded');
      return;
    }

    // Safe check for phoneNumbers
    // if (!user.phoneNumbers || user.phoneNumbers.length === 0) {
    //   toast.error('Please add a phone number to your account');
    //   return;
    // }

    setIsSaving(true);
    try {
      /// check if already exists dont create 
      const exists = await isWorkflowExists();

      if (!exists) {
        const uuidTemplateId = crypto.randomUUID();
        const workflowResponse = await createWorkFlow();
        const workflowId = workflowResponse.workflowId;
        const triggerId = workflowResponse.triggerId;
        const updateWorkflow = await updateWorkFlow(workflowId, triggerId, uuidTemplateId);
        console.log('updateWorkflow', updateWorkflow);
      }
      const isUnselectedAll = config.enabledPipelines.length === 0;
      // if all is unselected then delete the workflow
      if (isUnselectedAll) {
        const currentWorkFlowId = await getCurrentWorkflowId();
        if (currentWorkFlowId) {
          await deleteWorkFlow(currentWorkFlowId);
        }
      }

      // Update buying criteria before saving
      updateBuyingCriteria();

      // Save to multi-agent config
      const { updateAgentConfig } = await import('@/lib/ai-agent');
      await updateAgentConfig(user.id, selectedAgentId, config);

      // Also save to local storage for backward compatibility
      await saveAIAgentConfig(config, user.id);

      // Sync with server
      // await syncConfigWithServer(config);

      toast.success('AI Agent configuration saved successfully');
      triggerConfigRefresh();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };



  const handleAddQA = () => {
    // Add a new Q&A entry
    const newQA = {
      id: `qa_custom_${Date.now()}`,
      question: 'What is your question?',
      answer: 'Here is my answer.',
      isEnabled: true
    };

    setConfig(prev => {
      if (!prev) return prev;

      const updatedConfig = {
        ...prev,
        qaEntries: [...(prev.qaEntries || []), newQA]
      };

      // Update Firebase if user is authenticated
      if (user?.id) {
        saveAIAgentConfig(updatedConfig, user.id)
          .then(() => triggerConfigRefresh())
          .catch(error => console.error('Error saving new Q&A entry:', error));
      }

      return updatedConfig;
    });
  };

  const handleDeleteQA = (qaId: string) => {
    setConfig(prev => {
      if (!prev || !prev.qaEntries) return prev;

      const updatedConfig = {
        ...prev,
        qaEntries: prev.qaEntries.filter(qa => qa.id !== qaId)
      };

      // Update Firebase if user is authenticated
      if (user?.id) {
        saveAIAgentConfig(updatedConfig, user.id)
          .then(() => triggerConfigRefresh())
          .catch(error => console.error('Error saving Q&A deletion:', error));
      }

      return updatedConfig;
    });
  };

  const handleToggleQA = (qaId: string, isEnabled: boolean) => {
    setConfig(prev => {
      if (!prev || !prev.qaEntries) return prev;

      const updatedQaEntries = prev.qaEntries.map(qa =>
        qa.id === qaId ? { ...qa, isEnabled } : qa
      );

      const updatedConfig = {
        ...prev,
        qaEntries: updatedQaEntries
      };

      // Update Firebase if user is authenticated
      if (user?.id) {
        saveAIAgentConfig(updatedConfig, user.id)
          .then(() => triggerConfigRefresh())
          .catch(error => console.error('Error toggling Q&A entry:', error));
      }

      return updatedConfig;
    });
  };

  const handleUpdateQA = (qaId: string, field: 'question' | 'answer', value: string) => {
    setConfig(prev => {
      if (!prev || !prev.qaEntries) return prev;

      const updatedQaEntries = prev.qaEntries.map(qa =>
        qa.id === qaId ? { ...qa, [field]: value } : qa
      );

      return {
        ...prev,
        qaEntries: updatedQaEntries
      };
    });
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !config || isSending) return;

    const newUserMessage = { text: message, isUser: true };
    const tempBotMessage = { text: 'Processing...', isUser: false, isLoading: true };
    setConversation([...conversation, newUserMessage, tempBotMessage]);
    setMessage('');
    setIsSending(true);
    setTestError(null);
    setLoadingPrompt(true); // Set loading state for the prompt

    try {
      console.log('Sending test request with includePrompt=true');
      const res = await fetch('/api/ai-agent/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: [...conversation, newUserMessage],
          locationId: user?.id,
          agentConfig: config,
          includePrompt: true, // Request the full prompt to be returned
        }),
      });

      const data = await res.json();
      console.log('Received test response:', data);

      if (!res.ok) {
        throw new Error(data.error || data.details || data.message || 'API error');
      }

      if (!data.message) {
        throw new Error('No response received from the AI agent');
      }

      // Store the prompt if it was returned
      if (data.prompt) {
        console.log('Prompt received, setting prompt state');
        setFullPrompt(data.prompt);
      } else {
        console.log('No prompt data in response');
      }

      setConversation(prev => [
        ...prev.slice(0, -1),
        { text: data.message, isUser: false }
      ]);
    } catch (err) {
      console.error('Error testing AI agent:', err);
      setTestError(err instanceof Error ? err.message : 'Failed to test AI agent');
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
      setLoadingPrompt(false); // Clear loading state for the prompt
    }
  };

  const handleResetConversation = () => {
    setMessage('');
    setConversation([]);
    setTestError(null);
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
  };

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [conversation]);

  useEffect(() => {
    if (config && onConfigChange) {
      // Only call onConfigChange if the config has actually changed
      const hasChanges = JSON.stringify(config) !== JSON.stringify(prevConfigRef.current);
      if (hasChanges) {
        prevConfigRef.current = config;
        onConfigChange(config);
      }
    }
  }, [config, onConfigChange]);

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--nextprop-primary)]"></div>
      </div>
    );
  }

  // Helper function to check if a section should be rendered
  const shouldRenderSection = (section: string) => {
    // If no activeSection is specified, show everything
    if (!activeSection) return true;
    // Otherwise only show the requested section
    return activeSection === section;
  };

  const placeholders = {
    agentName: 'Jane Smith',
    companyName: user?.firstName || 'Your Name',
    speakingOnBehalfOf: 'NextProp Real Estate',
    contactPhone: user?.phone || (user?.phoneNumbers?.[0]?.phoneNumber) || '(415) 555-1234',
    contactEmail: user?.email || 'user@nextprop.ai',
    companyWebsite: user?.website || 'www.yourcompany.com',
  };

  const commonButtonStyles = {
    width: '367px',
    height: '46px',
    borderRadius: '3px',
    border: '1px solid #E5E7EB',
    fontWeight: 400,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    paddingLeft: '16px',
    paddingRight: '16px',
    margin: 0,
  };
  // Content to render with or without container
  const content = (
    <React.Fragment>
      <div data-agent-config ref={(el) => {
        if (el) {
          (el as any).__reactProps = { config };
        }
      }}>
        {!hideContainer && (
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
        )}




        {shouldRenderSection('pipeline') && (
          <div className="flex items-center justify-center ">
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
              className="bg-[var(--nextprop-surface)] rounded-lg  p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-[var(--nextprop-border)]">
                {/* <FunnelIcon className="h-5 w-5 text-[var(--nextprop-primary)] " /> */}
                <span className="text-[20px] font-semibold text-gray-900">
                  Pipeline Configuration
                </span>
              </div>

              <div >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--nextprop-text-secondary)]">
                      Enable AI Agent for specific pipelines
                    </p>
                    <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1">
                      The AI Agent will only respond to messages from leads in the selected pipelines
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleToggleAllPipelines(true)}
                      className="text-xs bg-[var(--nextprop-surface-hover)] px-2 py-1 rounded text-[var(--nextprop-text-secondary)] hover:bg-[var(--nextprop-primary-light)]/10 border border-[var(--nextprop-border)]"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleToggleAllPipelines(false)}
                      className="text-xs bg-[var(--nextprop-surface-hover)] px-2 py-1 rounded text-[var(--nextprop-text-secondary)] hover:bg-[var(--nextprop-primary-light)]/10 border border-[var(--nextprop-border)]"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {loadingPipelines ? (
                  <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--nextprop-primary)]"></div>
                  </div>
                ) : pipelines.length === 0 ? (
                  <div className="p-4 text-center text-[var(--nextprop-text-tertiary)]">
                    No pipelines found. Please create pipelines in your CRM.
                  </div>
                ) : (
                  <div

                    className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pipelines.map(pipeline => (
                      <div
                        key={pipeline.id}
                        style={{
                          width: '370px',
                          height: '46px',
                          borderRadius: '3px',
                          border: '1px solid #E5E7EB',
                          background: config.enabledPipelines.some(p => p.id === pipeline.id) ? '#F3E8FF' : '#fff',
                          color: config.enabledPipelines.some(p => p.id === pipeline.id) ? '#9C03FF' : '#111827',
                          fontWeight: 400,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          margin: 0,
                        }}
                        onClick={() => handleTogglePipeline(pipeline)}
                      >
                        <span style={{ fontWeight: 400, fontSize: '14px' }}>
                          {pipeline.name}
                        </span>
                        <Switch
                          checked={config.enabledPipelines.some(p => p.id === pipeline.id)}
                          onChange={() => handleTogglePipeline(pipeline)}
                          onClick={(e) => e.stopPropagation()}
                          className={`${config.enabledPipelines.some(p => p.id === pipeline.id)
                            ? 'bg-[var(--nextprop-primary)]'
                            : 'bg-gray-200'
                            } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none`}
                        >
                          <span
                            className={`${config.enabledPipelines.some(p => p.id === pipeline.id)
                              ? 'translate-x-5'
                              : 'translate-x-1'
                              } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {shouldRenderSection('identity') && (
          <div className='mt-4  flex items-center justify-center '>
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
              className="bg-[var(--nextprop-surface)] rounded-lg  p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
                {/* <UserCircleIcon className="h-6 w-6 text-[var(--nextprop-primary)]" /> */}
                <span className="text-[20px] font-semibold text-[var(--nextprop-text-primary)]">Agent Identity</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="agentName" className="block text-[14px] font-medium text-[var(--nextprop-text-secondary)] mb-1">
                    Agent Name
                  </label>
                  <div className='border border-[var(--nextprop-border)] rounded-[3px]'>
                    <input
                      type="text"
                      id="agentName"
                      name="agentName"
                      value={config.agentName}
                      onChange={handleInputChange}
                      style={{ borderRadius: '3px', height: '31px' }}
                      className="nextprop-input w-full p-2.5 text-[14px] font-sm  border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-[14px] font-medium text-[var(--nextprop-text-secondary)] mb-1">
                    Your Name
                  </label>
                  <div className='border border-[var(--nextprop-border)] rounded-[3px]'>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={config.companyName || ''}
                      onChange={handleInputChange}
                      placeholder={placeholders.companyName}
                      style={{ borderRadius: '3px', height: '31px' }}
                      className="nextprop-input w-full p-2.5 text-[14px] font-sm rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                    />
                  </div>

                  <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1">
                    This is your name that will be used when the AI agent refers to you
                  </p>
                </div>

                <div>
                  <label htmlFor="speakingOnBehalfOf" className="block text-[14px] font-medium text-[var(--nextprop-text-secondary)] mb-1">
                    Company Name
                  </label>
                  <div className='border border-[var(--nextprop-border)] rounded-[3px]'>
                    <input
                      type="text"
                      id="speakingOnBehalfOf"
                      name="speakingOnBehalfOf"
                      value={config.speakingOnBehalfOf || ''}
                      onChange={handleInputChange}
                      placeholder={placeholders.speakingOnBehalfOf}
                      style={{ borderRadius: '3px', height: '31px' }}
                      className="nextprop-input w-full p-2.5 text-[14px] font-medium border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        )}

        {shouldRenderSection('company') && (
          <div className='mt-4  flex items-center justify-center '>
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }} className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className=" mb-2 pb-2 border-b border-[var(--nextprop-border)]">
                <div className='flex items-center space-x-3'>
                  {/* <EnvelopeIcon className="h-5 w-5 text-[var(--nextprop-primary)] " /> */}
                  <span className="text-[20px] font-semibold text-[var(--nextprop-text-primary)]">Company Information</span>
                </div>

                <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1">
                  This is the address the AI will provide to prospects who inquire about the business location.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="contactPhone" className="block text-[14px] font-medium text-[var(--nextprop-text-secondary)] mb-1">
                    Phone Number
                  </label>
                  <div className="flex">
                    {/* <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--nextprop-border)] bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-tertiary)]">
                      <PhoneIcon className="h-4 w-4" />
                    </span> */}
                    <div className='w-full border border-[var(--nextprop-border)] rounded-[3px]'>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={config.contactPhone || ''}
                        onChange={handleInputChange}
                        placeholder={placeholders.contactPhone}
                        style={{ borderRadius: '3px', backgroundColor: '#eaecef', border: 'none', outline: 'none', height: '31px' }}
                        className="nextprop-input w-full p-2.5 rounded-r-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-row gap-4">
                  <div className="relative">
                    <label htmlFor="contactEmail" className="block text-[14px] font-medium text-[var(--nextprop-text-secondary)] mb-1">
                      Email Address
                    </label>
                    <div className="border border-[var(--nextprop-border)] rounded-[3px]">
                      {/* <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--nextprop-border)] bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-tertiary)]">
                        <EnvelopeIcon className="h-4 w-4" />
                      </span> */}
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={config.contactEmail || ''}
                        onChange={handleInputChange}
                        placeholder={placeholders.contactEmail}
                        style={{ borderRadius: '3px', width: '235px', backgroundColor: '#eaecef', border: 'none', outline: 'none', height: '31px' }}
                        className="nextprop-input w-full p-2.5 rounded-r-lg"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label htmlFor="companyWebsite" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                      Company Website
                    </label>
                    <div className="border border-[var(--nextprop-border)] rounded-[3px]">
                      {/* <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--nextprop-border)] bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-tertiary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                        </svg>
                      </span> */}
                      <input
                        type="url"
                        id="companyWebsite"
                        name="companyWebsite"
                        value={config.companyWebsite || ''}
                        onChange={handleInputChange}
                        placeholder={placeholders.companyWebsite}
                        style={{ borderRadius: '3px', width: '235px', backgroundColor: '#eaecef', border: 'none', outline: 'none', height: '31px' }}
                        className=" nextprop-input w-full p-2.5 rounded-r-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="companyAbout" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                    About Company <span className="text-xs text-[var(--nextprop-text-tertiary)]">(optional)</span>
                  </label>
                  <div className='border border-[var(--nextprop-border)] rounded-[3px]'>
                    <textarea
                      id="companyAbout"
                      name="companyAbout"
                      value={config.companyAbout || ''}
                      onChange={handleInputChange}
                      placeholder="Briefly describe your company or services..."
                      rows={3}
                      style={{ borderRadius: '3px', backgroundColor: '#eaecef' }}
                      className="nextprop-input w-full p-2.5 rounded-r-lg" />
                  </div>
                  <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1 pt-2">
                    Once all relevant information has been received from the lead, the AI will send them a final message, move the lead to the HUMAN stage, and notify you.
                  </p>
                </div>
              </div>
            </div>
          </div>

        )}
        {shouldRenderSection('agentStatus') && (
          <div className='mt-4  flex items-center justify-center '>
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }} className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <span className="text-[18px] font-semibold text-[var(--nextprop-text-primary)]">Set Agent's status</span>
              <span className="text-[14px] text-[var(--nextprop-text-tertiary)] mb-2">Choose the Bot's operating mode</span>
              <div className="flex">
                {/* Off Button */}
                <button
                  type="button"
                  onClick={() => setConfig(prev => prev ? { ...prev, agentStatus: 'off' } : prev)}
                  style={{
                    width: '241px',
                    height: '46px',
                    borderRadius: '3px',
                    border: '1px solid #E5E7EB',
                    background: config.agentStatus === 'off' ? '#F3E8FF' : '#fff',
                    color: config.agentStatus === 'off' ? '#9C03FF' : '#111827',
                    fontWeight: 500,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    position: 'relative',
                  }}
                  className="transition focus:outline-none"
                >
                  <span className="flex items-center justify-center mr-2">
                    <img src="/purple_checkbox.svg" alt="Off" className="w-[30px] h-[30px]" />
                  </span>
                  Off
                </button>
                {/* Auto Pilot Button */}
                <button
                  type="button"
                  onClick={() => setConfig(prev => prev ? { ...prev, agentStatus: 'auto' } : prev)}
                  style={{
                    width: '241px',
                    height: '46px',
                    borderRadius: '3px',
                    border: '1px solid #E5E7EB',
                    background: config.agentStatus === 'auto' ? '#F3E8FF' : '#fff',
                    color: config.agentStatus === 'auto' ? '#9C03FF' : '#111827',
                    fontWeight: 500,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    marginLeft: '12px',
                    position: 'relative',
                  }}
                  className="transition focus:outline-none"
                >
                  <span className="flex items-center justify-center mr-2 ">
                    <img src="/audio_pilot.svg" alt="Auto Pilot" className="w-[30px] h-[30px]" />
                  </span>
                  Auto Pilot
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Supported Communication Channels Section */}
        {shouldRenderSection('agentStatus') && (
          <div className='mt-4 flex items-center justify-center '>
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }} className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <span className="text-[20px] font-bold text-[var(--nextprop-text-primary)]">Supported Communication Channels</span>
              <span className="text-[14px] text-[var(--nextprop-text-tertiary)] font-semibold">Select the Channels where you want the Bot to be Active On*</span>
              <div className="mt-2 border border-[var(--nextprop-border)] rounded-3">
                <select
                  value={config.communicationChannel || 'SMS'}
                  onChange={e => setConfig(prev => prev ? { ...prev, communicationChannel: e.target.value } : prev)}
                  className="h-[31px] w-full text-[14px] font-semibold text-[#9C03FF] bg-white rounded-3"
                  style={{ minHeight: '38px', borderRadius:'3px', fontSize:'14px'}}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="SMS">SMS</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Email">Email</option>
                  <option value="Whatsapp">Whatsapp</option>
                  <option value="Emo">Emo</option>
                  <option value="Discord">Discord</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {shouldRenderSection('buyingCriteria') && (
          <div className='mt-6 flex items-center justify-center '>
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }} className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
                <BuildingOfficeIcon className="h-5 w-5 text-[var(--nextprop-primary)] mb-6" />
                <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Buying Criteria</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2 mb-1" />
                    <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                      Price Range
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-[var(--nextprop-border)] rounded-lg">
                      <select
                        className="nextprop-input w-full p-2.5  border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm text-sm"
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
                    <div className="flex-1 border border-[var(--nextprop-border)] rounded-lg">
                      <select
                        className="nextprop-input w-full p-2.5  border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm text-sm"
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

                <div>
                  <div className="flex items-center mb-2">
                    <MapPinIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2 mb-1" />
                    <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                      In Area
                    </label>
                  </div>
                  <div className='border border-[var(--nextprop-border)] rounded-lg'>
                    <input
                      type="text"
                      id="inArea"
                      name="inArea"
                      value={region || ''}
                      onChange={handleRegionInputChange}
                      placeholder="i.e: Bay area of San Francisco"
                      className="nextprop-input w-full p-2 border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <HomeIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2 mb-1" />
                    <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                      Property Type
                    </label>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="w-full md:w-1/2 border border-[var(--nextprop-border)] rounded-lg">
                      <select
                        className="nextprop-input w-full p-2 border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm text-sm"
                        value={propertyTypes[0]}
                        onChange={(e) => setPropertyTypes([e.target.value])}
                      >
                        {PROPERTY_TYPES.map(type => (
                          <option key={type} value={type}>{type === 'All' ? 'All Property Types' : type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-1/2 border border-[var(--nextprop-border)] rounded-lg">
                      <input
                        type="text"
                        value={additionalPropertyTypes}
                        onChange={(e) => setAdditionalPropertyTypes(e.target.value)}
                        placeholder="Additional types (optional)"
                        className="nextprop-input w-full p-2 border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm text-sm"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1">
                    Optionally add more types like "Duplex, Vacation Homes" in the second field
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {shouldRenderSection('dealObjective') && (
          <div className=' flex items-center justify-center '>
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }} className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center space-x-3 border-[var(--nextprop-border)]">
                {/* <DocumentTextIcon className="h-5 w-5 text-[var(--nextprop-primary)] mb-6" /> */}
                <span className="text-[20px] font-semibold text-[var(--nextprop-text-primary)]">Deal Objective</span>
              </div>

              <div className="space-y-1">
                <div>
                  <span className="text-[18px] font-medium text-[var(--nextprop-text-primary)] mt-3 flex items-center">

                    For Realtors
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { value: 'realtor-off-market', label: 'Off Market Deals' },
                      { value: 'realtor-short-sale', label: 'Short Sales' },
                      { value: 'realtor-creative-finance', label: 'Creative Finance' },
                      { value: 'realtor-cash-buyers', label: 'Cash Buyers' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        style={{
                          width: '370px',
                          height: '46px',
                          borderRadius: '3px',
                          border: '1px solid #E5E7EB',
                          background: config.dealObjective === option.value ? '#F3E8FF' : '#fff',
                          color: config.dealObjective === option.value ? '#9C03FF' : '#111827',
                          fontWeight: 400,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          textAlign: 'left',
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          margin: 0,
                        }}
                        className="transition focus:outline-none  mb-0"
                        onClick={() => handleDealObjectiveChange(option.value)}

                      >
                        {config.dealObjective === option.value && (
                          <span
                            className="mr-2 flex items-center justify-center"
                            style={{ width: 30, height: 30, minWidth: 30, minHeight: 30 }}
                          >
                            <span
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: '#A703FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 4.5L4.5 7L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </span>
                          </span>
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[18px] font-medium text-[var(--nextprop-text-primary)] mt-3 flex items-center">
                    For Home Owners
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { value: 'homeowner-cash-offer', label: 'Cash Offer' },
                      { value: 'homeowner-distressed', label: 'Distressed Seller' },
                      { value: 'homeowner-relocation', label: 'Relocation' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        style={{
                          width: '370px',
                          height: '46px',
                          borderRadius: '3px',
                          border: '1px solid #E5E7EB',
                          background: config.dealObjective === option.value ? '#F3E8FF' : '#fff',
                          color: config.dealObjective === option.value ? '#9C03FF' : '#111827',
                          fontWeight: 400,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          textAlign: 'left',
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          margin: 0,
                        }}
                        className="transition focus:outline-none  mb-0"
                        onClick={() => handleDealObjectiveChange(option.value)}

                      >
                        {config.dealObjective === option.value && (
                          <span
                            className="mr-2 flex items-center justify-center"
                            style={{ width: 30, height: 30, minWidth: 30, minHeight: 30 }}
                          >
                            <span
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: '#A703FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M2 4.5L4.5 7L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </span>
                          </span>
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {shouldRenderSection('qa') && (
          <div className="mt-6">
            <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
                <DocumentTextIcon className="h-5 w-5 text-[var(--nextprop-primary)] mb-6" />
                <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Q&A Entries</h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-[var(--nextprop-text-secondary)]">
                  Select Q&A entries that the AI must follow when responding to users
                </p>

                {config.qaEntries && config.qaEntries.length > 0 ? (
                  <div className="space-y-3">
                    {config.qaEntries.map((qa) => (
                      <div
                        key={qa.id}
                        className={`relative p-3 border rounded-lg transition-colors ${qa.isEnabled
                          ? 'bg-[var(--nextprop-primary)]/5 border-[var(--nextprop-primary)]'
                          : 'border-[var(--nextprop-border)] hover:bg-[var(--nextprop-surface-hover)]'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={qa.isEnabled}
                              onChange={() => handleToggleQA(qa.id, !qa.isEnabled)}
                              className={`${qa.isEnabled ? 'bg-[var(--nextprop-primary)]' : 'bg-gray-200'
                                } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:ring-offset-2`}
                            >
                              <span
                                className={`${qa.isEnabled ? 'translate-x-5' : 'translate-x-1'
                                  } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                            <span className="font-medium text-[var(--nextprop-text-primary)]">Q&A Entry</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-tertiary)]">
                              {qa.id.startsWith('qa_custom_') ? 'Custom' : 'Default'}
                            </span>

                            {/* Only show delete button for custom Q&A entries */}
                            {qa.id.startsWith('qa_custom_') && (
                              <button
                                onClick={() => handleDeleteQA(qa.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                aria-label="Delete Q&A entry"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                              Question
                            </label>
                            <div className='border border-[var(--nextprop-border)] rounded-lg'>
                              <input
                                type="text"
                                value={qa.question}
                                onChange={(e) => {
                                  handleUpdateQA(qa.id, 'question', e.target.value);

                                  // Save to Firebase after a delay (debounce)
                                  if (user?.id) {
                                    const timer = setTimeout(() => {
                                      setConfig(prev => {
                                        if (!prev) return prev;
                                        const updatedConfig = { ...prev };
                                        saveAIAgentConfig(updatedConfig, user.id)
                                          .then(() => triggerConfigRefresh())
                                          .catch(error => console.error('Error saving Q&A update:', error));
                                        return prev;
                                      });
                                    }, 500);

                                    return () => clearTimeout(timer);
                                  }
                                }}
                                className="nextprop-input w-full p-2.5  border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                              Answer
                            </label>
                            <div className='border border-[var(--nextprop-border)] rounded-lg'>
                              <textarea
                                rows={3}
                                value={qa.answer}
                                onChange={(e) => {
                                  handleUpdateQA(qa.id, 'answer', e.target.value);

                                  // Save to Firebase after a delay (debounce)
                                  if (user?.id) {
                                    const timer = setTimeout(() => {
                                      setConfig(prev => {
                                        if (!prev) return prev;
                                        const updatedConfig = { ...prev };
                                        saveAIAgentConfig(updatedConfig, user.id)
                                          .then(() => triggerConfigRefresh())
                                          .catch(error => console.error('Error saving Q&A update:', error));
                                        return prev;
                                      });
                                    }, 500);

                                    return () => clearTimeout(timer);
                                  }
                                }}
                                className="nextprop-input w-full p-2.5  border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--nextprop-text-tertiary)]">
                    No Q&A entries configured
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleAddQA}
                    className="w-full py-2 px-4 border border-dashed border-[var(--nextprop-border)] rounded-lg text-sm text-[var(--nextprop-text-secondary)] hover:bg-[var(--nextprop-surface-hover)] transition-colors"
                  >
                    + Add Custom Q&A Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {shouldRenderSection('testing') && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span className="text-[20px] font-semibold text-gray-900">Agent Testing Area</span>
              <p className="text-[14px] text-gray-500 mb-1 ">Test your agent by customizing messages below.</p>
              {/* Questions Grid */}
              <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: '10px' }}
              >
                {EXAMPLE_MESSAGES.map((q, idx) => (
                  <button
                    key={q}
                    type="button"
                    style={{
                      width: '370px',
                      height: '46px',
                      borderRadius: '3px',
                      border: '1px solid #E5E7EB',
                      background: message === q ? '#F3E8FF' : '#fff',
                      color: message === q ? '#9C03FF' : '#111827',
                      fontWeight: 400,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      margin: 0,
                    }}
                    className="transition focus:outline-none  mb-0"
                    onClick={() => setMessage(q)}
                  >
                    {message === q && (
                      <span
                        className="mr-2 flex items-center justify-center"
                        style={{ width: 30, height: 30, minWidth: 30, minHeight: 30 }}
                      >
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: '#A703FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 4.5L4.5 7L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                      </span>
                    )}
                    <span className="truncate" style={{ fontWeight: 400, fontSize: '14px' }}>{q}</span>
                  </button>
                ))}
              </div>
              {/* Conversation Component */}
              {conversation.length > 0 && (
                <div
                  ref={conversationRef}
                  className="mt-4 p-4 border border-[var(--nextprop-border)] rounded-lg max-h-80 overflow-y-auto bg-[var(--nextprop-surface-hover)]/50"
                >
                  <div className="flex justify-between items-center" >
                    <h4 className="text-md font-medium text-[var(--nextprop-text-secondary)]">Conversation:</h4>
                    <button
                      onClick={handleResetConversation}
                      className="text-xs px-2 py-1 bg-[var(--nextprop-surface)] text-[var(--nextprop-text-tertiary)] rounded hover:bg-[var(--nextprop-surface-hover)] border border-[var(--nextprop-border)]"
                    >
                      Clear Conversation
                    </button>
                  </div>
                  {conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${msg.isUser ? 'text-right' : 'text-left'}`}
                    >
                      <div
                        className={`inline-block rounded-lg p-3 max-w-[80%] ${msg.isUser
                          ? 'bg-[var(--nextprop-primary)] text-white'
                          : 'bg-[var(--nextprop-surface)] border border-[var(--nextprop-border)] text-[var(--nextprop-text-primary)]'
                          }`}
                        style={{ fontSize: '14px' }}
                      >
                        {msg.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Message Input */}
              <div className="mt-4 mb-4">
                <form onSubmit={handleTestSubmit}>
                  <label className="block text-gray-500 mb-2" style={{ fontWeight: 500, fontSize: '14px' }}>Message</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9C03FF] focus:border-[#9C03FF] resize-none bg-gray-50"
                    placeholder="Ask a question to the agent..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#9C03FF',
                      borderRadius: '10px',
                      height: '35px',
                      fontWeight: 500,
                      fontSize: '14px',
                      width: 'fit-content',
                      marginTop: '8px',
                      marginLeft: '0',
                      paddingLeft: '24px',
                      paddingRight: '24px',
                      color: 'white',
                      display: 'block',
                    }}
                    disabled={!message.trim() || isSending}
                  >
                    {isSending ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </div>

              {/* Show Full AI Prompt Button and Prompt Display */}
              {fullPrompt && !showFullPrompt && (
                <div className=" mb-4">
                  <button
                    onClick={togglePromptVisibility}
                    className="w-full py-2 px-4 border border-dashed border-[var(--nextprop-border)] rounded-lg text-sm text-[var(--nextprop-text-secondary)] hover:bg-[var(--nextprop-surface-hover)] transition-colors"
                  >
                    Show Full AI Prompt
                  </button>
                </div>
              )}
              {fullPrompt && showFullPrompt && (
                <div className="mt-2 mb-2 p-4 border border-[var(--nextprop-border)] rounded-lg bg-black">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium text-[var(--nextprop-text-secondary)]">Full AI Prompt:</h4>
                    <button
                      onClick={togglePromptVisibility}
                      className="text-xs px-2 py-1 bg-[var(--nextprop-surface)] text-[var(--nextprop-text-tertiary)] rounded hover:bg-[var(--nextprop-surface-hover)] border border-[var(--nextprop-border)]"
                    >
                      Hide Prompt
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96 text-green-400 font-mono">
                    {fullPrompt}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {shouldRenderSection('leadQualification') && (
          <div className="flex items-center justify-center">
            <div
              style={{
                width: '780px',
                borderRadius: '5px',
                border: '1px solid #E5E7EB',
                background: 'white',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '16px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }} className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-0 pb-1 ">
                <span className="text-[20px] font-semibold text-[var(--nextprop-text-primary)]">Lead Qualification Criteria</span>
                <p className="text-[14px] text-[var(--nextprop-text-tertiary)]">Select single/multiple criteria you want to qualify lead</p>
              </div>
              {/* Criteria grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                {[
                  { key: 'interestedSelling', label: 'Interested in Selling', icon: <img src="/checkbox.svg" alt="Interested in Selling" className="w-[30px] h-[30px]" /> },
                  { key: 'address', label: 'Address of the House', icon: <img src="/checkbox.svg" alt="Address of the House" className="w-[30px] h-[30px]" /> },
                  { key: 'reasonSelling', label: 'Reason for Selling', icon: <img src="/person.svg" alt="Reason for Selling" className="w-[30px] h-[30px]" /> },
                  { key: 'condition', label: 'Condition of the House', icon: <img src="/home.svg" alt="Condition of the House" className="w-[30px] h-[30px]" /> },
                  { key: 'timeline', label: 'Timeline to Sell', icon: <img src="/clock.svg" alt="Timeline to Sell" className="w-[30px] h-[30px]" /> },
                  { key: 'askingPrice', label: 'Asking Price', icon: <img src="/doller.svg" alt="Asking Price" className="w-[30px] h-[30px]" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    style={{
                      width: '241px',
                      height: '46px',
                      borderRadius: '3px',
                      border: '1px solid #E5E7EB',
                      background: config.leadQualification?.[item.key] ? '#95989A' : '#fff',
                      color: config.leadQualification?.[item.key] ? '#111827' : '#111827',
                      fontWeight: 400,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      margin: 0,
                    }}
                    className="transition focus:outline-none  mb-0"
                    type="button"
                    onClick={() => setConfig(prev => prev ? { ...prev, leadQualification: { ...(prev.leadQualification || {}), [item.key]: !prev.leadQualification?.[item.key] } } : prev)}
                  >
                    <span className="flex items-center justify-center  mr-2">
                      {item.icon}
                    </span>
                    {item.label}

                  </button>
                ))}
              </div>
              {/* If Lead Qualifies section */}
              <div className="mb-2">
                {/* Section Title */}
                <span className="text-[18px] font-semibold text-[var(--nextprop-text-primary)]">
                  If Lead Qualifies
                </span>

                {/* Button Container */}
                <div className="flex gap-4 items-center">
                  {/* Send Last Message Button */}
                  <button
                    type="button"
                    style={{
                      ...commonButtonStyles,
                      background: config.leadQualifiesAction === 'sendLastMessage' ? '#F3E8FF' : '#fff',
                      color: config.leadQualifiesAction === 'sendLastMessage' ? '#9C03FF' : '#111827',
                    }}
                    className="transition focus:outline-none mb-0"
                    onClick={() =>
                      setConfig((prev) => (prev ? { ...prev, leadQualifiesAction: 'sendLastMessage' } : prev))
                    }
                  >
                    <img
                      src="/calendar.svg"
                      alt="Interested in Selling"
                      className="w-[30px] h-[30px] mr-2"
                    />
                    Send Last Message
                  </button>

                  {/* Pause AI, Move to Human Button */}
                  <button
                    type="button"
                    style={{
                      ...commonButtonStyles,
                      background: config.leadQualifiesAction === 'pauseMoveHuman' ? '#F3E8FF' : '#fff',
                      color: config.leadQualifiesAction === 'pauseMoveHuman' ? '#9C03FF' : '#111827',
                      justifyContent: 'space-between',
                    }}
                    className="transition focus:outline-none mb-0"
                    onClick={() =>
                      setConfig((prev) => (prev ? { ...prev, leadQualifiesAction: 'pauseMoveHuman' } : prev))
                    }
                  >
                    <img
                      src="/checkbox.svg"
                      alt="Interested in Selling"
                      className="w-[30px] h-[30px] mr-2"
                    />
                    Pause AI, Move to Human
                    <span>
                      {config.leadQualifiesAction === 'pauseMoveHuman' && (
                        <img
                          src="/information.svg"
                          alt="Interested in Selling"
                          className="w-[30px] h-[30px]"
                        />
                      )}
                    </span>
                  </button>
                </div>
              </div>
              {/* Closing message preview */}
              <div className="mt-2">
                <span className="text-[18px] font-semibold text-[var(--nextprop-text-primary)]">The Assistant will close the conversation with:</span>
                <div className="item-center justity-center h-[31px] bg-[var(--nextprop-surface-hover)] rounded-lg pt-1 pl-2 text-[var(--nextprop-text-secondary)] text-[14px]">
                  Got it! Thanks for the information. I'll pass this to [Your Name] and get back to you soon.
                </div>
              </div>
              {/* Action buttons at the bottom */}
              <div className=" flex justify-center gap-4 mt-2">
                <button
                  type="button"
                  className="h-[35px] px-6 py-1 text-[14px] border border-[var(--nextprop-border)] text-[var(--nextprop-text-primary)] bg-white rounded-lg hover:bg-[var(--nextprop-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:ring-offset-2 font-medium shadow-sm"
                  onClick={() => {/* TODO: handle cancel */ }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="w-[153px] item-center h-[35px] text-[14px] bg-gradient-to-r from-[#9C03FF] to-[#A703FF] text-white rounded-[10px] hover:from-[#A703FF] hover:to-[#9C03FF] focus:outline-none focus:ring-2 focus:ring-[#9C03FF] focus:ring-offset-2 font-medium shadow-md transform transition-transform hover:scale-105"
                  onClick={() => {/* TODO: handle add AI assistant */ }}
                >
                  Add AI Assistant
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Only show save button if not hiding container */}
        {!hideContainer && (
          <div className="flex justify-end mt-8 space-x-4">
            <button
              onClick={() => shouldRenderSection('testing') ? setShowTestPanel(!showTestPanel) : null}
              className={shouldRenderSection('testing') ? "px-6 py-2.5 bg-[var(--nextprop-surface)] border border-[var(--nextprop-border)] text-[var(--nextprop-text-primary)] rounded-lg hover:bg-[var(--nextprop-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:ring-offset-2 font-medium shadow-md" : "hidden"}
            >
              {showTestPanel ? 'Hide Test Panel' : 'Test Agent'}
            </button>

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
        )}
      </div>
    </React.Fragment>
  );

  // Return the content with or without the container
  return hideContainer ? content : (
    <div className="bg-gradient-to-br from-[var(--nextprop-surface)] to-[var(--nextprop-surface-hover)] rounded-lg shadow-lg p-6 border border-[var(--nextprop-border)]">
      {content}
    </div>
  );
}