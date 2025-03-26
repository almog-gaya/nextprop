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
    // ... other contact fields
  };
  lastActivityType?: 'voicemail' | 'sms' | 'call' | 'email' | 'optout';
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
    if (opportunity.contact?.id) {
      router.push(`/contacts/${opportunity.contact.id}`);
    }
  };

  return (
    <div
      className={`bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="p-3">
        <button 
          onClick={handleNameClick}
          className="block w-full text-left hover:text-purple-600 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded"
        >
          <h3 className="font-medium text-gray-900 hover:text-purple-600">{opportunity.name}</h3>
        </button>
        {opportunity.businessName && (
          <p className="text-sm text-gray-500">{opportunity.businessName}</p>
        )}
        {opportunity.value && (
          <p className="text-sm font-medium text-purple-600">{opportunity.value}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {/* <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {opportunity.stage}
          </span> */}
          {opportunity.contact?.tags?.map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-md">
        <IconButton
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          onClick={() => handleCommunication(opportunity.id, 'sms')}
          tooltip="Simulate a returned SMS"
        />
        <IconButton
          icon={<EnvelopeIcon className="h-4 w-4" />}
          onClick={() => handleCommunication(opportunity.id, 'email')}
          tooltip="Send email"
        />
        <IconButton
          icon={<PencilIcon className="h-4 w-4" />}
          onClick={() => handleEditOpportunity(opportunity)}
          tooltip="Edit opportunity"
        />
        {/* <IconButton
          icon={<XMarkIcon className="h-4 w-4" />}
          onClick={() => handleCommunication(opportunity.id, 'optout')}
          tooltip="Mark as opted out"
          variant="destructive"
        /> */}
      </div>
    </div>
  );
}