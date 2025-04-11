// Pipeline types
export interface Pipeline {
  id: string;
  name: string;
  showInFunnel?: boolean;
  showInPieChart?: boolean;
  stages?: PipelineStage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  showInFunnel?: boolean;
  showInPieChart?: boolean;
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
  assignedTo?: string;
  source?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  address1?: string;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
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


export interface AutomationData {
  id: string; // From automationDoc.id
  status: string; // Used in StatusBadge, e.g., 'completed', 'processing', etc.
  customer_id: string; // Used in query where clause
  pipeline_id: string; // Part of propertyConfig
  stage_id: string; // Part of propertyConfig
  limit: number; // Used to set propertyCount
  redfin_url: string; // Displayed in DataCard
  campaign_id?: string; // Optional, used to fetch campaign data
  last_run?: { seconds: number }; // Optional, used in DataCard with timestamp conversion
  campaign_payload: {
    name: string; // Displayed in DataCard
    days: string[]; // Displayed in DataCard, joined with commas
    time_window: {
      start: string;
      end: string;
    };
    timezone: string;
    channels: {
      sms: {
        enabled: boolean;
        message: string; // Displayed in DataCard
        time_interval: number;
        from_number: string;
      };
    };
  };
}