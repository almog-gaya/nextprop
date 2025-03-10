'use client';

import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface PipelineData {
  id: string;
  name: string;
  stages: any[];
  totalOpportunities: number;
}

interface PipelineSelectorProps {
  pipelines: PipelineData[];
  selectedPipeline: string | null;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  handlePipelineChange: (pipelineId: string) => void;
}

export default function PipelineSelector({
  pipelines,
  selectedPipeline,
  isDropdownOpen,
  setIsDropdownOpen,
  handlePipelineChange,
}: PipelineSelectorProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 font-medium text-gray-900"
      >
        <span className="text-xl">
          {selectedPipeline
            ? pipelines.find((p) => p.id === selectedPipeline)?.name || 'Select Pipeline'
            : 'Select Pipeline'}
        </span>
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      </button>

      {isDropdownOpen && pipelines.length > 0 && (
        <div className="absolute left-0 mt-2 z-20 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {pipelines.map((pipeline) => (
              <button
                key={pipeline.id}
                onClick={() => handlePipelineChange(pipeline.id)}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {pipeline.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}