'use client';

import React from 'react';
import { Dropdown } from '../ui/dropdown';

interface Stage {
  id: string;
  name: string;
}

interface StageSelectorProps {
  stages: Stage[];
  selectedStage: string | null;
  handleStageChange: (stageId: string) => void;
  disabled: boolean;
}

export default function StageSelector({
  stages,
  selectedStage,
  handleStageChange,
  disabled = false,
}: StageSelectorProps) {
  const options = [
    { value: 'all', label: 'All Stages' },
    ...stages.map(stage => ({
      value: stage.id,
      label: stage.name
    }))
  ];

  return (
    <div className="w-full max-w-md">
      <Dropdown
        value={selectedStage || 'all'}
        onChange={handleStageChange}
        options={options}
        placeholder="Select Stage"
        width="full"
        className="font-medium"
        disabled={disabled}
      />
    </div>
  );
} 