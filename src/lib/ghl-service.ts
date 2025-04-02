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