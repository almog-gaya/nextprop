'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  InstantlyCampaign, 
  InstantlyLead, 
  InstantlyCampaignAnalytics, 
  InstantlyEmail,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  AddLeadRequest,
  BulkAddLeadsRequest
} from '@/types/instantly';

interface InstantlyContextType {
  // State
  campaigns: InstantlyCampaign[];
  selectedCampaign: InstantlyCampaign | null;
  campaignAnalytics: InstantlyCampaignAnalytics | null;
  leads: InstantlyLead[];
  emails: InstantlyEmail[];
  loading: {
    campaigns: boolean;
    selectedCampaign: boolean;
    analytics: boolean;
    leads: boolean;
    emails: boolean;
  };
  error: string | null;
  
  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<void>;
  selectCampaign: (campaign: InstantlyCampaign) => void;
  fetchCampaignAnalytics: (campaignId?: string) => Promise<void>;
  fetchLeads: (campaignId: string, limit?: number, startingAfterId?: string, email?: string) => Promise<void>;
  fetchEmails: (campaignId: string, limit?: number, startingAfterTimestamp?: string) => Promise<void>;
  createCampaign: (data: CreateCampaignRequest) => Promise<InstantlyCampaign | null>;
  updateCampaign: (id: string, data: UpdateCampaignRequest) => Promise<InstantlyCampaign | null>;
  addLead: (data: AddLeadRequest) => Promise<InstantlyLead | null>;
  addLeadsBulk: (data: BulkAddLeadsRequest) => Promise<boolean>;
}

const InstantlyContext = createContext<InstantlyContextType | undefined>(undefined);

export function useInstantly() {
  const context = useContext(InstantlyContext);
  if (context === undefined) {
    throw new Error('useInstantly must be used within an InstantlyProvider');
  }
  return context;
}

