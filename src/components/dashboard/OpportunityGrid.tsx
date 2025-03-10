'use client';

import React from 'react';
import OpportunityCard from './OpportunityCard';

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
}

export default function OpportunityGrid({ opportunities, getProcessedOpportunities, handleCommunication, handleEditOpportunity }: OpportunityGridProps) {
    return (
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
                        <div className="p-2 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar flex-1">
                            {getProcessedOpportunities(stage.id).map((opportunity) => (
                                <OpportunityCard key={opportunity.id} opportunity={opportunity} handleCommunication={handleCommunication}
                                    handleEditOpportunity={handleEditOpportunity}
                                />
                            ))}
                            {getProcessedOpportunities(stage.id).length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No opportunities in this stage</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}