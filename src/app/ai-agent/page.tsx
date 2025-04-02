'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AIAgentConfig from '@/components/ai-agent/AIAgentConfig';
// import AIAgentDebug from '@/components/ai-agent/AIAgentDebug';

export default function AIAgentPage() {
  return (
    <DashboardLayout title="AI Agent">
      <div className="container mx-auto px-4 py-8">
        <AIAgentConfig />
        {/* <AIAgentDebug /> */}
      </div>
    </DashboardLayout>
  );
} 