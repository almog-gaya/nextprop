import React from 'react';
import Image from 'next/image';
import { ChevronDownIcon, PlusIcon, Squares2X2Icon, Bars4Icon } from '@heroicons/react/24/outline';
import { CircleArrowDown, DownloadIcon, ExpandIcon, Minimize, Minimize2, Minimize2Icon, MinimizeIcon, PlusCircle, UserRoundPlusIcon } from 'lucide-react';

interface LeadsTopBarProps {
  totalLeads: number;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  pipelineDropdown: React.ReactNode;
  sortingDropdown: React.ReactNode;
}

export default function LeadsTopBar({
  totalLeads,
  viewMode,
  setViewMode,
  pipelineDropdown,
  sortingDropdown,
}: LeadsTopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      {/* Left: Icon, Title, Count */}
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <Image src="/leads.png" alt="Leads" width={40} height={40} />
        </div>
        <span className="text-lg font-semibold text-gray-900">Leads</span>
        <span className="text-base font-medium text-gray-500">({totalLeads})</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
       
        {/* Pipeline Dropdown (existing logic) */}
        {pipelineDropdown}

        {/* Grid/List Toggle (updated UI) */}
        <div className="flex items-center bg-[#F4F6FA] rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors duration-150 ${viewMode === 'grid' ? 'bg-[#2643FF] text-white' : 'bg-transparent text-black'}`}
          >
            <Squares2X2Icon className={`h-5 w-5 ${viewMode === 'grid' ? 'text-white' : 'text-black'}`} />
            <span className="font-medium">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors duration-150 ${viewMode === 'list' ? 'bg-[#2643FF] text-white' : 'bg-transparent text-black'}`}
          >
            <Bars4Icon className={`h-5 w-5 ${viewMode === 'list' ? 'text-white' : 'text-black'}`} />
            <span className="font-medium">List</span>
          </button>
        </div>

        {/* Sorting Dropdown (existing logic) */}
        {sortingDropdown}

        {/* Add Lead Button (UI only) */}
        <button className="bg-[#A020F0] hover:bg-[#7c16c4] text-white font-medium rounded-lg px-2 py-1.5 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 " />
          Add Lead
        </button>

        {/* Last four items (UI only, placeholders) */}
        <button className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
        <ExpandIcon className="h-5 w-5 text-black" />
        </button>
        <button className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
        <MinimizeIcon className="h-5 w-5 text-black" />
           </button>
        <button className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
        <CircleArrowDown className="h-5 w-5 text-black" />
        </button>
      </div>
    </div>
  );
} 