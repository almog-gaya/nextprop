'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AIAgentConfig, { triggerConfigRefresh } from '@/components/ai-agent/AIAgentConfig';
import AIAgentDashboard from '@/components/ai-agent/AIAgentDashboard';
import MultiAgentSelector from '@/components/ai-agent/MultiAgentSelector';
import { useAuth } from '@/contexts/AuthContext';
import { saveAIAgentConfig, updateAgentConfig } from '@/lib/ai-agent';
import { toast } from 'react-hot-toast';
import type { AIAgentConfig as AIAgentConfigType } from '@/types/ai-agent';
import { isWorkflowExists } from '@/lib/ghl-service';

// Tab types for better type safety
type TabType = 'dashboard' | 'goals' | 'testing' | 'training' | 'settings';

// We can't export metadata directly from client components,
// but layout.tsx handles this for us now

export default function AIAgentPage() {
  const { user } = useAuth();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AIAgentConfigType | null>(null);
  
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };

  const handleSave = async () => {
    console.log('handleSave');
    if (!user?.id || !currentConfig || !selectedAgentId) {
      toast.error('User not authenticated or config not loaded');
      return;
    }

    // Safe check for phoneNumbers
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
      const isUnselectedAll = currentConfig.enabledPipelines.length === 0;
      // if all is unselected then delete the workflow
      if (isUnselectedAll) {
        const currentWorkFlowId = await getCurrentWorkflowId();
        if (currentWorkFlowId) {
          await deleteWorkFlow(currentWorkFlowId);
        }
      } 

      // Save to multi-agent config
      const { updateAgentConfig } = await import('@/lib/ai-agent');
      await updateAgentConfig(user.id, selectedAgentId, currentConfig);

      // Also save to local storage for backward compatibility
      await saveAIAgentConfig(currentConfig);

      // Sync with server
      await syncConfigWithServer(currentConfig);

      toast.success('AI Agent configuration saved successfully');
      triggerConfigRefresh();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  }; 
  const showToast = (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right', 
    });
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
  
  return (
    <DashboardLayout title="AI Agent">
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[var(--nextprop-border)]">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'goals', label: 'Bot Goals' },
              { key: 'testing', label: 'Bot Testing' },
              { key: 'training', label: 'Bot Training' },
              { key: 'settings', label: 'Bot Settings' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`
                  py-4 px-1 text-sm font-medium border-b-2 whitespace-nowrap
                  ${activeTab === tab.key
                    ? 'border-[var(--nextprop-primary)] text-[var(--nextprop-primary)]'
                    : 'border-transparent text-[var(--nextprop-text-secondary)] hover:text-[var(--nextprop-text-primary)] hover:border-[var(--nextprop-border)]'
                  }
                `}
                aria-current={activeTab === tab.key ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            <div className="mb-6">
              <MultiAgentSelector onAgentSelect={handleAgentSelect} showAddAgent={true} />
            </div>
            {selectedAgentId && (
              <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-6 shadow-sm">
                <AIAgentDashboard />
              </div>
            )}
          </>
        )}

        {/* Bot Goals View */}
        {activeTab === 'goals' && selectedAgentId && (
          <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-6 shadow-sm">
            <AIAgentConfig 
              selectedAgentId={selectedAgentId} 
              activeSection="dealObjective" 
              hideContainer={true} 
              onConfigChange={setCurrentConfig}
            />
            <AIAgentConfig 
              selectedAgentId={selectedAgentId} 
              activeSection="buyingCriteria" 
              hideContainer={true} 
              onConfigChange={setCurrentConfig}
            />
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--nextprop-primary)] text-white rounded-lg hover:bg-[var(--nextprop-primary-dark)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Bot Testing View */}
        {activeTab === 'testing' && selectedAgentId && (
          <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-6 shadow-sm">
            <AIAgentConfig 
              selectedAgentId={selectedAgentId} 
              activeSection="testing" 
              hideContainer={true} 
              onConfigChange={setCurrentConfig}
            />
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--nextprop-primary)] text-white rounded-lg hover:bg-[var(--nextprop-primary-dark)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Bot Training View */}
        {activeTab === 'training' && selectedAgentId && (
          <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-6 shadow-sm">
            <AIAgentConfig 
              selectedAgentId={selectedAgentId} 
              activeSection="qa" 
              hideContainer={true} 
              onConfigChange={setCurrentConfig}
            />
            <AIAgentConfig 
              selectedAgentId={selectedAgentId} 
              activeSection="rules" 
              hideContainer={true} 
              onConfigChange={setCurrentConfig}
            />
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--nextprop-primary)] text-white rounded-lg hover:bg-[var(--nextprop-primary-dark)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Bot Settings View */}
        {activeTab === 'settings' && selectedAgentId && (
          <div className="bg-[var(--nextprop-surface)] rounded-lg border border-[var(--nextprop-border)] p-6 shadow-sm">
            <div className="mb-10">
              <AIAgentConfig 
                selectedAgentId={selectedAgentId} 
                activeSection="identity" 
                hideContainer={true} 
                onConfigChange={setCurrentConfig}
              />
            </div>
            
            <div className="mb-10">
              <AIAgentConfig 
                selectedAgentId={selectedAgentId} 
                activeSection="company" 
                hideContainer={true} 
                onConfigChange={setCurrentConfig}
              />
            </div>
            
            <div className="mb-10">
              <AIAgentConfig 
                selectedAgentId={selectedAgentId} 
                activeSection="pipeline" 
                hideContainer={true} 
                onConfigChange={setCurrentConfig}
              />
            </div>
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[var(--nextprop-primary)] text-white rounded-lg hover:bg-[var(--nextprop-primary-dark)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 