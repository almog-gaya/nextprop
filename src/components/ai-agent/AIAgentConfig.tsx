import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { AIAgentConfig as AIAgentConfigType } from '@/types/ai-agent';
import { saveAIAgentConfig, loadAIAgentConfig } from '@/lib/ai-agent';
import toast from 'react-hot-toast';

export default function AIAgentConfig() {
  const [config, setConfig] = useState<AIAgentConfigType>({
    isEnabled: false,
    tone: 'friendly',
    length: 'medium',
    customInstructions: '',
    updatedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await loadAIAgentConfig();
      setConfig(savedConfig);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setConfig(prev => ({ ...prev, isEnabled: checked }));
  };

  const handleToneChange = (tone: AIAgentConfigType['tone']) => {
    setConfig(prev => ({ ...prev, tone }));
  };

  const handleLengthChange = (length: AIAgentConfigType['length']) => {
    setConfig(prev => ({ ...prev, length }));
  };

  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(prev => ({ ...prev, customInstructions: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAIAgentConfig(config);
      toast.success('AI Agent configuration saved successfully');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BoltIcon className="h-8 w-8 text-purple-600" />
        <h1 className="text-2xl font-semibold text-gray-900">AI Agent Configuration</h1>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Enable AI Agent</h3>
            <p className="text-sm text-gray-500">Allow the AI agent to automatically respond to messages</p>
          </div>
          <Switch
            checked={config.isEnabled}
            onChange={handleToggle}
            className={`${
              config.isEnabled ? 'bg-purple-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                config.isEnabled ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>

      {/* Response Tone */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Tone</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['friendly', 'professional', 'casual'] as const).map((tone) => (
            <button
              key={tone}
              onClick={() => handleToneChange(tone)}
              className={`px-4 py-2 rounded-lg border ${
                config.tone === tone
                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                  : 'border-gray-200 text-gray-700 hover:border-purple-200'
              }`}
            >
              {tone.charAt(0).toUpperCase() + tone.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Response Length */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Length</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['short', 'medium', 'long'] as const).map((length) => (
            <button
              key={length}
              onClick={() => handleLengthChange(length)}
              className={`px-4 py-2 rounded-lg border ${
                config.length === length
                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                  : 'border-gray-200 text-gray-700 hover:border-purple-200'
              }`}
            >
              {length.charAt(0).toUpperCase() + length.slice(1)}
            </button>
          ))}
        </div>
      </div>


      {/* Save Button */}
      <div className="flex justify-end">
        <button
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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