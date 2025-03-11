'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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

interface SortableOpportunityRowProps {
  opportunity: Opportunity;
  stageId: string;
  stageName: string;
  handleCommunication: (opportunityId: string, actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
  handleEditOpportunity: (opportunity: Opportunity) => void;
  isLoading?: boolean;
}

export default function SortableOpportunityRow({
  opportunity,
  stageId,
  stageName,
  handleCommunication,
  handleEditOpportunity,
  isLoading = false,
}: SortableOpportunityRowProps) {
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
      stageId,
      fromStage: stageId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f3f4f6' : undefined,
    zIndex: isDragging ? 999 : 1,
    position: 'relative' as 'relative',
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`hover:bg-gray-50 cursor-grab ${isLoading ? 'animate-pulse' : ''} group`}
      data-opportunity-id={opportunity.id}
      data-from-stage={stageId}
    >
      <td className="px-6 py-4 whitespace-nowrap relative">
        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
        <div className="text-sm font-medium text-gray-900 relative">{opportunity.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{opportunity.businessName || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{opportunity.value}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          {stageName || stageId}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {opportunity.lastActivity ? new Date(opportunity.lastActivity).toLocaleDateString() : '-'}
        {opportunity.lastActivityType && (
          <span className="ml-1 text-xs text-gray-500">({opportunity.lastActivityType})</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            className="text-gray-500 hover:text-purple-600 p-1"
            onClick={(e) => {
              e.stopPropagation();
              handleCommunication(opportunity.id, 'call');
            }}
            title="Simulate a returned call"
          >
            <PhoneIcon className="h-4 w-4" />
          </button>
          <button
            className="text-gray-500 hover:text-purple-600 p-1"
            onClick={(e) => {
              e.stopPropagation();
              handleCommunication(opportunity.id, 'sms');
            }}
            title="Simulate a returned SMS"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </button>
          <button
            className="text-gray-500 hover:text-purple-600 p-1"
            onClick={(e) => {
              e.stopPropagation();
              handleCommunication(opportunity.id, 'email');
            }}
            title="Send email"
          >
            <EnvelopeIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
} 