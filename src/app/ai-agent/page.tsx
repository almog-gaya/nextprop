'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AIAgentConfig from '@/components/ai-agent/AIAgentConfig';
import MultiAgentSelector from '@/components/ai-agent/MultiAgentSelector';
import { useAuth } from '@/contexts/AuthContext';
import { updateAgentConfig } from '@/lib/ai-agent';
import { toast } from 'react-hot-toast';
import type { AIAgentConfig as AIAgentConfigType } from '@/types/ai-agent';

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
    if (!user || !selectedAgentId || !currentConfig) {
      toast.error('Please select an agent and make changes to save');
      return;
    }

    setIsSaving(true);
    try {
      await updateAgentConfig(user.id, selectedAgentId, currentConfig);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };
  
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
            <div className="">
              <MultiAgentSelector onAgentSelect={handleAgentSelect} showAddAgent={true} />
            </div>
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