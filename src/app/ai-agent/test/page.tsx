'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { AIAgentConfig as AIAgentConfigType } from '@/types/ai-agent';
import { useAuth } from '@/contexts/AuthContext';
import MultiAgentSelector from '@/components/ai-agent/MultiAgentSelector';

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

const DEFAULT_BUYING_CRITERIA = "Properties between $500,000 and $2 million in the Bay Area, single-family homes, cosmetic rehabs only, no long-term projects";

export default function AIAgentTestPage() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<{ text: string, isUser: boolean, isLoading?: boolean }[]>([]);
  const [agentConfig, setAgentConfig] = useState<AIAgentConfigType | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const conversationRef = useRef<HTMLDivElement>(null);

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
    const loadConfig = async () => {
      try {
        setError(null);
        const userId = user?.locationId;

        if (!userId) {
          console.log(`User ID is missing`);
          return;
        }
        
        const configRef = doc(db, 'ai-agent-configs', userId);
        const docSnap = await getDoc(configRef);

        const defaultConfig = {
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
          audienceType: 'realtor',
        };

        setAgentConfig(docSnap.exists() ? { ...defaultConfig, ...docSnap.data() } : defaultConfig);
      } catch (error) {
        console.error('Error loading agent config:', error);
        setError('Failed to load agent configuration');
      } finally {
        setIsConfigLoading(false);
      }
    };

    loadConfig();
  }, [user?.locationId]);

  useEffect(() => {
    const handleConfigChange = () => {
      setIsConfigLoading(true);
      loadConfig();
    };

    window.addEventListener('ai-agent-config-changed', handleConfigChange);
    return () => window.removeEventListener('ai-agent-config-changed', handleConfigChange);
  }, []);

  const loadConfig = async () => {
    try {
      const userId = user?.locationId || 'default-user-id';
      const configRef = doc(db, 'ai-agent-configs', userId);
      const docSnap = await getDoc(configRef);

      const defaultConfig = {
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
        audienceType: 'realtor',
      };

      setAgentConfig(docSnap.exists() ? { ...defaultConfig, ...docSnap.data() } : defaultConfig);
    } catch (error) {
      console.error('Error reloading agent config:', error);
      setError('Failed to reload agent configuration');
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !agentConfig || isSending) return;

    const newUserMessage = { text: message, isUser: true };
    const tempBotMessage = { text: 'Processing...', isUser: false, isLoading: true };
    setConversation([...conversation, newUserMessage, tempBotMessage]);
    setMessage('');
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-agent/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: [...conversation, newUserMessage],
          locationId: user?.locationId,
          agentConfig,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || data.message || 'API error');
      }

      if (!data.message) {
        throw new Error('No response received from the AI agent');
      }

      setConversation(prev => [
        ...prev.slice(0, -1),
        { text: data.message, isUser: false }
      ]);
    } catch (err) {
      console.error('Error testing AI agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to test AI agent');
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setConversation([]);
    setError(null);
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
  };

  if (isConfigLoading || !agentConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Agent Tester</h1>

      <MultiAgentSelector onAgentSelect={() => {}} showAddAgent={false} />

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Test {agentConfig.agentName} - Real Estate Agent</h2>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Example Messages:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLE_MESSAGES.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left p-2 border border-gray-200 rounded hover:bg-purple-50 text-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {conversation.length > 0 && (
          <div 
            ref={conversationRef}
            className="mb-6 p-4 border border-gray-200 rounded-lg max-h-80 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Conversation:</h3>
              <button
                onClick={handleReset}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear Conversation
              </button>
            </div>
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-lg ${msg.isUser
                  ? 'bg-purple-50 border-purple-100 ml-8'
                  : 'bg-gray-50 border-gray-100 mr-8'
                } ${msg.isLoading ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-start">
                  <div className="mr-2 font-semibold">
                    {msg.isUser ? 'You:' : `${agentConfig.agentName}:`}
                  </div>
                  <div className="flex-1">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              rows={4}
              placeholder="Enter a message to test the AI agent..."
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isSending || !message.trim() || !agentConfig.isEnabled}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}