export function InstantlyProvider({ children }: { children: React.ReactNode }) {
  // State
  const [campaigns, setCampaigns] = useState<InstantlyCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<InstantlyCampaign | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<InstantlyCampaignAnalytics | null>(null);
  const [leads, setLeads] = useState<InstantlyLead[]>([]);
  const [emails, setEmails] = useState<InstantlyEmail[]>([]);
  const [loading, setLoading] = useState({
    campaigns: false,
    selectedCampaign: false,
    analytics: false,
    leads: false,
    emails: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch all campaigns - use useCallback to avoid creating a new function on every render
  const fetchCampaigns = useCallback(async () => {
    // Avoid duplicate requests
    if (loading.campaigns) return;
    
    try {
      setLoading(prev => ({ ...prev, campaigns: true }));
      setError(null);

      const response = await fetch('/api/instantly/campaigns');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setCampaigns(data.campaigns || []);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  }, [loading.campaigns]);

  // Fetch a single campaign
  const fetchCampaign = useCallback(async (id: string) => {
    // Avoid duplicate requests
    if (loading.selectedCampaign) return;
    
    try {
      setLoading(prev => ({ ...prev, selectedCampaign: true }));
      setError(null);

      const response = await fetch(`/api/instantly/campaigns/${id}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSelectedCampaign(data.campaign || null);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch campaign');
    } finally {
      setLoading(prev => ({ ...prev, selectedCampaign: false }));
    }
  }, [loading.selectedCampaign]);

  // Set selected campaign
  const selectCampaign = (campaign: InstantlyCampaign) => {
    setSelectedCampaign(campaign);
  };

  // Fetch campaign analytics
  const fetchCampaignAnalytics = async (campaignId?: string) => {
    // Avoid duplicate requests
    if (loading.analytics) return;
    
    try {
      setLoading(prev => ({ ...prev, analytics: true }));
      setError(null);

      const url = campaignId ? `/api/instantly/analytics?campaignId=${campaignId}` : '/api/instantly/analytics';
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        // If campaignId is provided, find the specific campaign analytics
        if (campaignId && Array.isArray(data.analytics)) {
          const specificAnalytics = data.analytics.find((a: any) => a.campaign_id === campaignId);
          setCampaignAnalytics(specificAnalytics || null);
        } else {
          setCampaignAnalytics(data.analytics || null);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch analytics');
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Fetch leads for a campaign
  const fetchLeads = async (campaignId: string, limit = 100, startingAfterId?: string, email?: string) => {
    try {
      setLoading(prev => ({ ...prev, leads: true }));
      setError(null);

      let url = `/api/instantly/leads?campaignId=${campaignId}&limit=${limit}`;
      if (startingAfterId) url += `&startingAfterId=${startingAfterId}`;
      if (email) url += `&email=${encodeURIComponent(email)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setLeads(data.leads?.items || []);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch leads');
    } finally {
      setLoading(prev => ({ ...prev, leads: false }));
    }
  };

  // Fetch emails sent from a campaign
  const fetchEmails = async (campaignId: string, limit = 10, startingAfterTimestamp?: string) => {
    try {
      setLoading(prev => ({ ...prev, emails: true }));
      setError(null);

      let url = `/api/instantly/emails?campaignId=${campaignId}&limit=${limit}`;
      if (startingAfterTimestamp) url += `&startingAfterTimestamp=${encodeURIComponent(startingAfterTimestamp)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setEmails(data.emails?.items || []);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch emails');
    } finally {
      setLoading(prev => ({ ...prev, emails: false }));
    }
  };

  // Create a new campaign
  const createCampaign = async (data: CreateCampaignRequest): Promise<InstantlyCampaign | null> => {
    try {
      setLoading(prev => ({ ...prev, campaigns: true }));
      setError(null);

      const response = await fetch('/api/instantly/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return null;
      } else {
        // Refresh campaigns list
        await fetchCampaigns();
        return result.campaign;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create campaign');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  // Update an existing campaign
  const updateCampaign = async (id: string, data: UpdateCampaignRequest): Promise<InstantlyCampaign | null> => {
    try {
      setLoading(prev => ({ ...prev, selectedCampaign: true }));
      setError(null);

      const response = await fetch(`/api/instantly/campaigns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return null;
      } else {
        // Update selected campaign if it's the one being updated
        if (selectedCampaign && selectedCampaign.id === id) {
          setSelectedCampaign(result.campaign);
        }
        
        // Refresh campaigns list
        await fetchCampaigns();
        
        return result.campaign;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update campaign');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, selectedCampaign: false }));
    }
  };

  // Add a single lead
  const addLead = async (data: AddLeadRequest): Promise<InstantlyLead | null> => {
    try {
      setLoading(prev => ({ ...prev, leads: true }));
      setError(null);

      const response = await fetch('/api/instantly/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return null;
      } else {
        // Refresh leads if currently viewing the same campaign
        if (selectedCampaign && selectedCampaign.id === data.campaignId) {
          await fetchLeads(data.campaignId);
        }
        
        return result.lead;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add lead');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, leads: false }));
    }
  };

  // Add leads in bulk
  const addLeadsBulk = async (data: BulkAddLeadsRequest): Promise<boolean> => {
    try {
      setLoading(prev => ({ ...prev, leads: true }));
      setError(null);

      const response = await fetch('/api/instantly/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return false;
      } else {
        // Refresh leads if currently viewing the same campaign
        if (selectedCampaign && selectedCampaign.id === data.campaignId) {
          await fetchLeads(data.campaignId);
        }
        
        return true;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add leads in bulk');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, leads: false }));
    }
  };

  // Load campaigns only once on initial render
  useEffect(() => {
    if (isInitialLoad) {
      fetchCampaigns();
      setIsInitialLoad(false);
    }
  }, [fetchCampaigns, isInitialLoad]);

  const value = {
    // State
    campaigns,
    selectedCampaign,
    campaignAnalytics,
    leads,
    emails,
    loading,
    error,
    
    // Actions
    fetchCampaigns,
    fetchCampaign,
    selectCampaign,
    fetchCampaignAnalytics,
    fetchLeads,
    fetchEmails,
    createCampaign,
    updateCampaign,
    addLead,
    addLeadsBulk
  };

  return (
    <InstantlyContext.Provider value={value}>
      {children}
    </InstantlyContext.Provider>
  );
} 