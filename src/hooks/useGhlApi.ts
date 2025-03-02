"use client";

import { useAuth } from '@/context/AuthContext';
import * as ghlApi from '@/lib/api';

/**
 * Hook to use the GHL API with the authenticated user's API key
 */
export default function useGhlApi() {
  const { authState } = useAuth();
  const { user } = authState;
  
  // Ensure user is authenticated and has an API key
  if (!user || !user.ghlApiKey) {
    throw new Error('User is not authenticated or missing GHL API key');
  }
  
  const apiKey = user.ghlApiKey;
  const locationId = user.ghlLocationId;
  
  return {
    // Contacts
    getContacts: (params = {}) => ghlApi.getContacts(apiKey, locationId, params),
    
    // Pipelines
    getPipelines: (params = {}) => ghlApi.getPipelines(apiKey, locationId, params),
    
    // Opportunities
    getOpportunities: (pipelineId: string, params = {}) => 
      ghlApi.getOpportunities(apiKey, pipelineId, locationId, params),
    
    // Calls
    getCalls: (params = {}) => ghlApi.getCalls(apiKey, locationId, params),
    
    // General purpose
    fetchWithErrorHandling: ghlApi.fetchWithErrorHandling,
  };
} 