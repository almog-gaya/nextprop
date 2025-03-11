// Pipeline types
export interface Opportunity {
    id: string;
    name: string;
    value: string;
    businessName?: string;
    stage: string;
    source?: string;
    lastActivity?: string;
    contact?: GHLContact;
    lastActivityType?: 'voicemail' | 'sms' | 'call' | 'email' | 'optout';
}

export interface PipelineStage {
    id: string;
    name: string;
    opportunities: Opportunity[];
    count: number;
    total: string;
}

export interface PipelineData {
    id: string;
    name: string;
    stages: PipelineStage[];
    totalOpportunities: number;
}

// GoHighLevel API response types
export interface GHLContact {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    company?: string;
    tags?: string[];
    customFields?: any; // This can be an array or object depending on the API
    timezone?: string;
    locationId?: string;
    dnd?: boolean;
}

export interface GHLOpportunity {
    id: string;
    name: string;
    monetaryValue: number;
    pipelineId: string;
    pipelineStageId: string;
    status: string;
    source?: string;
    updatedAt?: string;
    contact?: GHLContact;
}

export interface GHLStage {
    id: string;
    name: string;
}

export interface GHLPipeline {
    id: string;
    name: string;
    stages: GHLStage[];
    locationId?: string;
}

export interface GHLPipelineResponse {
    pipelines: GHLPipeline[];
}

export interface GHLOpportunityResponse {
    opportunities: GHLOpportunity[];
    meta?: {
        total: number;
        nextPageUrl?: string;
    };
}