
'use client';

import React from 'react';
import { Squares2X2Icon, Bars4Icon } from '@heroicons/react/24/outline';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export default function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="flex border border-gray-200 rounded-md overflow-hidden">
      <button
        className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-purple-600' : 'bg-white text-gray-500'}`}
        onClick={() => setViewMode('grid')}
      >
        <Squares2X2Icon className="h-5 w-5" />
      </button>
      <button
        className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-purple-600' : 'bg-white text-gray-500'}`}
        onClick={() => setViewMode('list')}
      >
        <Bars4Icon className="h-5 w-5" />
      </button>
    </div>
  );
}