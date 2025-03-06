// Pipeline types
export interface Pipeline {
  id: string;
  name: string;
  stages?: PipelineStage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  pipelineId: string;
}

// Opportunity types
export interface Opportunity {
  id: string;
  name: string;
  monetaryValue: number;
  status: string;
  contact?: Contact;
  pipelineId: string;
  stageId?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  customFields?: any;
}

export interface OpportunitiesResponse {
  opportunities: Opportunity[];
  meta: {
    total: number;
    nextPageUrl: string | null;
    startAfterId: string | null;
    startAfter: number | null;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
  };
}

// Contact types
export interface Contact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  locationId?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  timezone?: string;
  dnd: boolean;
  customFields?: {
    [key: string]: string | number | boolean | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  meta: {
    total: number;
    count: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
  };
}

// Call types
export interface Call {
  id: string;
  contactId: string;
  callType: string;
  direction: string;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  from: string;
  to: string;
  notes: string | null;
}

export interface CallsResponse {
  calls: Call[];
  meta: {
    total: number;
    count: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
  };
}

// Dashboard stats type
export interface DashboardStats {
  totalContacts: number;
  totalOpportunities: number;
  totalCalls: number;
  totalPipelines: number;
} 