'use client';

import React, { useState, ReactNode } from 'react';
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
import SortableOpportunityRow from './SortableOpportunityRow';

interface Opportunity {
  id: string;
  name: string;
  value: string;
  businessName?: string;
  stage: string;
  source?: string;
  lastActivity?: string;
  lastActivityType?: 'voicemail' | 'sms' | 'call' | 'email' | 'optout';
}

interface PipelineStage {
  id: string;
  name: string;
  opportunities: Opportunity[];
  count: number;
  total: string;
}

interface OpportunityListProps {
  opportunities: PipelineStage[];
  getProcessedOpportunities: (stageId: string) => Opportunity[];
  handleCommunication: (opportunityId: string, actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
  handleEditOpportunity: (opportunity: Opportunity) => void;
  handleMoveOpportunity: (opportunityId: string, targetStageId: string) => Promise<void>;
  loadingOpportunityId: string | null;
}

interface StageDroppableAreaProps {
  id: string;
  children: ReactNode;
}

function StageDroppableArea({ id, children }: StageDroppableAreaProps) {
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
      className={`${isOver ? 'bg-blue-50' : ''} transition-colors w-full h-full min-h-[40px] relative`}
    >
      {children}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}></div>
    </div>
  );
}

export default function OpportunityList({
  opportunities,
  getProcessedOpportunities,
  handleCommunication,
  handleEditOpportunity,
  handleMoveOpportunity,
  loadingOpportunityId,
}: OpportunityListProps) {
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);

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
    
    for (const stage of opportunities) {
      const foundOpportunity = getProcessedOpportunities(stage.id).find(opp => opp.id === opportunityId);
      if (foundOpportunity) {
        setActiveOpportunity(foundOpportunity);
        setActiveStage(stage.id);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const isStageOrOpportunity = 
        (over.data?.current?.type === 'stage') || 
        (over.data?.current?.type === 'opportunity');

    if (isStageOrOpportunity) {
      if (over.data?.current?.type === 'opportunity') {
        const opportunityData = over.data.current;
        const targetStageId = opportunityData.fromStage || opportunityData.stageId;
        console.log('Dropping on opportunity in stage:', targetStageId);
      } else {
        console.log('Dropping directly on stage:', over.id);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active || !activeStage) {
      setActiveOpportunity(null);
      setActiveStage(null);
      return;
    }

    const opportunityId = active.id as string;
    let targetStageId = over.id as string;
    
    if (over.data?.current?.type === 'opportunity') {
      targetStageId = over.data.current.fromStage || over.data.current.stageId;
    }
    
    if (targetStageId !== activeStage) {
      setActiveOpportunity(null);
      setActiveStage(null);
      await handleMoveOpportunity(opportunityId, targetStageId);
    } else {
      setActiveOpportunity(null);
      setActiveStage(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-lg shadow overflow-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-[5]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {opportunities.map((stage) => (
              <React.Fragment key={`stage-${stage.id}`}>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="px-6 py-2">
                    <StageDroppableArea id={stage.id}>
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">{stage.name}</h4>
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {stage.count}
                        </span>
                      </div>
                    </StageDroppableArea>
                  </td>
                </tr>
                {getProcessedOpportunities(stage.id).map((opportunity) => (
                  <SortableOpportunityRow
                    key={opportunity.id}
                    opportunity={opportunity}
                    stageId={stage.id}
                    stageName={stage.name}
                    handleCommunication={handleCommunication}
                    handleEditOpportunity={handleEditOpportunity}
                    isLoading={loadingOpportunityId === opportunity.id}
                  />
                ))}
                {getProcessedOpportunities(stage.id).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <StageDroppableArea id={stage.id}>
                        <div className="h-16 flex items-center justify-center text-gray-500">
                          Drop opportunities here
                        </div>
                      </StageDroppableArea>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {opportunities.flatMap((stage) => getProcessedOpportunities(stage.id)).length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No opportunities match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DragOverlay>
        {activeOpportunity && (
          <div className="bg-white shadow-lg border-2 border-blue-500 rounded-md p-2">
            <div className="text-sm font-medium">{activeOpportunity.name}</div>
            <div className="text-xs text-gray-500">{activeOpportunity.businessName || '-'}</div>
            <div className="text-xs">{activeOpportunity.value}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}