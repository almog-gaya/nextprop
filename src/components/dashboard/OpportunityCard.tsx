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

interface OpportunityCardProps {
  opportunity: Opportunity;
  handleCommunication: (opportunityId: string, actionType: 'voicemail' | 'sms' | 'call' | 'email' | 'optout') => void;
  handleEditOpportunity: (opportunity: Opportunity) => void;
}

export default function OpportunityCard({
  opportunity,
  handleCommunication,
  handleEditOpportunity,
}: OpportunityCardProps) {
  return (
    <div className="bg-white mb-3 rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="p-3 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800 truncate">{opportunity.name || '-'}</span>
            <button className="text-gray-400 hover:text-gray-600 ml-2">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>

          {opportunity.businessName && (
            <div className="text-sm mt-1">
              <span className="text-gray-500">Business:</span>
              <span className="ml-1 text-gray-700">{opportunity.businessName}</span>
            </div>
          )}

          {opportunity.source && (
            <div className="text-sm mt-1">
              <span className="text-gray-500">Source:</span>
              <span className="ml-1 text-gray-700">{opportunity.source}</span>
            </div>
          )}

          <div className="text-sm mt-1">
            <span className="text-gray-500">Value:</span>
            <span className="ml-1 text-gray-700">{opportunity.value}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-md">
        <button
          className="text-gray-500 hover:text-purple-600 p-1"
          onClick={() => handleCommunication(opportunity.id, 'call')}
          title="Simulate a returned call"
        >
          <PhoneIcon className="h-4 w-4" />
        </button>
        <button
          className="text-gray-500 hover:text-purple-600 p-1"
          onClick={() => handleCommunication(opportunity.id, 'sms')}
          title="Simulate a returned SMS"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
        </button>
        <button
          className="text-gray-500 hover:text-purple-600 p-1"
          onClick={() => handleCommunication(opportunity.id, 'email')}
          title="Send email"
        >
          <EnvelopeIcon className="h-4 w-4" />
        </button>
        {/* <button
          className="text-gray-500 hover:text-purple-600 p-1"
          onClick={() => handleEditOpportunity(opportunity)}
          title="Edit opportunity"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          className="text-gray-500 hover:text-red-600 p-1"
          onClick={() => handleCommunication(opportunity.id, 'optout')}
          title="Mark as opted out"
        >
          <XMarkIcon className="h-4 w-4" />
        </button> */}
      </div>
    </div>
  );
}