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
import { IconButton } from '../ui/iconButton';

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
  handleCommunication: (id: string, type: 'call' | 'sms' | 'email' | 'optout') => void;
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
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'bg-gray-50' : ''} cursor-move`}
      {...attributes}
      {...listeners}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{opportunity.name}</div>
        {opportunity.businessName && (
          <div className="text-sm text-gray-500">{opportunity.businessName}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{opportunity.value}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {stageName}
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
          <IconButton
            icon={<PhoneIcon className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleCommunication(opportunity.id, 'call');
            }}
            tooltip="Simulate a returned call"
          />
          <IconButton
            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleCommunication(opportunity.id, 'sms');
            }}
            tooltip="Simulate a returned SMS"
          />
          <IconButton
            icon={<EnvelopeIcon className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleCommunication(opportunity.id, 'email');
            }}
            tooltip="Send email"
          />
        </div>
      </td>
    </tr>
  );
} 