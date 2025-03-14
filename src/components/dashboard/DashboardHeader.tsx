'use client';

import React from 'react';
import PipelineSelector from './PipelineSelector';
import ViewToggle from './ViewToggel';
import {  PlusIcon } from '@heroicons/react/24/outline';

interface PipelineData {
  id: string;
  name: string;
  stages: any[];
  totalOpportunities: number;
}

interface DashboardHeaderProps {
  pipelines: PipelineData[];
  selectedPipeline: string | null;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  handlePipelineChange: (pipelineId: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  apiConfigured: boolean;
  setNotification: (notification: { message: string; type: string }) => void;
  setNotificationActive: (active: boolean) => void;
  handleCommunication: (opportunityId: string, actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
}

export default function DashboardHeader({
  pipelines,
  selectedPipeline,
  isDropdownOpen,
  setIsDropdownOpen,
  handlePipelineChange,
  viewMode,
  setViewMode,
  apiConfigured,
  setNotification,
  setNotificationActive,
  handleCommunication,
}: DashboardHeaderProps) {
  const handleAddOpportunity = async () => {
    if (!apiConfigured) {
      setNotification({
        message: 'API not configured. Cannot create opportunities yet.',
        type: 'error',
      });
      setNotificationActive(true);
      return;
    }

    try {
      const response = await fetch('/api/opportunities/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipelineId: selectedPipeline,
          stageId: 'voice-drop-sent',
        }),
      });

      if (response.ok) {
        const newOpportunity = await response.json();
        if (newOpportunity) {
          handleCommunication(newOpportunity.id, 'voicemail');
        }
      } else {
        setNotification({
          message: 'Failed to create opportunity. Please try again.',
          type: 'error',
        });
        setNotificationActive(true);
      }
    } catch (err) {
      console.error('Error creating opportunity:', err);
      setNotification({
        message: 'Failed to create opportunity. Please try again.',
        type: 'error',
      });
      setNotificationActive(true);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PipelineSelector
            pipelines={pipelines}
            selectedPipeline={selectedPipeline}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            handlePipelineChange={handlePipelineChange}
          />
          <span className="ml-3 text-purple-600 font-medium">
            {selectedPipeline
              ? (pipelines.find((p) => p.id === selectedPipeline)?.totalOpportunities || 0) +
                ' leads'
              : '0 leads'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
    </div>
  );
}