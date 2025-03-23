'use client';

import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { PipelineData } from '../../types/dashboard'
import { Dropdown } from '../ui/dropdown'

interface PipelineSelectorProps {
  pipelines: PipelineData[];
  selectedPipeline: string | null;
  handlePipelineChange: (pipelineId: string) => void;
}

export default function PipelineSelector({
  pipelines,
  selectedPipeline,
  handlePipelineChange,
}: PipelineSelectorProps) {
  const options = pipelines.map(pipeline => ({
    value: pipeline.id,
    label: pipeline.name
  }))

  return (
    <Dropdown
      value={selectedPipeline || ''}
      onChange={handlePipelineChange}
      options={options}
      placeholder="Select Pipeline"
      width="md"
      className="font-medium"
    />
  )
}