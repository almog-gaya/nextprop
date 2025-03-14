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
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import OpportunityCard from './OpportunityCard';
import SortableOpportunityCard from './SortableOpportunityCard';

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

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  hasMore: boolean;
}

interface OpportunityGridProps {
  opportunities: PipelineStage[];
  getProcessedOpportunities: (stageId: string) => Opportunity[];
  handleCommunication: (opportunityId: string, type: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
  handleEditOpportunity: (Opportunity: Opportunity) => void;
  handleMoveOpportunity: (opportunityId: string, targetStageId: string) => Promise<void>;
  loadingOpportunityId: string | null;
  pagination: Record<string, PaginationState>;
  loadingStates: Record<string, boolean>;
}

interface DroppableStageProps {
  id: string;
  children: ReactNode;
  isEmpty?: boolean;
}

function DroppableStage({ id, children, isEmpty = false }: DroppableStageProps) {
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
      className={`p-2 flex-1 ${isOver ? 'bg-blue-50' : ''} relative`}
    >
      <div className={`min-h-[100px] ${isEmpty ? 'h-full' : ''}`}>
        {children}
      </div>
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}></div>
    </div>
  );
}

export default function OpportunityGrid({
  opportunities,
  getProcessedOpportunities,
  handleCommunication,
  handleEditOpportunity,
  handleMoveOpportunity,
  loadingOpportunityId,
  pagination,
  loadingStates,
}: OpportunityGridProps) {
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);

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
        const targetStageId = opportunityData.fromStage;
        console.log('Dropping on opportunity in stage:', targetStageId);
      } else {
        console.log('Dropping directly on stage:', over.id);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) {
      setActiveOpportunity(null);
      return;
    }

    const opportunityId = active.id as string;
    let targetStageId = over.id as string;

    if (over.data?.current?.type === 'opportunity') {
      targetStageId = over.data.current.fromStage;
    }

    let currentStageId = null;
    for (const stage of opportunities) {
      if (getProcessedOpportunities(stage.id).some(opp => opp.id === opportunityId)) {
        currentStageId = stage.id;
        break;
      }
    }

    if (currentStageId && currentStageId !== targetStageId) {
      setActiveOpportunity(null);
      await handleMoveOpportunity(opportunityId, targetStageId);
    } else {
      setActiveOpportunity(null);
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
      <div className="flex overflow-x-auto pb-4 space-x-4 h-full">
        {opportunities.map((stage) => (
          <div
            key={stage.id}
            className="bg-white rounded-md shadow-sm border border-gray-200 flex flex-col min-w-[300px] h-full"
          >
            <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-[5]">
              <h3 className="font-medium text-gray-900 truncate">{stage.name}</h3>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {stage.count}
              </span>
            </div>
            <DroppableStage
              id={stage.id}
              isEmpty={getProcessedOpportunities(stage.id).length === 0}
            >
              <div className="flex-1 overflow-auto max-h-[500px]">
                <SortableContext items={getProcessedOpportunities(stage.id).map(opp => opp.id)} strategy={rectSortingStrategy}>
                  {getProcessedOpportunities(stage.id).map((opportunity) => (
                    <SortableOpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      handleCommunication={handleCommunication}
                      handleEditOpportunity={handleEditOpportunity}
                      isLoading={loadingOpportunityId === opportunity.id}
                    />
                  ))}
                </SortableContext>
                {getProcessedOpportunities(stage.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500 h-full flex items-center justify-center">
                    <p>No leads in this stage</p>
                  </div>
                )}
                <div id={`load-more-${stage.id}`} className="h-10">
                  {loadingStates?.[stage.id] && pagination?.[stage.id]?.hasMore && (
                    <div className="text-center text-gray-500 py-2">Loading more...</div>
                  )}
                </div>
              </div>
            </DroppableStage>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeOpportunity ? (
          <OpportunityCard
            opportunity={activeOpportunity}
            handleCommunication={handleCommunication}
            handleEditOpportunity={handleEditOpportunity}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}