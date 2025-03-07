import { NextResponse } from 'next/server';

// Instantly API configuration
const INSTANTLY_API_BASE_URL = 'https://api.instantly.ai/api/v2';
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY || '';

// Debug info - log the first few characters of the API key to check if it's loaded
console.log('Instantly API Key available:', INSTANTLY_API_KEY ? `${INSTANTLY_API_KEY.substring(0, 5)}...` : 'Not set');
console.log('Authorization header will be:', `Bearer ${INSTANTLY_API_KEY ? INSTANTLY_API_KEY.substring(0, 5) + '...' : 'Not set'}`);

// Helper function to create properly formatted authorization header
function getAuthorizationHeader() {
  if (!INSTANTLY_API_KEY) {
    console.error('INSTANTLY_API_KEY is not set');
    return '';
  }
  
  // Remove 'Bearer ' prefix if it's already part of the key
  const cleanKey = INSTANTLY_API_KEY.replace(/^Bearer\s+/i, '').trim();
  return `Bearer ${cleanKey}`;
}

// Error handling wrapper
export async function fetchWithInstantlyErrorHandling<T>(
  apiCall: () => Promise<Response>
): Promise<{ data?: T; error?: string; status?: number }> {
  try {
    const response = await apiCall();
    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || 'An error occurred with the Instantly API',
        status: response.status,
      };
    }

    return { data: data as T, status: response.status };
  } catch (error: any) {
    console.error('Error in Instantly API call:', error);
    return {
      error: error.message || 'Failed to connect to Instantly API',
      status: 500,
    };
  }
}

// API helper functions
export async function getCampaigns() {
  return fetchWithInstantlyErrorHandling(async () => {
    const authHeader = getAuthorizationHeader();
    console.log('Using auth header (sample):', authHeader.substring(0, 12) + '...');
    
    return fetch(`${INSTANTLY_API_BASE_URL}/campaigns`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
  });
}

export async function getCampaign(campaignId: string) {
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(`${INSTANTLY_API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      }
    });
  });
}

export async function getCampaignAnalytics(campaignId?: string) {
  const url = campaignId 
    ? `${INSTANTLY_API_BASE_URL}/campaigns/analytics?campaign_id=${campaignId}`
    : `${INSTANTLY_API_BASE_URL}/campaigns/analytics`;
    
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      }
    });
  });
}

export async function createCampaign(campaignData: any) {
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(`${INSTANTLY_API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    });
  });
}

export async function updateCampaign(campaignId: string, campaignData: any) {
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(`${INSTANTLY_API_BASE_URL}/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    });
  });
}

export async function getLeads(campaignId: string, limit: number = 100, startingAfterId?: string, email?: string) {
  const payload: any = {
    campaign: campaignId,
    limit
  };
  
  if (startingAfterId) {
    payload.starting_after = startingAfterId;
  }
  
  if (email) {
    payload.email = email;
  }
  
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(`${INSTANTLY_API_BASE_URL}/leads/list`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  });
}

export async function addLead(campaignId: string, email: string, firstName: string, lastName: string, personalization?: string) {
  const payload: any = {
    campaign: campaignId,
    email,
    first_name: firstName,
    last_name: lastName
  };
  
  if (personalization) {
    payload.personalization = personalization;
  }
  
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(`${INSTANTLY_API_BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  });
}

export async function bulkAddLeads(campaignId: string, leads: { email: string; firstName: string; lastName: string; personalization?: string }[]) {
  const payload = leads.map(lead => ({
    campaign: campaignId,
    email: lead.email,
    first_name: lead.firstName,
    last_name: lead.lastName,
    personalization: lead.personalization || ''
  }));
  
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(`${INSTANTLY_API_BASE_URL}/leads/batch`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  });
}

export async function getEmails(campaignId: string, limit: number = 10, startingAfterTimestamp?: string) {
  let url = `${INSTANTLY_API_BASE_URL}/emails?campaign_id=${campaignId}&limit=${limit}`;
  
  if (startingAfterTimestamp) {
    url += `&starting_after=${startingAfterTimestamp}`;
  }
  
  return fetchWithInstantlyErrorHandling(async () => {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthorizationHeader(),
        'Content-Type': 'application/json'
      }
    });
  });
} 