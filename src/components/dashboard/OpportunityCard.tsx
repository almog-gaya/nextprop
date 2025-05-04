'use client';

import React from 'react';
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PencilIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { IconButton } from '../ui/iconButton';
import { useRouter } from 'next/navigation';

interface Opportunity {
  id: string;
  name: string;
  value: string;
  businessName?: string;
  stage: string;
  source?: string;
  lastActivity?: string;
  contact?: {
    id: string;
    name: string;
    tags?: string[];
    phone?: string;
    // ... other contact fields
  };
  lastActivityType?: 'voicemail' | 'sms' | 'call' | 'email' | 'optout';
  createdAt?: string;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  handleCommunication: (id: string, type: 'call' | 'sms' | 'email' | 'optout') => void;
  handleEditOpportunity: (opportunity: Opportunity) => void;
  isDragging?: boolean;
}

export default function OpportunityCard({
  opportunity,
  handleCommunication,
  handleEditOpportunity,
  isDragging = false,
}: OpportunityCardProps) {
  const router = useRouter();

  const handleNameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (opportunity?.contact?.phone) {
      router.push(`/messaging-embed/${opportunity.contact.phone}`);
    } else {
      router.push('/messaging-embed');
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-300 shadow-sm mb-4 mx-2 transition-all duration-200 hover:shadow-md ${isDragging ? 'opacity-50 scale-105 shadow-lg' : ''
        }`}
      style={{
        minHeight: 140,
        width: '237.5px'
      }}
    >
      <div className="p-2 relative">
      <div className="flex justify-between items-center mb-4">
      <p
          className="text-gray-900 hover:text-gray-700 font-bold text-[13px] leading-tight truncate max-w-[150px] my-0 mr-2 cursor-pointer"
          title={opportunity.name}
          onClick={handleNameClick}
        >
          {opportunity.name}
        </p>
        <button
          onClick={() => handleEditOpportunity(opportunity)}
          className="text-xs font-semibold text-red-700 bg-white border border-red-200 rounded px-2 py-[4px] hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-opacity-50 transition-colors duration-200"
        >
          Open
        </button>
      </div>
        
        {opportunity.businessName && (
          <p className="text-sm text-gray-500">{opportunity.businessName}</p>
        )}
       
        {opportunity.value && (
          <p className="text-sm font-medium text-gray-700">{opportunity.value}</p>
        )}
        
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opportunity.contact?.tags?.map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
        <div className="flex items-center -ml-1">
          <IconButton
            icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            onClick={() => handleCommunication(opportunity.id, 'sms')}
            tooltip="Simulate a returned SMS"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-7 h-7 flex items-center justify-center"
          />
          <IconButton
            icon={<EnvelopeIcon className="h-4 w-4" />}
            onClick={() => handleCommunication(opportunity.id, 'email')}
            tooltip="Send email"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-7 h-7 flex items-center justify-center"
          />
        </div>
        {/* <div className="-mr-1">
          <IconButton
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleEditOpportunity(opportunity)}
            tooltip="Edit opportunity"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-7 h-7 flex items-center justify-center"
          />
        </div> */}
      </div>
    </div>
  );
}