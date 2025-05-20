'use client';

import React, { useState, useEffect } from 'react';
import { PaperAirplaneIcon, PlusIcon, TrashIcon, ArrowPathIcon, ClipboardIcon, CheckIcon, ChevronUpIcon, ChevronDownIcon, DocumentDuplicateIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { storage, db } from '@/lib/firebaseConfig';
import toast from 'react-hot-toast';
import { doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { getMultiAgentConfig, saveMultiAgentConfig } from '@/lib/ai-agent';
import type { MultiAgentConfig, AIAgentConfig } from '@/types/ai-agent';
import { collection } from 'firebase/firestore';

interface Message {
  id: string;
  isUser: boolean;
  text: string;
  timestamp?: string;
}

interface TestForm {
  locationId: string;
  message: string;
  history: Message[];
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    tone?: 'friendly' | 'professional' | 'casual';
    length?: 'short' | 'medium' | 'long';
    agentName?: string;
    companyName?: string;
    speakingOnBehalfOf?: string;
    contactPhone?: string;
    contactEmail?: string;
    companyWebsite?: string;
    dealObjective?: string;
    buyingCriteria?: string;
    customInstructions?: string;
  };
}

interface SavedConversation {
  id: string;
  name: ConversationTemplate;
  form: TestForm;
  createdAt: Date;
}

type ConversationTemplate = 'Terms Discussion' | 'Property Value Discussion';

const DEFAULT_BUYING_CRITERIA = "Properties between $500,000 and $2 million in the Bay Area, single-family homes, cosmetic rehabs only, no long-term projects";

const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 1000,
  model: 'gpt-3.5-turbo',
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  tone: 'friendly' as 'friendly' | 'professional' | 'casual',
  length: 'medium' as 'short' | 'medium' | 'long',
  agentName: 'Jane Smith',
  companyName: 'NextProp',
  speakingOnBehalfOf: 'NextProp Real Estate',
  contactPhone: '555-123-4567',
  contactEmail: 'contact@nextprop.com',
  companyWebsite: 'www.nextprop.com',
  dealObjective: 'realtor-creative-finance',
  buyingCriteria: DEFAULT_BUYING_CRITERIA,
  customInstructions: ''
};

const SAMPLE_CONVERSATIONS: Record<ConversationTemplate, Omit<TestForm, 'config'> & { config: typeof DEFAULT_CONFIG }> = {
  'Terms Discussion': {
    locationId: 'n5KIiKGnIt53Fg114jSG',
    message: 'what do you mean by terms?',
    history: [
      {
        id: '1',
        isUser: false,
        text: "Hi, this is Marco from BM Realty. I'm reaching out regarding the property on 6010 CARLISLE Court. I noticed it has been listed for more than 88 days. Would you be open to considering an offer on terms?"
      },
      {
        id: '2',
        isUser: true,
        text: "Hello Marco, thanks for reaching out. The property is still available."
      },
      {
        id: '3',
        isUser: false,
        text: "Great to hear! I have a qualified buyer who's interested in the property but would like to explore creative financing options. Would you be open to discussing different terms?"
      },
      {
        id: '4',
        isUser: true,
        text: "ok. will i still get my fee??"
      }
    ],
    config: {
      ...DEFAULT_CONFIG,
      dealObjective: 'realtor-creative-finance',
      tone: 'professional' as 'friendly' | 'professional' | 'casual',
      buyingCriteria: "Properties between $300,000 and $1.5 million in any location, looking for seller financing options, flexible on property condition and type"
    }
  },
  'Property Value Discussion': {
    locationId: 'n5KIiKGnIt53Fg114jSG',
    message: "What's your estimate for this property?",
    history: [
      {
        id: '1',
        isUser: true,
        text: "Hi, I have a property at 123 Main St that I'm thinking of selling."
      },
      {
        id: '2',
        isUser: false,
        text: "Thank you for reaching out! Could you tell me more about the property? How many bedrooms and bathrooms does it have?"
      }
    ],
    config: {
      ...DEFAULT_CONFIG,
      dealObjective: 'homeowner-cash-offer',
      tone: 'friendly' as 'friendly' | 'professional' | 'casual',
      buyingCriteria: "Properties up to $750,000 in urban areas, single-family homes and condos, ready for immediate cash purchase, minor repairs acceptable"
    }
  }
};

const isConversationTemplate = (value: string): value is ConversationTemplate => {
  return value === 'Terms Discussion' || value === 'Property Value Discussion';
};

// OpenAI settings interface
interface OpenAISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// Default OpenAI settings
const DEFAULT_OPENAI_SETTINGS: OpenAISettings = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0
};

