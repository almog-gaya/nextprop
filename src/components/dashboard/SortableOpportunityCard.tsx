'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import OpportunityCard from './OpportunityCard';
import { GripVertical } from 'lucide-react';

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

interface SortableOpportunityCardProps {
    opportunity: Opportunity;
    handleCommunication: (opportunityId: string, type: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
    handleEditOpportunity: (opportunity: Opportunity) => void;
    isLoading?: boolean;
}

export default function SortableOpportunityCard({
    opportunity,
    handleCommunication,
    handleEditOpportunity,
    isLoading = false
}: SortableOpportunityCardProps) {
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative ${isLoading ? 'animate-pulse' : ''} group`}
            data-opportunity-id={opportunity.id}
            data-from-stage={opportunity.stage}
        >
            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 transition-opacity rounded-md pointer-events-none"></div>
            
            <div className="relative">
                <div 
                    {...attributes}
                    {...listeners}
                    className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-move z-10"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
                
                <OpportunityCard
                    opportunity={opportunity}
                    handleCommunication={handleCommunication}
                    handleEditOpportunity={handleEditOpportunity}
                    isDragging={isDragging}
                />
            </div>
            
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
} 