'use client';

import React from 'react';
import { Dropdown } from '../ui/dropdown';

export interface Stage {
  id: string;
  name: string;
}

interface StageSelectorProps {
  stages: Stage[];
  selectedStage: Stage | null;
  handleStageChange: (stage: any) => void;
  disabled: boolean;
}

export default function StageSelector({
  stages,
  selectedStage,
  handleStageChange,
  disabled = false,
}: StageSelectorProps) {
  const options = [ 
    {value: 'all', label: 'All'},
    ...stages.map(stage => ({
      value: stage.id,
      label: stage.name
    }))
  ];

  return (
    <div className="w-full max-w-md">
      <Dropdown
        value={selectedStage?.id || 'all'}
        onChange={(value) => {
          const selected = stages.find(stage => stage.id === value);
          handleStageChange(selected ?? 'all');
        }
        }
        options={options}
        placeholder="Select Stage"
        width="full"
        className="font-medium"
        disabled={disabled}
      />
    </div>
  );
} 