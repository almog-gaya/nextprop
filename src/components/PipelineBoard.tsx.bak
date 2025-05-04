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
import { IconButton } from '@/components/ui/iconButton';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  rectIntersection
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';

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

const DroppableStage = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'stage',
      id
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-2 overflow-y-auto max-h-[calc(100vh-240px)] ${isOver ? 'bg-blue-50' : ''}`}
    >
      {children}
    </div>
  );
};

const SortableOpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: opportunity.id,
    data: {
      type: 'opportunity',
      opportunity,
      fromStage: opportunity.stage
    }
  });

  const handleNameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/contacts/${opportunity.id}`);
  };

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white mb-3 rounded-md shadow group"
    >
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <a 
            onClick={handleNameClick}
            className="font-medium text-gray-800 hover:text-purple-600 hover:underline transition-colors duration-200 text-left cursor-pointer z-10"
          >
            {opportunity.name}
          </a>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 rounded-full p-1">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
            <div 
              {...attributes} 
              {...listeners}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-move"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {opportunity.businessName && (
          <div className="text-sm mt-1">
            <span className="text-gray-500">Business Name:</span>
            <span className="ml-1">{opportunity.businessName}</span>
          </div>
        )}
        
        {opportunity.source && (
          <div className="text-sm mt-1">
            <span className="text-gray-500">Lead Source:</span>
            <span className="ml-1">{opportunity.source}</span>
          </div>
        )}
        
        <div className="text-sm mt-1">
          <span className="text-gray-500">Lead Value:</span>
          <span className="ml-1">{opportunity.value}</span>
        </div>
      </div>
      
      <div className="flex justify-around p-2">
        <IconButton
          icon={<PhoneIcon className="h-4 w-4" />}
          tooltip="Call contact"
        />
        <IconButton
          icon={<EnvelopeIcon className="h-4 w-4" />}
          tooltip="Send email"
        />
        <IconButton
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          tooltip="Send SMS"
        />
        <IconButton
          icon={<CalendarIcon className="h-4 w-4" />}
          tooltip="Schedule"
        />
        <IconButton
          icon={<PencilIcon className="h-4 w-4" />}
          tooltip="Edit opportunity"
        />
        <IconButton
          icon={<UserCircleIcon className="h-4 w-4" />}
          tooltip="View contact"
        />
      </div>
    </div>
  );
};

export default function PipelineBoard() {
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineData>(samplePipelines[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const router = useRouter();

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunityId = active.id as string;

    for (const stage of selectedPipeline.stages) {
      const foundOpportunity = stage.opportunities.find(opp => opp.id === opportunityId);
      if (foundOpportunity) {
        setActiveOpportunity(foundOpportunity);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveOpportunity(null);
      return;
    }

    const opportunityId = active.id as string;
    const targetStageId = over.id as string;

    // Update the pipeline stages (you can implement your own logic here)
    const updatedStages = selectedPipeline.stages.map(stage => {
      if (stage.id === targetStageId) {
        const opportunity = selectedPipeline.stages
          .flatMap(s => s.opportunities)
          .find(opp => opp.id === opportunityId);
        
        if (opportunity) {
          return {
            ...stage,
            opportunities: [...stage.opportunities, { ...opportunity, stage: stage.id }]
          };
        }
      }
      return {
        ...stage,
        opportunities: stage.opportunities.filter(opp => opp.id !== opportunityId)
      };
    });

    setSelectedPipeline({
      ...selectedPipeline,
      stages: updatedStages
    });
    setActiveOpportunity(null);
  };

  const handlePipelineChange = (pipeline: PipelineData) => {
    setSelectedPipeline(pipeline);
    setIsDropdownOpen(false);
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
          
          <span className="text-purple-600 text-sm">{selectedPipeline.totalOpportunities} leads</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-gray-300 rounded p-1 text-gray-500 hover:bg-gray-50">
            <Squares2X2Icon className={`h-5 w-5 ${viewMode === 'grid' ? 'text-purple-600' : 'text-gray-500'}`} onClick={() => setViewMode('grid')} />
          </button>
          <button className="bg-white border border-gray-300 rounded p-1 text-gray-500 hover:bg-gray-50">
            <Bars4Icon className={`h-5 w-5 ${viewMode === 'list' ? 'text-purple-600' : 'text-gray-500'}`} onClick={() => setViewMode('list')} />
          </button>
          <button className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 hover:bg-gray-50 flex items-center space-x-1">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button className="bg-purple-600 text-white rounded px-3 py-2 hover:bg-blue-700 flex items-center space-x-1">
            <PlusIcon className="h-4 w-4" />
            <span>Add lead</span>
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button className="border-blue-500 text-purple-600 whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm">
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
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
              
              <DroppableStage id={stage.id}>
                <SortableContext items={stage.opportunities.map(opp => opp.id)} strategy={rectSortingStrategy}>
                  {stage.opportunities.map(opportunity => (
                    <SortableOpportunityCard key={opportunity.id} opportunity={opportunity} />
                  ))}
                </SortableContext>
              </DroppableStage>
            </div>
          ))}
        </div>
        
        <DragOverlay>
          {activeOpportunity && (
            <div className="bg-white shadow-lg border-2 border-blue-500 rounded-md p-3">
              <div className="font-medium text-gray-800">{activeOpportunity.name}</div>
              {activeOpportunity.businessName && (
                <div className="text-sm text-gray-500">{activeOpportunity.businessName}</div>
              )}
              <div className="text-sm text-purple-600">{activeOpportunity.value}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 