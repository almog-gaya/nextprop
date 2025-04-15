'use client';

import React, { useState, useEffect } from 'react';
import { UserIcon, HomeIcon, ClipboardIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { MultiAgentConfig, AgentTemplate, AGENT_TEMPLATES } from '@/types/ai-agent';
import { 
  getMultiAgentConfig, 
  setActiveAgent, 
  createAgentFromTemplate, 
  deleteAgent,
} from '@/lib/ai-agent';
import { triggerConfigRefresh } from './AIAgentConfig';
import toast from 'react-hot-toast';

// Get icon component by name
const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'UserIcon':
      return <UserIcon className="w-5 h-5" />;
    case 'HomeIcon':
      return <HomeIcon className="w-5 h-5" />;
    case 'ClipboardIcon':
      return <ClipboardIcon className="w-5 h-5" />;
    default:
      return <UserIcon className="w-5 h-5" />;
  }
};

interface MultiAgentSelectorProps {
  onAgentSelect: (agentId: string) => void;
}

export default function MultiAgentSelector({ onAgentSelect }: MultiAgentSelectorProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<MultiAgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isDeletingAgent, setIsDeletingAgent] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConfig();
    }
  }, [user?.id]);

  const loadConfig = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const multiAgentConfig = await getMultiAgentConfig(user.id);
      setConfig(multiAgentConfig);
      
      // If an active agent is set, notify the parent component
      if (multiAgentConfig.activeAgentId) {
        onAgentSelect(multiAgentConfig.activeAgentId);
      }
    } catch (error) {
      console.error('Error loading multi-agent config:', error);
      toast.error('Failed to load agent configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAgent = async (agentId: string) => {
    if (!user?.id) return;
    
    try {
      // Update the active agent in the database
      await setActiveAgent(user.id, agentId);
      
      // Update the local state
      setConfig(prev => prev ? {
        ...prev,
        activeAgentId: agentId
      } : null);
      
      // Notify parent component
      onAgentSelect(agentId);
      
      // Trigger refresh
      triggerConfigRefresh();
      
      toast.success('Agent switched successfully');
    } catch (error) {
      console.error('Error selecting agent:', error);
      toast.error('Failed to switch agent');
    }
  };

  const handleCreateAgent = async (templateId: string) => {
    if (!user?.id) return;
    
    try {
      setIsCreatingAgent(true);
      
      // Create a new agent from the template
      const newAgentId = await createAgentFromTemplate(user.id, templateId);
      
      if (!newAgentId) {
        throw new Error('Failed to create agent');
      }
      
      // Reload the configuration
      await loadConfig();
      
      // Select the new agent
      await handleSelectAgent(newAgentId);
      
      toast.success('New agent created successfully');
      setShowTemplates(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!user?.id) return;
    
    try {
      setIsDeletingAgent(agentId);
      
      // Delete the agent
      await deleteAgent(user.id, agentId);
      
      // Reload the configuration
      await loadConfig();
      
      toast.success('Agent deleted successfully');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setIsDeletingAgent(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--nextprop-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-4 shadow-sm">
        {/* <h3 className="text-lg font-semibold text-[var(--nextprop-text-primary)] mb-4">
          AI Agents
        </h3> */}
        
        <div className="flex flex-wrap gap-2">
          {/* Existing agents */}
          {config && Object.entries(config.agents).map(([agentId, agent]) => (
            <div 
              key={agentId}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${
                config.activeAgentId === agentId
                  ? 'bg-[var(--nextprop-primary)] text-white'
                  : 'bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-primary)] hover:bg-[var(--nextprop-primary-light)]/10'
              }`}
              onClick={() => handleSelectAgent(agentId)}
            >
              <div className="flex-shrink-0">
                {getIconComponent(agent.template ? AGENT_TEMPLATES.find(t => t.id === agent.template)?.icon : undefined)}
              </div>
              <span className="font-medium">
                {agent.name || 'Unnamed Agent'}
              </span>
              {config.activeAgentId === agentId && (
                <CheckIcon className="w-4 h-4 ml-1" />
              )}
              
              {/* Delete button (only show if not active and we have more than one agent) */}
              {Object.keys(config.agents).length > 1 && config.activeAgentId !== agentId && (
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAgent(agentId);
                  }}
                >
                  {isDeletingAgent === agentId ? (
                    <div className="animate-spin h-3 w-3 border-b border-white rounded-full" />
                  ) : (
                    <span className="text-xs">×</span>
                  )}
                </button>
              )}
            </div>
          ))}
          
          {/* Add agent button */}
          {(!config || Object.keys(config.agents).length < 3) && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-primary)] hover:bg-[var(--nextprop-primary-light)]/10 border border-dashed border-[var(--nextprop-border)]"
              onClick={() => setShowTemplates(true)}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Agent</span>
            </button>
          )}
        </div>
        
        {/* Template selection when adding new agent */}
        {showTemplates && (
          <div className="mt-4 p-4 bg-[var(--nextprop-surface-hover)] rounded-lg border border-[var(--nextprop-border)]">
            <h4 className="font-medium text-[var(--nextprop-text-primary)] mb-3">
              Select Agent Template
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AGENT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="p-3 bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] hover:border-[var(--nextprop-primary)] cursor-pointer transition-colors"
                  onClick={() => handleCreateAgent(template.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-md bg-[var(--nextprop-primary-light)]/10 text-[var(--nextprop-primary)]">
                      {getIconComponent(template.icon)}
                    </div>
                    <h5 className="font-medium">{template.name}</h5>
                  </div>
                  <p className="text-sm text-[var(--nextprop-text-tertiary)]">
                    {template.description}
                  </p>
                  
                  {isCreatingAgent && (
                    <div className="mt-2 flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--nextprop-primary)]"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex justify-end">
              <button
                className="px-3 py-1 text-sm text-[var(--nextprop-text-tertiary)] hover:text-[var(--nextprop-text-primary)]"
                onClick={() => setShowTemplates(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 