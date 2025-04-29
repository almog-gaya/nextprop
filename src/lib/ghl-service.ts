import axios from 'axios';

// Add your GHL API credentials
const GHL_API_KEY = process.env.GHL_API_KEY || '';
const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

// Check if GHL integration is configured
export function isGhlConfigured(): boolean {
  return Boolean(GHL_API_KEY);
}

// Create headers for GHL API requests
function getHeaders() {
  return {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-04-15'
  };
}

// Send a message to a contact via GHL API
export async function sendMessageToGhl(
  contactId: string,
  message: string,
  conversationId?: string,
  locationId?: string
) {
  try {
    console.log('📤 Sending message to GHL:', { contactId, message });

    if (!isGhlConfigured()) {
      throw new Error('GHL API key not configured');
    }

    // Construct the endpoint URL
    const endpoint = `${GHL_BASE_URL}/conversations/messages`;

    // Construct the payload
    const payload: any = {
      contactId,
      message,
      type: 'SMS',
    };

    // Add optional parameters if provided
    if (conversationId) {
      payload.conversationId = conversationId;
    }

    if (locationId) {
      payload.locationId = locationId;
    }

    // Make the API request
    const response = await axios.post(endpoint, payload, {
      headers: getHeaders()
    });

    console.log('📤 GHL API response:', response.data);
    return response.data;

  } catch (error) {
    console.error('🔴 Error sending message to GHL:', error);
    throw error;
  }
}

// Get contact details from GHL
export async function getContactFromGhl(contactId: string) {
  try {
    if (!isGhlConfigured()) {
      throw new Error('GHL API key not configured');
    }

    const endpoint = `${GHL_BASE_URL}/contacts/${contactId}`;

    const response = await axios.get(endpoint, {
      headers: getHeaders()
    });

    return response.data;
  } catch (error) {
    console.error('🔴 Error fetching contact from GHL:', error);
    throw error;
  }
}

/**
  * WORKFLOW Related API Calls
 */
export const isWorkflowExists = async (workflowName: string): Promise<boolean> => {
  const result = await fetch(`/api/workflow/trigger?workflowName=${workflowName}`);
  const data = await result.json();
  return data.isExists;
}

export const getCurrentWorkflowId = async (workflowName: string) => {
  try {
    const result = await fetch(`/api/workflow/trigger?workflowName=${workflowName}`);
    const data = await result.json();
    return data?.rows[0]?.id;
  } catch (_) { }
}

export const createWorkFlow = async (workflowName: string) => {
  /// delete the workflow if it already exists
  const workflowId = await getCurrentWorkflowId(workflowName);
  if (workflowId) {
    await deleteWorkFlow(workflowId, workflowName);
  }
  /// create the workflow
  const result = await fetch(`/api/workflow/trigger?workflowName=${workflowName}`, {
    method: 'POST',
  });

  const data = await result.json();
  return data;
}

export const updateWorkFlow = async (workflowId: string, triggerId: string, templateId: string, workflowName: string) => {
  const result = await fetch(`/api/workflow/trigger?workflowName=${workflowName}`, {
    method: 'PUT',
    body: JSON.stringify({
      workflowId,
      triggerId,
      templateId
    })
  });

  const data = await result.json();
  return data;
}

export const deleteWorkFlow = async (workflowId: string, workflowName: string) => {
  const result = await fetch(`/api/workflow/trigger?workflowName=${workflowName}`, {
    method: 'DELETE',
    body: JSON.stringify({
      workflowId
    })
  });
  const data = await result.json();
  return data;
}