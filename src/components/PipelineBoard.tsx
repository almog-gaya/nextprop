'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  ChatBubbleLeftRightIcon, 
  ArrowPathIcon,
  EllipsisHorizontalIcon, 
  CalendarIcon,
  PencilIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  FunnelIcon,
  Bars4Icon,
  Squares2X2Icon,
  PlusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Opportunity {
  id: string;
  name: string;
  value: string;
  businessName?: string;
  stage: string;
  source?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  opportunities: Opportunity[];
  count: number;
  total: string;
}

interface PipelineData {
  id: string;
  name: string;
  stages: PipelineStage[];
  totalOpportunities: number;
}

// Sample data
const samplePipelines: PipelineData[] = [
  {
    id: '1',
    name: 'Pipeline',
    totalOpportunities: 1386,
    stages: [
      {
        id: 'voice-drop-sent',
        name: 'VoiceDrop Sent',
        count: 1297,
        total: '$0.00',
        opportunities: [
          { id: '1', name: 'Ben', value: '$0.00', stage: 'VoiceDrop Sent' },
          { id: '2', name: 'John', value: '$0.00', stage: 'VoiceDrop Sent' },
          { id: '3', name: 'Jaime Munoz', value: '$0.00', stage: 'VoiceDrop Sent', source: 'Try The Autopilot Real Estate' },
          { id: '4', name: 'Assaf', value: '$0.00', stage: 'VoiceDrop Sent' },
          { id: '5', name: 'Gabriel Garcia', value: '$0.00', stage: 'VoiceDrop Sent', source: 'Accelerate Deal Flow &' }
        ]
      },
      {
        id: 'returned-sms',
        name: 'Returned SMS',
        count: 26,
        total: '$0.00',
        opportunities: [
          { id: '6', name: '', value: '$0.00', stage: 'Returned SMS' },
          { id: '7', name: '', value: '$0.00', stage: 'Returned SMS' },
          { id: '8', name: 'Or Yarimi', value: '$0.00', stage: 'Returned SMS' },
          { id: '9', name: '', value: '$0.00', stage: 'Returned SMS' },
          { id: '10', name: 'Joseph McCallay', value: '$0.00', stage: 'Returned SMS', businessName: 'Latchel' }
        ]
      },
      {
        id: 'returned-call',
        name: 'Returned Call',
        count: 31,
        total: '$0.00',
        opportunities: [
          { id: '11', name: 'no-answer', value: '$0.00', stage: 'Returned Call' },
          { id: '12', name: 'completed', value: '$0.00', stage: 'Returned Call' },
          { id: '13', name: 'Wesley Edwards - completed', value: '$0.00', stage: 'Returned Call' },
          { id: '14', name: 'Trent', value: '$0.00', stage: 'Returned Call', source: 'fb' },
          { id: '15', name: 'Mike', value: '$0.00', stage: 'Returned Call', source: 'fb' }
        ]
      },
      {
        id: 'call-transferred',
        name: 'Call Transferred',
        count: 23,
        total: '$0.00',
        opportunities: [
          { id: '16', name: 'Call Back', value: '$0.00', stage: 'Call Transferred' },
          { id: '17', name: 'Call Back', value: '$0.00', stage: 'Call Transferred' },
          { id: '18', name: 'Call Back', value: '$0.00', stage: 'Call Transferred' },
          { id: '19', name: 'Call Back', value: '$0.00', stage: 'Call Transferred' },
          { id: '20', name: 'Call Back', value: '$0.00', stage: 'Call Transferred' },
          { id: '21', name: 'Amir Erez - Call Back', value: '$0.00', stage: 'Call Transferred' }
        ]
      },
      {
        id: 'lead-opted-out',
        name: 'Lead Opted Out',
        count: 5,
        total: '$0.00',
        opportunities: [
          { id: '22', name: 'Steven Hope - New SMS', value: '$0.00', stage: 'Lead Opted Out', businessName: 'Park Row Equity' },
          { id: '23', name: 'Rachel - New SMS', value: '$0.00', stage: 'Lead Opted Out' },
          { id: '24', name: 'Bill Price - New SMS', value: '$0.00', stage: 'Lead Opted Out', businessName: 'Bill Price Realty Group' },
          { id: '25', name: 'Kelly Price - New SMS', value: '$0.00', stage: 'Lead Opted Out', businessName: 'CIRE Equity' },
          { id: '26', name: 'Cody Ferrin - New SMS', value: '$0.00', stage: 'Lead Opted Out', businessName: 'Apex Real Estate' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Cold Outreach',
    totalOpportunities: 45,
    stages: [
      {
        id: 'new',
        name: 'New',
        count: 15,
        total: '$0.00',
        opportunities: [
          { id: '27', name: 'Michael Johnson', value: '$0.00', stage: 'New' },
          { id: '28', name: 'Sarah Williams', value: '$0.00', stage: 'New' }
        ]
      },
      {
        id: 'contacted',
        name: 'Contacted',
        count: 12,
        total: '$0.00',
        opportunities: [
          { id: '29', name: 'Chris Evans', value: '$0.00', stage: 'Contacted' },
          { id: '30', name: 'Jessica Parker', value: '$0.00', stage: 'Contacted' }
        ]
      },
      {
        id: 'meeting-scheduled',
        name: 'Meeting Scheduled',
        count: 8,
        total: '$0.00',
        opportunities: [
          { id: '31', name: 'David Miller', value: '$0.00', stage: 'Meeting Scheduled' }
        ]
      },
      {
        id: 'qualified',
        name: 'Qualified',
        count: 6,
        total: '$0.00',
        opportunities: [
          { id: '32', name: 'Emma Watson', value: '$0.00', stage: 'Qualified' }
        ]
      },
      {
        id: 'closed',
        name: 'Closed',
        count: 4,
        total: '$0.00',
        opportunities: [
          { id: '33', name: 'James Wilson', value: '$0.00', stage: 'Closed' }
        ]
      }
    ]
  }
];

export default function PipelineBoard() {
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineData>(samplePipelines[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handlePipelineChange = (pipeline: PipelineData) => {
    setSelectedPipeline(pipeline);
    setIsDropdownOpen(false);
  };

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
    return (
      <div className="bg-white mb-3 rounded-md shadow">
        <div className="p-3 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">{opportunity.name}</span>
            <button className="text-gray-400 hover:text-gray-600 rounded-full p-1">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          
          {opportunity.businessName && (
            <div className="text-sm mt-1">
              <span className="text-gray-500">Business Name:</span>
              <span className="ml-1">{opportunity.businessName}</span>
            </div>
          )}
          
          {opportunity.source && (
            <div className="text-sm mt-1">
              <span className="text-gray-500">Opportunity Source:</span>
              <span className="ml-1">{opportunity.source}</span>
            </div>
          )}
          
          <div className="text-sm mt-1">
            <span className="text-gray-500">Opportunity Value:</span>
            <span className="ml-1">{opportunity.value}</span>
          </div>
        </div>
        
        <div className="flex justify-around p-2">
          <button className="text-gray-500 hover:text-blue-600 p-1">
            <PhoneIcon className="h-4 w-4" />
          </button>
          <button className="text-gray-500 hover:text-blue-600 p-1">
            <EnvelopeIcon className="h-4 w-4" />
          </button>
          <button className="text-gray-500 hover:text-blue-600 p-1">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
          <button className="text-gray-500 hover:text-blue-600 p-1">
            <CalendarIcon className="h-4 w-4" />
          </button>
          <button className="text-gray-500 hover:text-blue-600 p-1">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button className="text-gray-500 hover:text-blue-600 p-1">
            <UserCircleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Header */}
      <div className="bg-white p-3 shadow mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 hover:bg-gray-50"
            >
              <span>{selectedPipeline.name}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1 z-10 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {samplePipelines.map(pipeline => (
                    <button
                      key={pipeline.id}
                      onClick={() => handlePipelineChange(pipeline)}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {pipeline.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <span className="text-blue-600 text-sm">{selectedPipeline.totalOpportunities} opportunities</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-gray-300 rounded p-1 text-gray-500 hover:bg-gray-50">
            <Squares2X2Icon className={`h-5 w-5 ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-500'}`} onClick={() => setViewMode('grid')} />
          </button>
          <button className="bg-white border border-gray-300 rounded p-1 text-gray-500 hover:bg-gray-50">
            <Bars4Icon className={`h-5 w-5 ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-500'}`} onClick={() => setViewMode('list')} />
          </button>
          <button className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 hover:bg-gray-50 flex items-center space-x-1">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 flex items-center space-x-1">
            <PlusIcon className="h-4 w-4" />
            <span>Add opportunity</span>
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button className="border-blue-500 text-blue-600 whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm">
              All
            </button>
            <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm">
              List
            </button>
          </nav>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Advanced Filters
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Sort (1)
          </button>
        </div>
        
        <div className="flex">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search Opportunities"
              className="border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button className="ml-2 bg-white border border-gray-300 rounded px-3 py-2 text-gray-500 hover:bg-gray-50">
            Manage Fields
          </button>
        </div>
      </div>
      
      {/* Pipeline Board */}
      <div className="flex overflow-x-auto space-x-4 pb-6">
        {selectedPipeline.stages.map(stage => (
          <div key={stage.id} className="min-w-[250px] max-w-[250px] bg-gray-100 rounded-md">
            <div className="p-3 border-b border-gray-200 bg-white rounded-t-md">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">{stage.name}</h3>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">${stage.count}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{stage.total}</div>
            </div>
            
            <div className="p-2 overflow-y-auto max-h-[calc(100vh-240px)]">
              {stage.opportunities.map(opportunity => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 