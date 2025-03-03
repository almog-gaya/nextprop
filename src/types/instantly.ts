// Instantly Campaign types
export interface InstantlyCampaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  daily_limit: number;
  email_gap: number;
  email_list: string;
  template: string;
  email_template?: string;
  sequences: string;
}

export interface InstantlySequence {
  id: string;
  name: string;
}

export interface InstantlyStep {
  type: 'email';
  delay: number;
  variants: InstantlyVariant[];
}

export interface InstantlyVariant {
  subject: string;
  body: string;
}

// Lead types
export interface InstantlyLead {
  id: string;
  email: string;
  status: string;
  campaign_id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  custom_fields?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Email types
export interface InstantlyEmail {
  id: string;
  campaign_id: string;
  lead_id: string;
  subject: string;
  body: string;
  from_email: string;
  to_email: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
}

// Analytics types
export interface InstantlyCampaignAnalytics {
  campaign_id: string;
  campaign_name: string;
  leads_count: number;
  contacted_count: number;
  emails_sent_count: number;
  opens_count: number;
  clicks_count: number;
  replies_count: number;
  bounces_count: number;
  unsubscribes_count: number;
}

// Create campaign request
export interface CreateCampaignRequest {
  name: string;
  daily_limit: number;
  email_gap: number;
  email_list: string;
  template: string;
  email_template?: string;
  sequences: string;
}

// Update campaign request
export interface UpdateCampaignRequest {
  name?: string;
  status?: string;
  daily_limit?: number;
  email_gap?: number;
  email_list?: string;
  template?: string;
  email_template?: string;
  sequences?: string;
}

// Add leads request
export interface AddLeadRequest {
  campaignId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  customFields?: Record<string, string>;
}

export interface BulkAddLeadsRequest {
  campaignId: string;
  leads: {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    customFields?: Record<string, string>;
  }[];
} 