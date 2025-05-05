import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
  animate?: boolean;
  statusText?: string;
}

export default function ProgressBar({
  progress,
  label,
  color = 'var(--nextprop-primary)', // Use CSS variable
  height = 8,
  showPercentage = true,
  animate = true,
  statusText
}: ProgressBarProps) {
  // Ensure progress is between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-medium text-gray-700">{label}</div>
          {showPercentage && (
            <div className="text-sm font-medium text-gray-500">{Math.round(clampedProgress)}%</div>
          )}
        </div>
      )}
      
      <div 
        className="w-full bg-gray-200 rounded-full overflow-hidden" 
        style={{ height: `${height}px` }}
      >
        <div 
          className={`${animate ? 'transition-all duration-300 ease-out' : ''}`}
          style={{ 
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: color,
          }}
        />
      </div>
      
      {statusText && (
        <div className="mt-1 text-xs text-gray-500">{statusText}</div>
      )}
    </div>
  );
} 