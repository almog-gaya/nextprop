'use client';

import React, { useState } from 'react';
import { ArrowPathIcon, PaperAirplaneIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import AIAgentConfig from '@/components/ai-agent/AIAgentConfig';
// import AIAgentDebug from '@/components/ai-agent/AIAgentDebug';

// Example scenarios to test the real estate agent
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

export default function AIAgentTestPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<{text: string, isUser: boolean}[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }
    
    // Add user message to conversation
    const updatedConversation = [...conversation, {text: message, isUser: true}];
    setConversation(updatedConversation);
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ai-agent/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          // Always send conversation history since context memory is always enabled
          history: updatedConversation
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // More detailed error handling
        console.error('API error response:', data);
        throw new Error(
          data.error || 
          data.details || 
          data.message || 
          `API error: ${res.status} ${res.statusText}`
        );
      }
      
      if (!data.isEnabled) {
        setError('AI Agent is disabled. Please enable it in the settings above.');
        setResponse(null);
      } else if (!data.response) {
        setError('No response received from the AI agent. Please check your API key.');
        console.error('Missing response in API data:', data);
      } else {
        setResponse(data.response);
        // Add AI response to conversation
        setConversation([...updatedConversation, {text: data.response, isUser: false}]);
      }
    } catch (err) {
      console.error('Error testing AI agent:', err);
      
      // More helpful error messages
      let errorMessage = 'Failed to test AI agent';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Check for common OpenAI API errors
      if (errorMessage.toLowerCase().includes('api key') || 
          errorMessage.toLowerCase().includes('authentication') ||
          errorMessage.toLowerCase().includes('invalid key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your .env.local file and restart the server.';
      } else if (errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later or use a different OpenAI API key.';
      }
      
      setError(errorMessage);
      setResponse(null);
    } finally {
      setLoading(false);
      setMessage(''); // Clear input after sending
    }
  };
  
  const handleReset = () => {
    setMessage('');
    setResponse(null);
    setError(null);
    setConversation([]);
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Agent Tester</h1>
      
      {/* AI Agent Configuration Component */}
      <AIAgentConfig />
      
      {/* Test Area */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Test Jane Smith - Real Estate Agent</h2>
        
        {/* Example Messages */}
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
        
        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
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
                className={`mb-3 p-3 rounded-lg ${
                  msg.isUser 
                    ? 'bg-purple-50 border-purple-100 ml-8' 
                    : 'bg-gray-50 border-gray-100 mr-8'
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-2 font-semibold">
                    {msg.isUser ? 'You:' : 'Jane:'}
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
              disabled={loading || !message.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
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