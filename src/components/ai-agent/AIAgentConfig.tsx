'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { BoltIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, DocumentTextIcon, CurrencyDollarIcon, MapPinIcon, HomeIcon, FunnelIcon } from '@heroicons/react/24/outline';
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
        speakingOnBehalfOf: data.speakingOnBehalfOf || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        buyingCriteria: data.buyingCriteria || DEFAULT_BUYING_CRITERIA,
        dealObjective: data.dealObjective || 'creative-finance',

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
      speakingOnBehalfOf: '',
      contactPhone: '',
      contactEmail: '',
      buyingCriteria: DEFAULT_BUYING_CRITERIA,
      dealObjective: 'creative-finance',
      propertyType: 'Single-family',
      maxPrice: 2000000,
      minPrice: 0,
      region: 'All',
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


export default function AIAgentConfig({ selectedAgentId }: { selectedAgentId: string | null }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<AIAgentConfigType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000000 });
  const [region, setRegion] = useState('All States');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['All']);
  const [additionalCriteria, setAdditionalCriteria] = useState('');

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

      const needsUpdate = !config.speakingOnBehalfOf || !config.contactPhone || !config.contactEmail;

      if (needsUpdate) {
        const updatedConfig = {
          ...config,
          speakingOnBehalfOf: config.speakingOnBehalfOf || userName || 'NextProp Real Estate',
          contactPhone: config.contactPhone || userPhone,
          contactEmail: config.contactEmail || userEmail,
        };
        setConfig(updatedConfig);
        saveAIAgentConfig(updatedConfig, user.id)
          .then(() => triggerConfigRefresh())
          .catch(error => console.error('Error auto-saving user details:', error));
      }
    }
  }, [user, config]);

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
        updateBuyingCriteria();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [priceRange, region, propertyTypes, additionalCriteria, isLoading]);

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

      // Ensure the loaded config has all the required fields
      if (!agentConfig.qaEntries) {
        console.log('Adding missing fields to the config...');
        // Load default rules and Q&A from the function above
        const defaultConfig = await loadAIAgentConfig('default');
        agentConfig.qaEntries = agentConfig.qaEntries || defaultConfig.qaEntries;

        // Save the updated config back to Firestore
        if (user.id) {
          try {
            const { updateAgentConfig } = await import('@/lib/ai-agent');
            await updateAgentConfig(user.id, selectedAgentId, agentConfig);
          } catch (saveError) {
            console.error('Error saving default rules and Q&A:', saveError);
          }
        }
      }

      setConfig(agentConfig);
    } catch (error) {
      console.error('Error loading config:', error);

      // Get a default config
      const defaultConfig = await loadAIAgentConfig('default');

      setConfig({
        isEnabled: true,
        enabledPipelines: [],
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
        qaEntries: defaultConfig.qaEntries || [],
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

      const foundState = US_STATES.find(state => criteriaText.toLowerCase().includes(state.toLowerCase()));

      const foundType = PROPERTY_TYPES.slice(1).find(type => criteriaText.toLowerCase().includes(type.toLowerCase()));
      setPropertyTypes(foundType ? [foundType] : ['All']);

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
      setRegion('All States');
      setPropertyTypes(['All']);
      setAdditionalCriteria('');
    }
  };

  const updateBuyingCriteria = () => {
    if (!config) return;

    const formatPrice = (price: number) => price >= 1000000 ? `$${price / 1000000} million` : `$${price.toLocaleString()}`;
    const locationText = region === 'All States' ? 'nationwide' : `in ${region}`;
    const propertyText = propertyTypes.includes('All') ? 'all property types' : `${propertyTypes.join(', ').toLowerCase()} properties`;

    const criteriaText = priceRange.min > 0
      ? `Properties between ${formatPrice(priceRange.min)} and ${formatPrice(priceRange.max)} ${locationText}, ${propertyText}`
      : `Properties up to ${formatPrice(priceRange.max)} ${locationText}, ${propertyText}`;

    const newCriteria = additionalCriteria.trim() ? `${criteriaText}, ${additionalCriteria.trim()}` : criteriaText;

    const updatedConfig = {
      ...config, buyingCriteria: newCriteria, 
      propertyType: propertyText,
      maxPrice: priceRange.max,
      minPrice: priceRange.min,
      region: region === 'All States'? 'Nationwide' : region,
    };
    setConfig(updatedConfig);

    if (user?.id) {
      saveAIAgentConfig(updatedConfig, user.id)
        .then(() => triggerConfigRefresh())
        .catch(error => console.error('Error auto-saving buying criteria:', error));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!config) return;
    const { name, value } = e.target;
    setConfig(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const handleRegionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRegion(value);
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
    if (!user?.id || !config || !selectedAgentId) {
      toast.error('User not authenticated or config not loaded');
      return;
    }
    if (!user.phoneNumbers || user.phoneNumbers.length === 0) {
      toast.error('Please add a phone number to your account');
      return;
    }

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
      await syncConfigWithServer(config);

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


  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--nextprop-primary)]"></div>
      </div>
    );
  }

  const placeholders = {
    agentName: 'Jane Smith',
    speakingOnBehalfOf: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'NextProp User',
    contactPhone: user?.phone || (user?.phoneNumbers?.[0]?.phoneNumber) || '(415) 555-1234',
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

      <div className="mb-6">
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <FunnelIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Pipeline Configuration</h3>
          </div>

          <div className="mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pipelines.map(pipeline => (
                  <div
                    key={pipeline.id}
                    className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--nextprop-surface-hover)] transition-colors ${config.enabledPipelines.some(p => p.id === pipeline.id)
                      ? 'border-[var(--nextprop-primary)] bg-[var(--nextprop-primary-light)]/5'
                      : 'border-[var(--nextprop-border)]'
                      }`}
                    onClick={() => handleTogglePipeline(pipeline)}
                  >
                    <span className="text-sm font-medium text-[var(--nextprop-text-primary)] truncate">
                      {pipeline.name}
                    </span>
                    <Switch
                      checked={config.enabledPipelines.some(p => p.id === pipeline.id)}
                      onChange={() => handleTogglePipeline(pipeline)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {user?.phoneNumbers?.length > 0 ? (
                  <select
                    id="contactPhone"
                    name="contactPhone"
                    value={config.contactPhone || ''}
                    onChange={handleInputChange}
                    className="nextprop-input w-full p-2.5 rounded-r-lg border border-[var(--nextprop-border)] focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                  >
                    <option value="">Select a phone number</option>
                    {user.phoneNumbers.map((num) => (
                      <option key={num.phoneNumber} value={num.phoneNumber}>
                        {num.phoneNumber} {num.isDefaultNumber ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>

                ) : (
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={config.contactPhone || ''}
                    onChange={handleInputChange}
                    placeholder={placeholders.contactPhone}
                    className="nextprop-input w-full p-2.5 rounded-r-lg border border-[var(--nextprop-border)] focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                  />
                )}
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
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <BuildingOfficeIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Buying Criteria</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <div className="flex items-center mb-2">
                <MapPinIcon className="h-4 w-4 text-[var(--nextprop-primary)] mr-2" />
                <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)]">
                  In Area
                </label>
              </div>
              {/* Textfield to ask "In Area: " */}
              <input
                type="text"
                id="inArea"
                name="inArea"
                value={region || ''}
                onChange={handleRegionInputChange}
                placeholder="i.e: Bay area of San Francisco"
                className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
              />
            </div>

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
                onChange={(e) => setPropertyTypes([e.target.value])}
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type} value={type}>{type === 'All' ? 'All Property Types' : type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* <div className="mt-4">
            <label htmlFor="additionalCriteria" className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-2">
              Additional Requirements (Optional)
            </label>
            <textarea
              id="additionalCriteria"
              value={additionalCriteria}
              onChange={(e) => setAdditionalCriteria(e.target.value)}
              className="nextprop-input w-full p-3 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
              rows={2}
              placeholder="E.g., cosmetic rehabs only, no structural issues, etc."
            />
            <p className="text-xs text-[var(--nextprop-text-tertiary)] mt-1">
              Additional preferences beyond price, location, and property type
            </p>
          </div> */}
        </div>

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
              { value: 'short-sale', label: 'Short Sale' },
              { value: 'home-owner', label: 'Home Owner' },
              { value: 'distressed-seller', label: 'Distressed Seller' },

            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => handleDealObjectiveChange(option.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${config.dealObjective === option.value
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



      {/* Q&A Section */}
      <div className="mt-6">
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <DocumentTextIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
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
                          className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--nextprop-text-secondary)] mb-1">
                          Answer
                        </label>
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
                          className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm resize-none"
                        />
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

      {/* Advanced Customization Section */}
      <div className="mt-6">
        <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[var(--nextprop-border)]">
            <DocumentTextIcon className="h-5 w-5 text-[var(--nextprop-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)]">Advanced Customization</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[var(--nextprop-text-secondary)] mb-2">
              Add additional custom instructions for your AI agent
            </p>

            <textarea
              rows={5}
              name="customInstructions"
              value={config.customInstructions || ''}
              onChange={handleInputChange}
              placeholder="Enter additional instructions for the AI agent..."
              className="nextprop-input w-full p-2.5 border border-[var(--nextprop-border)] rounded-lg focus:ring-2 focus:ring-[var(--nextprop-primary)] focus:border-[var(--nextprop-primary)] shadow-sm"
            ></textarea>

            <p className="text-xs text-[var(--nextprop-text-tertiary)]">
              These instructions will be added to the end of the AI prompt. Be careful not to contradict earlier instructions.
            </p>
          </div>
        </div>
      </div>

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