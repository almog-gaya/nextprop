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
            className={`group relative transition-all duration-200 ${
                isDragging ? 'opacity-50 scale-105 shadow-lg' : ''
            }`}
            {...attributes}
            {...listeners}
        >
            <div className="absolute inset-0 bg-gray-50/ transition-colors duration-200 rounded-lg pointer-events-none" />
            
            <OpportunityCard
                opportunity={opportunity}
                handleCommunication={handleCommunication}
                handleEditOpportunity={handleEditOpportunity}
                isDragging={isDragging}
            />
            
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
} 