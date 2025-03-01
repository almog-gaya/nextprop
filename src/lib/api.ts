import axios from 'axios';

// API base URL
const API_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Hardcoded API key
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjlBOTk1MnZKeHRNY0NIVHA3OW1VIiwidmVyc2lvbiI6MSwiaWF0IjoxNzIyODYwMjk3MzgyLCJzdWIiOiJZWWltcTBiNmtPbUhPQmlHVzlKWCJ9.ogDnvPiT5a19pnCPeYeS_6i0FrfAxnVuTevvBJsH-VY';

// Headers for API requests
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Error handling wrapper for API calls
export async function fetchWithErrorHandling<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'An error occurred');
  }
}

// Get all contacts
export async function getContacts() {
  const response = await axios.get(`${API_BASE_URL}/contacts/`, { headers });
  return response.data;
}

// Get all pipelines
export async function getPipelines() {
  const response = await axios.get(`${API_BASE_URL}/pipelines/`, { headers });
  return response.data;
}

// Get opportunities for a specific pipeline
export async function getOpportunities(pipelineId: string) {
  if (!pipelineId) {
    throw new Error('Pipeline ID is required');
  }
  const response = await axios.get(`${API_BASE_URL}/pipelines/${pipelineId}/opportunities`, { headers });
  return response.data;
}

// Get all calls
export async function getCalls() {
  const response = await axios.get(`${API_BASE_URL}/calls/`, { headers });
  return response.data;
}

// Get a single contact by ID
export async function getContactById(contactId: string) {
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  const response = await axios.get(`${API_BASE_URL}/contacts/${contactId}`, { headers });
  return response.data;
}

// Create a new contact
export async function createContact(contactData: any) {
  const response = await axios.post(`${API_BASE_URL}/contacts/`, contactData, { headers });
  return response.data;
}

// Update an existing contact
export async function updateContact(contactId: string, contactData: any) {
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  const response = await axios.put(`${API_BASE_URL}/contacts/${contactId}`, contactData, { headers });
  return response.data;
}

// Create a new opportunity
export async function createOpportunity(pipelineId: string, opportunityData: any) {
  if (!pipelineId) {
    throw new Error('Pipeline ID is required');
  }
  const response = await axios.post(`${API_BASE_URL}/pipelines/${pipelineId}/opportunities`, opportunityData, { headers });
  return response.data;
}

// Update an existing opportunity
export async function updateOpportunity(pipelineId: string, opportunityId: string, opportunityData: any) {
  if (!pipelineId || !opportunityId) {
    throw new Error('Pipeline ID and Opportunity ID are required');
  }
  const response = await axios.put(`${API_BASE_URL}/pipelines/${pipelineId}/opportunities/${opportunityId}`, opportunityData, { headers });
  return response.data;
}

// Log a new call
export async function logCall(callData: any) {
  const response = await axios.post(`${API_BASE_URL}/calls/`, callData, { headers });
  return response.data;
} 