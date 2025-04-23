'use client';

import React, { useState, useEffect } from 'react';
import { PaperAirplaneIcon, PlusIcon, TrashIcon, ArrowPathIcon, ClipboardIcon, CheckIcon, ChevronUpIcon, ChevronDownIcon, DocumentDuplicateIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon, CloudArrowUpIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

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
  };
}

interface SavedConversation {
  id: string;
  name: ConversationTemplate;
  form: TestForm;
  createdAt: Date;
}

type ConversationTemplate = 'Terms Discussion' | 'Property Value Discussion';

const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 1000,
  model: 'gpt-3.5-turbo',
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0
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
    config: { ...DEFAULT_CONFIG }
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
    config: { ...DEFAULT_CONFIG }
  }
};

const isConversationTemplate = (value: string): value is ConversationTemplate => {
  return value === 'Terms Discussion' || value === 'Property Value Discussion';
};

export default function AIAgentTestV2() {
  const [formData, setFormData] = useState<TestForm>({
    ...SAMPLE_CONVERSATIONS['Terms Discussion'],
    config: { ...DEFAULT_CONFIG }
  });
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Terms Discussion');
  const [showJsonView, setShowJsonView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseHistory, setResponseHistory] = useState<Array<{response: string, timestamp: string}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showSavedConversations, setShowSavedConversations] = useState(false);
  const [currentConversationName, setCurrentConversationName] = useState<ConversationTemplate>('Terms Discussion');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://us-central1-nextprop-ai.cloudfunctions.net/chatai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          history: formData.history.map(({ id, timestamp, ...rest }) => rest)
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      const responseStr = JSON.stringify(data, null, 2);
      setResponse(responseStr);
      
      // Add to history
      const newHistory = [{
        response: responseStr,
        timestamp: new Date().toISOString()
      }, ...responseHistory].slice(0, 10);
      setResponseHistory(newHistory);
      localStorage.setItem('responseHistory', JSON.stringify(newHistory));

      // Add response to conversation
      if (data.message) {
        setFormData(prev => ({
          ...prev,
          history: [...prev.history, {
            id: Date.now().toString(),
            isUser: false,
            text: data.message,
            timestamp: new Date().toISOString()
          }]
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  const addMessage = () => {
    setFormData(prev => ({
      ...prev,
      history: [...prev.history, {
        id: Date.now().toString(),
        isUser: true,
        text: '',
        timestamp: new Date().toISOString()
      }]
    }));
  };

  const updateMessage = (index: number, newText: string, isUser: boolean) => {
    const newHistory = [...formData.history];
    newHistory[index] = { 
      ...newHistory[index],
      isUser, 
      text: newText,
      timestamp: new Date().toISOString()
    };
    setFormData(prev => ({ ...prev, history: newHistory }));
  };

  const removeMessage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      history: prev.history.filter((_, i) => i !== index)
    }));
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
      form: formData,
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

  const updateConfig = (key: 'temperature' | 'maxTokens' | 'model', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const duplicateMessage = (index: number) => {
    const message = formData.history[index];
    setFormData(prev => ({
      ...prev,
      history: [
        ...prev.history.slice(0, index + 1),
        { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() },
        ...prev.history.slice(index + 1)
      ]
    }));
  };

  const moveMessage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === formData.history.length - 1)) return;

    const newHistory = [...formData.history];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newHistory[index], newHistory[newIndex]] = [newHistory[newIndex], newHistory[index]];
    setFormData(prev => ({ ...prev, history: newHistory }));
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-white overflow-auto"
    : "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100";

  return (
    <div className={containerClasses}>
      <div className={isFullscreen ? 'h-full' : 'max-w-7xl mx-auto px-4 py-8'}>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white">AI Agent Test Environment v2</h1>
              <p className="mt-1 text-sm text-blue-100">Test your AI agent responses with different conversation scenarios</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="px-3 py-1.5 text-sm text-white border border-white/30 rounded-md hover:bg-white/10"
              >
                Advanced Config
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 h-full">
            {/* Left Panel - Configuration */}
            <div className="p-6 space-y-6 overflow-auto">
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
                  <button
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
                  </button>
                </div>
              </div>

              {showConfig && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Advanced Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Temperature</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.config?.temperature}
                        onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Max Tokens</label>
                      <input
                        type="number"
                        min="1"
                        max="4000"
                        value={formData.config?.maxTokens}
                        onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Model</label>
                    <select
                      value={formData.config?.model}
                      onChange={(e) => updateConfig('model', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                    </select>
                  </div>
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
                <label className="block text-lg font-medium text-gray-700 mb-4">Location ID</label>
                <input
                  type="text"
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                  className="w-full rounded-xl border-2 border-gray-300 px-6 py-4 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-lg"
                  placeholder="Enter location ID..."
                />
              </div>

              <div className="mt-12">
                <label className="block text-lg font-medium text-gray-700 mb-4">Current Message</label>
                <div className="relative">
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
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
                      className={`relative flex gap-4 items-start p-6 rounded-xl border-2 transition-colors duration-200 ${
                        msg.isUser 
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
                          className={`self-start rounded-xl border-2 px-6 py-3 text-lg min-w-[160px] ${
                            msg.isUser
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
                          className={`w-full min-h-[120px] rounded-xl border-2 px-6 py-4 text-lg bg-white ${
                            msg.isUser
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
            <div className="p-6 space-y-6 overflow-auto">
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

              {response && (
                <div className="mt-4">
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(response)}
                      className="absolute top-2 right-2 px-2 py-1 text-xs bg-white rounded border shadow-sm flex items-center gap-1 hover:bg-gray-50 transition-colors duration-200"
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
                    <pre className={`p-4 rounded-lg overflow-auto max-h-[600px] text-sm shadow-inner ${
                      showJsonView 
                        ? 'bg-gray-900 text-gray-100'
                        : 'bg-white border border-gray-200'
                    }`}>
                      {showJsonView ? response : JSON.parse(response).message || response}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 