export default function AIAgentTestV2() {
  const [formData, setFormData] = useState<TestForm>({
    locationId: '',
    message: '',
    history: [],
    config: { ...DEFAULT_CONFIG }
  });
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Terms Discussion');
  const [showJsonView, setShowJsonView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseHistory, setResponseHistory] = useState<Array<{ response: string, timestamp: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showSavedConversations, setShowSavedConversations] = useState(false);
  const [currentConversationName, setCurrentConversationName] = useState<ConversationTemplate>('Terms Discussion');

  // OpenAI settings state
  const [openAISettings, setOpenAISettings] = useState<OpenAISettings>(DEFAULT_OPENAI_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showOpenAISettings, setShowOpenAISettings] = useState(false);

  // load JS file
  const [jsLoading, setJsLoading] = useState(false);
  const [jsError, setJsError] = useState<string | null>(null);
  const [jsContent, setJsContent] = useState<string>('');
  const [jsSaving, setJsSaving] = useState(false);
  const [isPromptDebugMode, setIsPromptDebugMode] = useState(false); 
  const PROMPT_FILE_PATH = 'js/prompt.js';

  // Multi-agent config state (must be inside the component)
  const [multiAgentConfig, setMultiAgentConfig] = useState<MultiAgentConfig | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentSaving, setAgentSaving] = useState(false);

  // Add a new state for available locationIds
  const [availableLocations, setAvailableLocations] = useState<Array<{id: string, name: string}>>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load OpenAI settings from Firestore
  const loadOpenAISettings = async () => {
    try {
      setLoadingSettings(true);
      const settingsRef = doc(db, 'settings', 'openai');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as {
          frequency_penalty: number;
          max_tokens: number;
          model: string;
          presence_penalty: number;
          temperature: number;
          top_p: number;
        };

        // Map Firestore data to OpenAISettings
        const mappedSettings: OpenAISettings = {
          model: data.model,
          temperature: data.temperature,
          maxTokens: data.max_tokens,
          topP: data.top_p,
          frequencyPenalty: data.frequency_penalty,
          presencePenalty: data.presence_penalty,
        };

        setOpenAISettings(mappedSettings);
        
        // Also update the form data to use these settings
        setFormData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            config: {
              ...prev.config,
              model: mappedSettings.model || prev.config.model || DEFAULT_CONFIG.model,
              temperature: mappedSettings.temperature || prev.config.temperature || DEFAULT_CONFIG.temperature,
              maxTokens: mappedSettings.maxTokens || prev.config.maxTokens || DEFAULT_CONFIG.maxTokens,
              topP: mappedSettings.topP || prev.config.topP || DEFAULT_CONFIG.topP,
              frequencyPenalty: mappedSettings.frequencyPenalty || prev.config.frequencyPenalty || DEFAULT_CONFIG.frequencyPenalty,
              presencePenalty: mappedSettings.presencePenalty || prev.config.presencePenalty || DEFAULT_CONFIG.presencePenalty
            }
          };
        });
        
        toast.success('OpenAI settings loaded successfully');
      } else {
        // Document doesn't exist, use defaults
        setOpenAISettings(DEFAULT_OPENAI_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading OpenAI settings:', error);
      toast.error('Failed to load OpenAI settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Save OpenAI settings to Firestore
  const saveOpenAISettings = async () => {
    try {
      setSavingSettings(true);
      const settingsRef = doc(db, 'settings', 'openai');
      await setDoc(settingsRef, openAISettings);
      toast.success('OpenAI settings saved successfully');
    } catch (error) {
      console.error('Error saving OpenAI settings:', error);
      toast.error('Failed to save OpenAI settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Update OpenAI settings
  const updateOpenAISettings = (key: keyof OpenAISettings, value: string | number) => {
    setOpenAISettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    loadPromptFile();
    loadOpenAISettings(); // Load OpenAI settings when component mounts
  }, [isPromptDebugMode]);

  const loadPromptFile = async () => {
    try {
      setJsLoading(true);
      setJsError(null);
      const endpoint = isPromptDebugMode ? '/api/ai-agent/test/editor/debug' : '/api/ai-agent/test/editor';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to load prompt file: ${response.statusText}`);
      }
      const text = await response.text();
      const cleanedContent = text
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      setJsContent(cleanedContent);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load prompt file';
      setJsError(errorMessage);
      console.error('Error loading prompt file:', err);
    } finally {
      setJsLoading(false);
    }
  };

  const savePromptFile = async (content: string) => {
    try {
      setJsSaving(true);
      setJsError(null);

      const blob = new Blob([content], { type: 'text/javascript' });
      const file = new File([blob], 'prompt.js', { type: 'text/javascript' });

      const formData = new FormData();
      formData.append('file', file);

      const endpoint = isPromptDebugMode ? '/api/ai-agent/test/editor/debug' : '/api/ai-agent/test/editor';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save prompt file');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save prompt file';
      setJsError(errorMessage);
      console.error('Error saving prompt file:', error);
      return false;
    } finally {
      setJsSaving(false);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('responseHistory');
    const savedConvs = localStorage.getItem('savedConversations');
    if (savedHistory) {
      setResponseHistory(JSON.parse(savedHistory));
    }
    if (savedConvs) {
      setSavedConversations(JSON.parse(savedConvs));
    }
  }, []);

  // Block all actions until config is loaded from Firestore
  const configLoaded = multiAgentConfig && selectedAgentId && multiAgentConfig.agents[selectedAgentId];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configLoaded) return;
    setLoading(true);
    setError(null);

    // Get the selected agent config from multiAgentConfig
    const agentConfig = multiAgentConfig?.agents[selectedAgentId || ''];
    if (!agentConfig) {
      setError('No agent config loaded from Firestore.');
      setLoading(false);
      return;
    }

    // Use a local message state for the test message
    const message = formData && formData.message ? formData.message : '';
    const history = formData && formData.history ? formData.history : [];

    // Add the user's message to the conversation history if it's not empty
    if (message.trim()) {
      setFormData(prev => ({
        ...prev,
        history: [...prev.history, {
          id: Date.now().toString(),
          isUser: true,
          text: message,
          timestamp: new Date().toISOString()
        }]
      }));
    }

    // Create request payload with or without the new user message
    const requestPayload = {
      locationId: formData ? formData.locationId : '',
      agentId: selectedAgentId,
      agentConfig,
      message,
      history: message.trim() 
        ? [...history, { 
            isUser: true, 
            text: message 
          } as Message].map(({ id, timestamp, ...rest }) => rest)
        : history.map(({ id, timestamp, ...rest }) => rest)
    };

    // Log the request payload for debugging
    console.log('Sending request with payload:', requestPayload);

    try {
      const res = await fetch('/api/chatai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      // Log the response status and headers for debugging
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          } else if (Object.keys(errorJson).length === 0) {
            errorMessage = `The cloud function returned a ${res.status} error with an empty response. Please check the cloud function logs.`;
          } else {
            errorMessage = `HTTP error! status: ${res.status}`;
          }
        } catch (e) {
          errorMessage = `HTTP error! status: ${res.status}, message: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('Received response:', data);

      const responseStr = JSON.stringify(data, null, 2);
      setResponse(responseStr);

      // Add to history
      const newHistory = [{
        response: responseStr,
        timestamp: new Date().toISOString()
      }, ...responseHistory].slice(0, 10);
      setResponseHistory(newHistory);
      localStorage.setItem('responseHistory', JSON.stringify(newHistory));

      // show toast with longer timeout 
      if (data.isHumanEscalationNeeded) {
        toast.success('Moving to stage: Human Escalation', {
          duration: 10000
        });
      }
      if (data.isDND) {
        toast.success('Moving to stage: Do Not Disturb', {
          duration: 10000
        });
      }
      
      // Add AI response to conversation
      setFormData(prev => ({
        ...prev,
        history: [...prev.history, {
          id: Date.now().toString(),
          isUser: false,
          text: data.message,
          timestamp: new Date().toISOString()
        }],
        message: ''
      }));
    } catch (error) {
      console.error('Full error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  const addMessage = () => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        locationId: prev.locationId,
        message: prev.message,
        history: [...prev.history, {
          id: Date.now().toString(),
          isUser: true,
          text: '',
          timestamp: new Date().toISOString()
        }],
        config: prev.config
      };
    });
  };

  const updateMessage = (index: number, newText: string, isUser: boolean) => {
    if (!formData) return;
    const newHistory = [...formData.history];
    newHistory[index] = {
      ...newHistory[index],
      isUser,
      text: newText,
      timestamp: new Date().toISOString()
    };
    setFormData(prev => {
      if (!prev) return prev;
      return {
        locationId: prev.locationId,
        message: prev.message,
        history: newHistory,
        config: prev.config
      };
    });
  };

  const removeMessage = (index: number) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        locationId: prev.locationId,
        message: prev.message,
        history: prev.history.filter((_, i) => i !== index),
        config: prev.config
      };
    });
  };

  const handleTemplateChange = (template: ConversationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...SAMPLE_CONVERSATIONS[template],
      config: { ...DEFAULT_CONFIG }
    });
    setResponse('');
    setError(null);
  };

  const saveCurrentConversation = () => {
    if (!currentConversationName || !isConversationTemplate(currentConversationName)) return;

    const newSavedConversation: SavedConversation = {
      id: Date.now().toString(),
      name: currentConversationName,
      form: formData || {
        locationId: '',
        message: '',
        history: [],
        config: DEFAULT_CONFIG
      },
      createdAt: new Date()
    };

    const updatedConversations = [...savedConversations, newSavedConversation];
    setSavedConversations(updatedConversations);
    localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));
    setCurrentConversationName('Terms Discussion');
  };

  const loadConversation = (conversation: SavedConversation) => {
    setFormData(conversation.form);
    setShowSavedConversations(false);
  };

  const deleteConversation = (index: number) => {
    const updatedConversations = savedConversations.filter((_, i) => i !== index);
    setSavedConversations(updatedConversations);
    localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));
  };

  const updateConfig = (key: 'temperature' | 'maxTokens' | 'model' | 'topP' | 'frequencyPenalty' | 'presencePenalty' |
    'tone' | 'length' | 'agentName' | 'companyName' | 'speakingOnBehalfOf' |
    'contactPhone' | 'contactEmail' | 'companyWebsite' | 'dealObjective' | 'buyingCriteria' | 'customInstructions', value: number | string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        locationId: prev.locationId,
        message: prev.message,
        history: prev.history,
        config: {
          ...prev.config,
          [key]: value
        }
      };
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const duplicateMessage = (index: number) => {
    if (!formData) return;
    const message = formData.history[index];
    setFormData(prev => {
      if (!prev) return prev;
      return {
        locationId: prev.locationId,
        message: prev.message,
        history: [
          ...prev.history.slice(0, index + 1),
          { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() },
          ...prev.history.slice(index + 1)
        ],
        config: prev.config
      };
    });
  };

  const moveMessage = (index: number, direction: 'up' | 'down') => {
    if (!formData) return;
    if ((direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.history.length - 1)) return;
    const newHistory = [...formData.history];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newHistory[index], newHistory[newIndex]] = [newHistory[newIndex], newHistory[index]];
    setFormData(prev => {
      if (!prev) return prev;
      return {
        locationId: prev.locationId,
        message: prev.message,
        history: newHistory,
        config: prev.config
      };
    });
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-white flex flex-col h-screen"
    : "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100";

  // Load multi-agent config when locationId changes
  useEffect(() => {
    if (!formData) return;
    if (!formData.locationId) return;
    setAgentLoading(true);
    getMultiAgentConfig(formData.locationId)
      .then(config => {
        setMultiAgentConfig(config);
        setSelectedAgentId(config.activeAgentId || Object.keys(config.agents)[0]);
      })
      .catch(err => {
        toast.error('Failed to load agent config');
        setMultiAgentConfig(null);
      })
      .finally(() => setAgentLoading(false));
  }, [formData?.locationId]);

  // Handler to update agent config in state
  const updateAgentField = (key: keyof AIAgentConfig, value: any) => {
    if (!multiAgentConfig || !selectedAgentId) return;
    setMultiAgentConfig((prev: MultiAgentConfig | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        agents: {
          ...prev.agents,
          [selectedAgentId]: {
            ...prev.agents[selectedAgentId],
            [key]: value,
            updatedAt: new Date(),
          }
        }
      };
    });
  };

  // Save handler
  const handleSaveAgentConfig = async () => {
    if (!multiAgentConfig || !formData) return;
    if (!formData.locationId) return;
    setAgentSaving(true);
    try {
      await saveMultiAgentConfig(formData.locationId, multiAgentConfig);
      toast.success('Agent config saved!');
    } catch (e) {
      toast.error('Failed to save agent config');
    } finally {
      setAgentSaving(false);
    }
  };

  // Add a function to load all available configs from Firestore
  const loadAvailableLocations = async () => {
    try {
      setLoadingLocations(true);
      // Assuming you're storing the multi-agent configs in a 'multi-agent-configs' collection
      const configsRef = collection(db, 'multi-agent-configs');
      const snapshot = await getDocs(configsRef);
      
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id // Use a name field if available, otherwise use ID
      }));
      
      setAvailableLocations(locations);
      
      // If we have locations and no locationId is selected, select the first one
      if (locations.length > 0 && !formData.locationId) {
        setFormData(prev => ({
          ...prev,
          locationId: locations[0].id
        }));
      }
    } catch (error) {
      console.error('Error loading available locations:', error);
      toast.error('Failed to load available locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  // Call the function on component mount
  useEffect(() => {
    loadAvailableLocations();
  }, []);

  return (
    <div className={containerClasses}>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white">AI Agent Test Environment v2</h1>
              <p className="mt-1 text-sm text-blue-100">Test your AI agent responses with different conversation scenarios</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${showConfig
                  ? 'bg-white text-blue-600 border border-blue-300'
                  : 'text-white border border-white/30 hover:bg-white/10'
                  }`}
              >
                {showConfig ? 'Hide' : 'Show'} Advanced Config
                {showConfig ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setShowOpenAISettings(!showOpenAISettings)}
                className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${showOpenAISettings
                  ? 'bg-white text-blue-600 border border-blue-300'
                  : 'text-white border border-white/30 hover:bg-white/10'
                  }`}
              >
                {showOpenAISettings ? 'Hide' : 'Show'} OpenAI Settings
                {showOpenAISettings ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="text-white hover:text-blue-100"
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {showOpenAISettings && (
            <div className="p-6 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-gray-200">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">OpenAI Settings</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={loadOpenAISettings}
                      disabled={loadingSettings}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                      {loadingSettings ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </button>
                    <button
                      onClick={saveOpenAISettings}
                      disabled={savingSettings}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md shadow-sm hover:bg-violet-700"
                    >
                      {savingSettings ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Model Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model
                        </label>
                        <select
                          value={openAISettings.model}
                          onChange={(e) => updateOpenAISettings('model', e.target.value)}
                          className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:border-violet-500 focus:ring-violet-500"
                        >
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-4-32k">GPT-4 32K</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          value={openAISettings.maxTokens}
                          onChange={(e) => updateOpenAISettings('maxTokens', parseInt(e.target.value))}
                          className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:border-violet-500 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Generation Parameters</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temperature
                          <span className="ml-2 text-sm text-gray-500">
                            ({openAISettings.temperature.toFixed(1)})
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={openAISettings.temperature}
                          onChange={(e) => updateOpenAISettings('temperature', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Precise</span>
                          <span>Creative</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Top P
                          <span className="ml-2 text-sm text-gray-500">
                            ({openAISettings.topP !== undefined ? openAISettings.topP.toFixed(1) : 'N/A'})
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={openAISettings.topP}
                          onChange={(e) => updateOpenAISettings('topP', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Freq. Penalty
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={openAISettings.frequencyPenalty}
                            onChange={(e) => updateOpenAISettings('frequencyPenalty', parseFloat(e.target.value))}
                            className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:border-violet-500 focus:ring-violet-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pres. Penalty
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={openAISettings.presencePenalty}
                            onChange={(e) => updateOpenAISettings('presencePenalty', parseFloat(e.target.value))}
                            className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:border-violet-500 focus:ring-violet-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Left Panel - Configuration */}
            <div className="p-6 space-y-6 overflow-y-auto min-h-0 lg:col-span-2">
              <div className="flex gap-4">
                <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <label className="block text-sm font-medium text-blue-900 mb-2">Conversation Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Terms Discussion' || value === 'Property Value Discussion') {
                        handleTemplateChange(value as ConversationTemplate);
                      }
                    }}
                    className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {Object.keys(SAMPLE_CONVERSATIONS).map(template => (
                      <option key={template} value={template}>{template}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  {/* <button
                    onClick={() => setShowSavedConversations(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <CloudArrowDownIcon className="h-4 w-4 mr-1" />
                    Load
                  </button>
                  <button
                    onClick={saveCurrentConversation}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    Save
                  </button> */}
                </div>
              </div>

              {showConfig && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">AI Agent Configuration</h3>
                    <p className="text-sm text-gray-500">Configure how the AI agent behaves and responds</p>
                  </div>

                  {/* Agent selection UI - move here */}
                  {multiAgentConfig && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Agent</label>
                      <select
                        value={selectedAgentId}
                        onChange={e => setSelectedAgentId(e.target.value)}
                        className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {Object.entries(multiAgentConfig.agents).map(([agentId, agent]) => {
                          const typedAgent = agent as AIAgentConfig;
                          return (
                            <option key={agentId} value={agentId}>{typedAgent.name || typedAgent.agentName || agentId}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Config fields - bind to selected agent */}
                  {multiAgentConfig && selectedAgentId && (
                    <>
                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Response Style</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Tone</label>
                            <select
                              value={multiAgentConfig.agents[selectedAgentId]?.tone || 'friendly'}
                              onChange={e => updateAgentField('tone', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            >
                              <option value="friendly">Friendly</option>
                              <option value="professional">Professional</option>
                              <option value="casual">Casual</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Length</label>
                            <select
                              value={multiAgentConfig.agents[selectedAgentId]?.length || 'medium'}
                              onChange={e => updateAgentField('length', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            >
                              <option value="short">Short</option>
                              <option value="medium">Medium</option>
                              <option value="long">Long</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Deal Objective</label>
                            <select
                              value={multiAgentConfig.agents[selectedAgentId]?.dealObjective || 'realtor-creative-finance'}
                              onChange={e => updateAgentField('dealObjective', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            >
                              <option value="realtor-off-market">Realtor - Off Market</option>
                              <option value="realtor-short-sale">Realtor - Short Sale</option>
                              <option value="realtor-creative-finance">Realtor - Creative Finance</option>
                              <option value="realtor-cash-buyers">Realtor - Cash Buyers</option>
                              <option value="homeowner-cash-offer">Homeowner - Cash Offer</option>
                              <option value="homeowner-distressed">Homeowner - Distressed</option>
                              <option value="homeowner-quick-sale">Homeowner - Quick Sale</option>
                              <option value="homeowner-relocation">Homeowner - Relocation</option>
                            </select>
                          </div>
                          <div className="col-span-2 mt-2">
                            <label className="block text-sm text-gray-700 mb-1">Buying Criteria</label>
                            <textarea
                              value={multiAgentConfig.agents[selectedAgentId]?.buyingCriteria || ''}
                              onChange={e => updateAgentField('buyingCriteria', e.target.value)}
                              rows={3}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Describe your property buying criteria..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Agent Identity</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Agent Name</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.agentName || ''}
                              onChange={e => updateAgentField('agentName', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="Jane Smith"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Company Name</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.companyName || ''}
                              onChange={e => updateAgentField('companyName', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="NextProp"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Speaking On Behalf Of</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.speakingOnBehalfOf || ''}
                              onChange={e => updateAgentField('speakingOnBehalfOf', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="NextProp Real Estate"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Contact Phone</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.contactPhone || ''}
                              onChange={e => updateAgentField('contactPhone', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="555-123-4567"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Contact Email</label>
                            <input
                              type="email"
                              value={multiAgentConfig.agents[selectedAgentId]?.contactEmail || ''}
                              onChange={e => updateAgentField('contactEmail', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="contact@nextprop.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Company Website</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.companyWebsite || ''}
                              onChange={e => updateAgentField('companyWebsite', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="www.nextprop.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Custom Instructions</h4>
                        <textarea
                          value={multiAgentConfig.agents[selectedAgentId]?.customInstructions || ''}
                          onChange={e => updateAgentField('customInstructions', e.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Add any custom instructions for the AI agent..."
                        />
                      </div>

                      {/* Structured Buying Criteria Section */}
                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Buying Criteria</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Min Price</label>
                            <input
                              type="number"
                              min={0}
                              value={multiAgentConfig.agents[selectedAgentId]?.minPrice ?? ''}
                              onChange={e => updateAgentField('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="No Limit"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Max Price</label>
                            <input
                              type="number"
                              min={0}
                              value={multiAgentConfig.agents[selectedAgentId]?.maxPrice ?? ''}
                              onChange={e => updateAgentField('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="$2,000,000"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Area / Region</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.region || ''}
                              onChange={e => updateAgentField('region', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="All States, Bay Area, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Property Type</label>
                            <select
                              value={multiAgentConfig.agents[selectedAgentId]?.propertyType || ''}
                              onChange={e => updateAgentField('propertyType', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            >
                              <option value="">Select type</option>
                              <option value="single-family">Single-family</option>
                              <option value="multi-family">Multi-family</option>
                              <option value="condo">Condo</option>
                              <option value="townhouse">Townhouse</option>
                              <option value="land">Land</option>
                              <option value="commercial">Commercial</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Additional Types (comma separated)</label>
                            <input
                              type="text"
                              value={multiAgentConfig.agents[selectedAgentId]?.additionalPropertyTypes || ''}
                              onChange={e => updateAgentField('additionalPropertyTypes', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                              placeholder="Duplex, Vacation Homes, etc."
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm text-gray-700 mb-1">Buying Criteria (summary/advanced)</label>
                          <textarea
                            value={multiAgentConfig.agents[selectedAgentId]?.buyingCriteria || ''}
                            onChange={e => updateAgentField('buyingCriteria', e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Describe your property buying criteria..."
                          />
                        </div>
                      </div>

                      {/* Q&A Section */}
                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Q&A Entries</h4>
                        <div className="space-y-4">
                          {(multiAgentConfig.agents[selectedAgentId]?.qaEntries || []).map((qa, idx) => (
                            <div key={qa.id} className="flex flex-col md:flex-row gap-2 items-start md:items-center border rounded-lg p-3 bg-white">
                              <input
                                type="text"
                                value={qa.question}
                                onChange={e => {
                                  const updated = [...(multiAgentConfig.agents[selectedAgentId]?.qaEntries || [])];
                                  updated[idx] = { ...qa, question: e.target.value };
                                  updateAgentField('qaEntries', updated);
                                }}
                                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm mb-2 md:mb-0"
                                placeholder="Question"
                              />
                              <textarea
                                value={qa.answer}
                                onChange={e => {
                                  const updated = [...(multiAgentConfig.agents[selectedAgentId]?.qaEntries || [])];
                                  updated[idx] = { ...qa, answer: e.target.value };
                                  updateAgentField('qaEntries', updated);
                                }}
                                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm mb-2 md:mb-0"
                                placeholder="Answer"
                                rows={2}
                              />
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={qa.isEnabled}
                                  onChange={e => {
                                    const updated = [...(multiAgentConfig.agents[selectedAgentId]?.qaEntries || [])];
                                    updated[idx] = { ...qa, isEnabled: e.target.checked };
                                    updateAgentField('qaEntries', updated);
                                  }}
                                /> Enabled
                              </label>
                              <button
                                type="button"
                                className="text-red-500 text-xs ml-2"
                                onClick={() => {
                                  const updated = (multiAgentConfig.agents[selectedAgentId]?.qaEntries || []).filter((_, i) => i !== idx);
                                  updateAgentField('qaEntries', updated);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-200"
                            onClick={() => {
                              const qaEntries = multiAgentConfig.agents[selectedAgentId]?.qaEntries || [];
                              updateAgentField('qaEntries', [
                                ...qaEntries,
                                { id: Date.now().toString(), question: '', answer: '', isEnabled: true }
                              ]);
                            }}
                          >
                            + Add Q&A
                          </button>
                        </div>
                      </div>

                      {/* Save button - move here for comfort */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveAgentConfig}
                          disabled={agentSaving}
                          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all duration-200"
                        >
                          {agentSaving ? 'Saving...' : 'Save Agent Config'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {showSavedConversations && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Saved Conversations</h3>
                      <button
                        onClick={() => setShowSavedConversations(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {savedConversations.map((conv, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{conv.name}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(conv.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadConversation(conv)}
                              className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteConversation(index)}
                              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {savedConversations.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No saved conversations</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-lg font-medium text-gray-700">Location</label>
                  <button
                    onClick={loadAvailableLocations}
                    disabled={loadingLocations}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    {loadingLocations ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Refresh
                      </>
                    )}
                  </button>
                </div>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-300 px-6 py-4 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-lg"
                >
                  <option value="" disabled>Select a location</option>
                  {availableLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                  {availableLocations.length === 0 && !loadingLocations && (
                    <option value="" disabled>No locations found</option>
                  )}
                  {loadingLocations && (
                    <option value="" disabled>Loading locations...</option>
                  )}
                </select>
              </div>

              <div className="mt-12">
                <label className="block text-lg font-medium text-gray-700 mb-4">Current Message</label>
                <div className="relative">
                  <textarea
                    value={formData ? formData.message : ''}
                    onChange={(e) => setFormData(prev => {
                      if (!prev) return prev;
                      return {
                        locationId: prev.locationId,
                        message: e.target.value,
                        history: prev.history,
                        config: prev.config
                      };
                    })}
                    rows={6}
                    className="w-full rounded-xl border-2 border-gray-300 px-6 py-4 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-lg pr-36"
                    placeholder="Type your message here..."
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="absolute bottom-4 right-4 inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-6 w-6 mr-3" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-6 w-6 mr-3" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <label className="block text-lg font-medium text-gray-700">Conversation History</label>
                  <button
                    type="button"
                    onClick={addMessage}
                    className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
                  >
                    <PlusIcon className="h-6 w-6 mr-3" />
                    Add Message
                  </button>
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
                  {formData.history.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`relative flex gap-4 items-start p-6 rounded-xl border-2 transition-colors duration-200 ${msg.isUser
                        ? 'bg-white border-blue-200 hover:border-blue-300'
                        : 'bg-white border-violet-200 hover:border-violet-300'
                        }`}
                    >
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => moveMessage(index, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ChevronUpIcon className="h-6 w-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMessage(index, 'down')}
                          disabled={index === formData.history.length - 1}
                          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ChevronDownIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <select
                          value={msg.isUser ? 'user' : 'assistant'}
                          onChange={(e) => updateMessage(index, msg.text, e.target.value === 'user')}
                          className={`self-start rounded-xl border-2 px-6 py-3 text-lg min-w-[160px] ${msg.isUser
                            ? 'border-blue-300 bg-white text-blue-900'
                            : 'border-violet-300 bg-white text-violet-900'
                            }`}
                        >
                          <option value="user">User</option>
                          <option value="assistant">Assistant</option>
                        </select>
                        <textarea
                          value={msg.text}
                          onChange={(e) => updateMessage(index, e.target.value, msg.isUser)}
                          rows={4}
                          className={`w-full min-h-[120px] rounded-xl border-2 px-6 py-4 text-lg bg-white ${msg.isUser
                            ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                            : 'border-violet-300 focus:border-violet-500 focus:ring-violet-500'
                            }`}
                        />
                      </div>
                      <div className="flex flex-col gap-4">
                        <button
                          type="button"
                          onClick={() => duplicateMessage(index)}
                          className="p-3 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-blue-50"
                          title="Duplicate message"
                        >
                          <DocumentDuplicateIcon className="h-6 w-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMessage(index)}
                          className="p-3 text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50"
                          title="Remove message"
                        >
                          <TrashIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Response */}
            <div className="p-6 space-y-6 overflow-y-auto min-h-0 lg:col-span-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Test Response</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    {showHistory ? 'Hide History' : 'Show History'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJsonView(!showJsonView)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {showJsonView ? 'Pretty View' : 'JSON View'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {showHistory && responseHistory.length > 0 && (
                <div className="border rounded-lg divide-y">
                  <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">Response History</div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {responseHistory.map((item, index) => (
                      <div key={index} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => setResponse(item.response)}>
                        <div className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</div>
                        <div className="text-sm truncate">{item.response.substring(0, 100)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-xl p-6 mt-4">
                <div className="flex items-center mb-4">
                  
                  <h3 className="text-lg font-medium text-gray-800">AI Response</h3>
              {response && (
                    <button
                      onClick={() => copyToClipboard(response)}
                      className="ml-auto px-2 py-1 text-xs bg-white rounded border shadow-sm flex items-center gap-1 hover:bg-gray-50 transition-colors duration-200"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-500">Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {response ? (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md">
                    <pre className={`p-6 rounded-lg overflow-auto min-h-[400px] max-h-[800px] text-base leading-relaxed whitespace-pre-wrap break-words ${showJsonView
                      ? 'bg-gray-900 text-gray-100'
                      : 'bg-white'
                      }`}>
                      {showJsonView ? response : JSON.parse(response).message || response}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                    <p>Send a message to see the AI response here</p>
                </div>
              )}
              </div>

              <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-lg font-medium text-gray-700">Prompt JS</label>
                  <div className="flex gap-2">
                    <button
                      onClick={loadPromptFile}
                      disabled={jsLoading || jsSaving}
                      className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all duration-200"
                    >
                      {jsLoading ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-6 w-6 mr-3" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="h-6 w-6 mr-3" />
                          Reload
                        </>
                      )}
                    </button>
                    <button
                      onClick={async () => {
                        const success = await savePromptFile(jsContent);
                        if (success) {
                          toast.success('Prompt file saved successfully!');
                        } else {
                          toast.error('Failed to save prompt file.');
                        }
                      }}
                      disabled={jsSaving || jsLoading}
                      className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all duration-200"
                    >
                      {jsSaving ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-6 w-6 mr-3" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-6 w-6 mr-3" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="my-4 flex items-center gap-4">
                  <button
                    onClick={() => {
                      setIsPromptDebugMode(prevIsDebugMode => {
                        const newIsDebugMode = !prevIsDebugMode;
                        toast.success(`Prompt editor mode switched to: ${newIsDebugMode ? 'Debug' : 'Production'}`);
                        return newIsDebugMode;
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Switch to {isPromptDebugMode ? 'Production' : 'Debug'} Mode
                  </button>
                  <span className="text-sm text-gray-600">
                    Current Mode: {isPromptDebugMode ? 'Debug (using /debug endpoint)' : '⚠️ Production ⚠️ '}
                  </span>
                </div>
                {jsError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{jsError}</p>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    value={jsContent}
                    onChange={(e) => setJsContent(e.target.value)}
                    rows={60}
                    className="w-full rounded-xl border-2 border-gray-300 px-6 py-4 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-lg font-mono"
                    placeholder="Enter your prompt JS here..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}