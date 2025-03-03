"use client";

import { useAuth } from '@/context/AuthContext';
import * as ghlApi from '@/lib/api';

/**
 * Hook to use the GHL API with the authenticated user's API key
 */
export default function useGhlApi() {
  const { authState } = useAuth();
  const { user } = authState;
  
  // Add debugging to check what's available
  console.log('Auth state:', authState);
  console.log('User object:', user);
  
  // Check if we have the API key and give detailed feedback
  if (!user) {
    console.error('User is not authenticated. Please login first.');
    throw new Error('User is not authenticated');
  }
  
  if (!user.ghlApiKey) {
    console.error('GHL API key is missing. Please set up your API key in settings.');
    throw new Error('Missing GHL API key');
  }
  
  const apiKey = user.ghlApiKey;
  console.log('Using API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'none');
  
  const locationId = user.ghlLocationId;
  console.log('Using location ID:', locationId || 'none');
  
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
    
    // Messaging
    getConversations: (params = {}) => ghlApi.getConversations(apiKey, locationId, params),
    getConversationMessages: (conversationId: string, params = {}) => 
      ghlApi.getMessages(apiKey, conversationId, locationId, params),
    sendMessage: (conversationId: string, messageData: any) => 
      ghlApi.sendMessage(apiKey, conversationId, messageData, locationId),
    
    // General purpose
    fetchWithErrorHandling: ghlApi.fetchWithErrorHandling,
  };
} 