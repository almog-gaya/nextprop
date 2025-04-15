'use client';

import DashboardLayout from '@/components/DashboardLayout';
import AIAgentConfig from '@/components/ai-agent/AIAgentConfig';
import MultiAgentSelector from '@/components/ai-agent/MultiAgentSelector';
import { useState } from 'react';

// We can't export metadata directly from client components,
// but layout.tsx handles this for us now

export default function AIAgentPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
  };
  
  return (
    <DashboardLayout title="AI Agent">
      <div className="container mx-auto px-4 py-8">
        {/* Multi-agent selector */}
        <MultiAgentSelector onAgentSelect={handleAgentSelect} showAddAgent={true} />
        
        {/* Agent configuration */}
        <AIAgentConfig selectedAgentId={selectedAgentId} />
      </div>
    </DashboardLayout>
  );
} 