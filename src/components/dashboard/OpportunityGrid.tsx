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
  closestCenter,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
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

interface OpportunityGridProps {
    opportunities: PipelineStage[];
    getProcessedOpportunities: (stageId: string) => Opportunity[];
    handleCommunication: (opportunityId: string, type: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
    handleEditOpportunity: (Opportunity: Opportunity) => void;
    handleMoveOpportunity: (opportunityId: string, targetStageId: string) => Promise<void>;
    loadingOpportunityId: string | null;
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
            className={`p-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar flex-1 ${
                isOver ? 'bg-blue-50' : ''
            } relative`}
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
    loadingOpportunityId
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
        
        // Find the opportunity being dragged
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
        
        // Make sure we have a valid drop target
        // Accept drops on stages or individual opportunities
        const isStageOrOpportunity = 
            (over.data?.current?.type === 'stage') || 
            (over.data?.current?.type === 'opportunity');

        // If dropping on an opportunity, find its stage
        if (isStageOrOpportunity) {
            if (over.data?.current?.type === 'opportunity') {
                const opportunityData = over.data.current;
                const targetStageId = opportunityData.fromStage;
                
                // Log that we're dropping on an opportunity in a specific stage
                console.log('Dropping on opportunity in stage:', targetStageId);
            } else {
                // We're dropping directly on a stage
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
        
        // If we're dropping on another opportunity, get its stage
        if (over.data?.current?.type === 'opportunity') {
            targetStageId = over.data.current.fromStage;
        }
        
        // Find the current stage of the opportunity
        let currentStageId = null;
        for (const stage of opportunities) {
            if (getProcessedOpportunities(stage.id).some(opp => opp.id === opportunityId)) {
                currentStageId = stage.id;
                break;
            }
        }

        // Only proceed if the opportunity is moving to a different stage
        if (currentStageId && currentStageId !== targetStageId) {
            setActiveOpportunity(null); // Clear the active opportunity before moving
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
            <div className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {opportunities.map((stage) => (
                        <div
                            key={stage.id}
                            className="bg-white rounded-md shadow-sm border border-gray-200 flex flex-col"
                        >
                            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-medium text-gray-900 truncate">{stage.name}</h3>
                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {getProcessedOpportunities(stage.id).length}
                                </span>
                            </div>
                            <DroppableStage 
                                id={stage.id} 
                                isEmpty={getProcessedOpportunities(stage.id).length === 0}
                            >
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
                                        <p>No opportunities in this stage</p>
                                    </div>
                                )}
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
            </div>
        </DndContext>
    );
}