'use client';

import React from 'react';
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
}

export default function OpportunityList({
  opportunities,
  getProcessedOpportunities,
  handleCommunication,
  handleEditOpportunity,
}: OpportunityListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
          {opportunities.flatMap((stage) =>
            getProcessedOpportunities(stage.id).map((opportunity) => (
              <tr key={opportunity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{opportunity.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{opportunity.businessName || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{opportunity.value}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {opportunities.find((s) => s.id === opportunity.stage)?.name || opportunity.stage}
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
                </td>
              </tr>
            ))
          )}
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
  );
}