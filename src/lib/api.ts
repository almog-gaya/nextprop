import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import router from 'next/router';

// GoHighLevel API base URL
const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Default API keys
const DEFAULT_API_KEY = '';  // This should be empty by default
const DEFAULT_LOCATION_ID = '';  // This should be empty by default

// Cache and rate limiting configurations
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const DEFAULT_CACHE_TIME = CACHE_TTL;

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // Max requests per window
  retryAfterMs: 60 * 1000, // Wait 1 minute before retrying
  maxRetries: 3, // Maximum number of retries
};

// In-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

const cache: Record<string, CacheEntry> = {};

// Request tracker for rate limiting
const requestTracker = {
  requests: [] as number[],
  isRateLimited: false,
  retryTimeout: null as NodeJS.Timeout | null,
};

// Add this utility function at the top of the file
export function safeBase64Decode(str: string): string {
  // Make sure the input is properly padded
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Use Buffer for Node.js or atob for browser
  if (typeof window === 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } else {
    return atob(base64);
  }
}

/**
 * Create an API client with the user's GHL API key
 */
const createGhlApiClient = (apiKey: string) => {
  // Create an axios instance with GHL base URL and headers
  const client = axios.create({
    baseURL: GHL_BASE_URL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout to prevent hanging requests
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      // Mask the API key in logs
      const maskedAuth = config.headers.Authorization 
        ? config.headers.Authorization.toString().replace(/Bearer\s+(.{4})(.*)(.{4})/, 'Bearer $1***$3')
        : 'No Authorization';
        
      console.log(`GHL API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        params: config.params,
        headers: {
          ...config.headers,
          Authorization: maskedAuth
        }
      });
      
      return config;
    },
    (error) => {
      console.error('Error in GHL API request config:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and rate limiting
  client.interceptors.response.use(
    (response) => {
      // Log successful responses (without sensitive data)
      console.log(`GHL API Response: ${response.status} from ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      
      return response;
    },
    (error) => {
      // Log detailed error information
      console.error('GHL API Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
        
        // Handle rate limiting
        if (error.response.status === 429) {
          console.warn('Rate limited by GoHighLevel API, will implement backoff strategy');
          // Additional rate limiting logic can be implemented here
        }
      } else if (error.request) {
        console.error('No response received from GHL API:', error.request);
      } else {
        console.error('Error setting up GHL API request:', error.message);
      }
      
      // Reject with the original error
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Helper function to extract error message from API responses
 */
export const extractErrorMessage = (error: any): string => {
  console.error('Extracting error message from:', error);
  
  if (error?.response?.data?.message) {
    return `API Error: ${error.response.data.message}`;
  }
  
  if (error?.response?.data?.error) {
    return `API Error: ${error.response.data.error}`;
  }
  
  if (error?.message) {
    // Remove axios-specific parts of the error message
    const cleanedMessage = error.message
      .replace(/^AxiosError:?\s*/i, '')
      .replace(/^Error:?\s*/i, '');
    return cleanedMessage;
  }
  
  return 'Unknown API error occurred';
};

/**
 * Generate a cache key based on endpoint, params and API key
 */
const generateCacheKey = (
  endpoint: string, 
  params: Record<string, any>, 
  apiKey: string
): string => {
  return `${endpoint}:${JSON.stringify(params)}:${apiKey.substring(0, 10)}`;
};

/**
 * Get cached data or fetch from API
 */
export const getCachedData = async <T>({
  apiKey,
  endpoint,
  params = {},
  forceRefresh = false,
  cacheTime = DEFAULT_CACHE_TIME,
}: {
  apiKey: string;
  endpoint: string;
  params?: Record<string, any>;
  forceRefresh?: boolean;
  cacheTime?: number;
}): Promise<T> => {
  // First check if API key is valid
  if (!validateApiKey(apiKey)) {
    const validationError = new Error('Invalid API key format');
    console.error('API key validation failed:', validationError);
    throw validationError;
  }

  // Check if this is a JWT token and try to extract location ID
  let locationId: string | null = null;
  if (apiKey.startsWith('eyJ') && apiKey.includes('.')) {
    try {
      console.log('Attempting to decode JWT token...');
      // JWT tokens have three parts separated by dots
      const parts = apiKey.split('.');
      console.log(`JWT has ${parts.length} parts`);
      
      if (parts.length === 3) {
        // The payload is the middle part, base64 encoded
        console.log(`Decoding payload: ${parts[1].substring(0, 10)}...`);
        const decodedPayload = safeBase64Decode(parts[1]);
        console.log(`Decoded payload (first 50 chars): ${decodedPayload.substring(0, 50)}`);
        
        const payload = JSON.parse(decodedPayload);
        console.log('JWT payload:', payload);
        
        if (payload.location_id) {
          locationId = payload.location_id;
          console.log(`✅ Successfully extracted location ID from JWT: ${locationId}`);
        } else {
          console.log('❌ No location_id found in JWT payload');
        }
      }
    } catch (e) {
      console.error('⚠️ Error decoding JWT token:', e);
    }
  }

  // If we're trying to access conversations and have a location ID from the JWT,
  // but the endpoint doesn't include locations, modify it
  if (locationId && 
     (endpoint.includes('/conversations') || endpoint === '/conversations' || endpoint === 'conversations') && 
     !endpoint.includes('/locations/')) {
    // Modify endpoint to include location ID
    const newEndpoint = `/locations/${locationId}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`🔄 Modifying endpoint from ${endpoint} to ${newEndpoint}`);
    endpoint = newEndpoint;
  }

  // Generate a cache key based on endpoint, params, and API key
  const cacheKey = generateCacheKey(endpoint, params, apiKey);
  const now = Date.now();

  // Check the cache (if not forcing a refresh)
  if (!forceRefresh && cache[cacheKey]) {
    const { data, expiry } = cache[cacheKey];
    if (expiry > now) {
      console.log(`Using cached data for ${endpoint}`);
      return data as T;
    }
    console.log(`Cache expired for ${endpoint}`);
  }

  try {
    // Ensure the endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    console.log(`Fetching data from API: ${formattedEndpoint}`);
    const client = createGhlApiClient(apiKey);
    const response = await client.get(formattedEndpoint, { params });
    
    // Cache the response
    const expiry = now + cacheTime;
    cache[cacheKey] = { 
      data: response.data, 
      timestamp: now,
      expiry 
    };
    
    console.log(`Successfully fetched data from ${formattedEndpoint}`);
    return response.data as T;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    
    // Use our helper to extract a meaningful error message
    const errorMessage = extractErrorMessage(error);
    
    // Throw a more informative error
    throw new Error(`GHL API Error: ${errorMessage}`);
  }
};

/**
 * Get contacts from the GHL API
 */
export const getContacts = async (apiKey: string, locationId?: string, params: Record<string, any> = {}): Promise<any> => {
  const endpoint = locationId ? `/locations/${locationId}/contacts` : '/contacts';
  return getCachedData({
    apiKey,
    endpoint,
    params: { ...params, limit: 100 },
  });
};

/**
 * Get opportunities from the GHL API
 */
export const getOpportunities = async (apiKey: string, pipelineId: string, locationId?: string, params: Record<string, any> = {}): Promise<any> => {
  const endpoint = `/pipelines/${pipelineId}/opportunities`;
  return getCachedData({
    apiKey,
    endpoint,
    params: { ...params, limit: 100 },
  });
};

/**
 * Get pipelines from the GHL API
 */
export const getPipelines = async (apiKey: string, locationId?: string, params: Record<string, any> = {}): Promise<any> => {
  const endpoint = locationId ? `/locations/${locationId}/pipelines` : '/pipelines';
  return getCachedData({
    apiKey,
    endpoint,
    params: { ...params, limit: 100 },
  });
};

/**
 * Get calls from the GHL API
 */
export const getCalls = async (apiKey: string, locationId?: string, params: Record<string, any> = {}): Promise<any> => {
  const endpoint = locationId ? `/locations/${locationId}/calls` : '/calls';
  return getCachedData({
    apiKey,
    endpoint,
    params: { ...params, limit: 100 },
  });
};

/**
 * Get conversations from the GHL API
 * Tries both with and without location ID if the first attempt fails with a 404
 */
export const getConversations = async (apiKey: string, locationId?: string, params: Record<string, any> = {}): Promise<any> => {
  console.log('getConversations called with locationId:', locationId);
  
  try {
    // Extract location ID from JWT token if not provided
    if (!locationId && apiKey.startsWith('eyJ')) {
      try {
        const parts = apiKey.split('.');
        if (parts.length === 3) {
          const decodedPayload = safeBase64Decode(parts[1]);
          const payload = JSON.parse(decodedPayload);
          if (payload.location_id) {
            locationId = payload.location_id;
            console.log(`Found location ID in JWT token: ${locationId}`);
          }
        }
      } catch (e) {
        console.error('Error extracting location from JWT:', e);
      }
    }
    
    // Array of possible endpoints to try for conversations
    const endpointPatterns = [
      // Standard endpoint
      '/conversations',
      
      // Location-specific endpoints
      locationId ? `/locations/${locationId}/conversations` : null,
      
      // Alternate patterns
      '/messaging/conversations',
      locationId ? `/locations/${locationId}/messaging/conversations` : null,
      '/inbox/conversations',
      locationId ? `/locations/${locationId}/inbox/conversations` : null,
      '/v2/conversations',
      locationId ? `/locations/${locationId}/v2/conversations` : null,
    ].filter(Boolean) as string[]; // Filter out null values
    
    console.log('Trying the following conversation endpoints:', endpointPatterns);
    
    // Try each endpoint pattern sequentially
    let lastError: any = null;
    
    for (const endpoint of endpointPatterns) {
      try {
        console.log(`Attempting to fetch conversations from: ${endpoint}`);
        const response = await getCachedData({
          apiKey,
          endpoint,
          params,
          forceRefresh: true // Don't cache during testing to ensure fresh results
        });
        console.log(`Success with endpoint: ${endpoint}`);
        return response;
      } catch (error: any) {
        console.log(`Failed with endpoint ${endpoint}: ${error.message}`);
        lastError = error;
        // Continue to next endpoint on failure
      }
    }
    
    // If we've tried all patterns and no success, throw with helpful message
    if (lastError) {
      console.error('All conversation endpoint patterns failed');
      
      // Provide a helpful error message
      if (lastError.message.includes('404')) {
        const enhancedError = new Error(
          'Unable to access conversations through any known API patterns. ' +
          'Although your account has conversationsEnabled in permissions, ' +
          'the API endpoints are not accessible. This may require special configuration in GHL.'
        );
        throw enhancedError;
      }
      
      throw lastError;
    }
    
    throw new Error('Failed to fetch conversations through any known endpoint pattern');
    
  } catch (error: any) {
    console.error('Error in getConversations:', error.message);
    throw error;
  }
};

/**
 * Get messages for a specific conversation
 */
export const getMessages = async (
  apiKey: string,
  conversationId: string,
  locationId?: string,
  params: Record<string, any> = {}
): Promise<any> => {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  try {
    // First, try with location-specific endpoint if locationId is provided
    if (locationId) {
      console.log(`Fetching messages with location ID: ${locationId} for conversation: ${conversationId}`);
      return await getCachedData({
        apiKey,
        endpoint: `/locations/${locationId}/conversations/${conversationId}/messages`,
        params,
      });
    }
    
    // Try without location ID first
    try {
      console.log(`Fetching messages without location ID for conversation: ${conversationId}`);
      return await getCachedData({
        apiKey,
        endpoint: `/conversations/${conversationId}/messages`,
        params,
      });
    } catch (error: any) {
      // If error is 404, try to get location ID from /locations endpoint
      if (error?.response?.status === 404) {
        console.log("404 error for messages endpoint, attempting to fetch locations");
        const locationsData = await getCachedData<{ locations: Array<{ id: string }> }>({
          apiKey,
          endpoint: "/locations",
          params: {},
        });
        
        if (locationsData?.locations?.length > 0) {
          const firstLocationId = locationsData.locations[0].id;
          console.log(`Found location ID: ${firstLocationId}, retrying with location-specific endpoint`);
          
          // Try with location-specific endpoint
          return await getCachedData({
            apiKey,
            endpoint: `/locations/${firstLocationId}/conversations/${conversationId}/messages`,
            params,
          });
        }
      }
      
      // Re-throw if we cannot recover
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Alias for getMessages to match import in useGhlApi hook
 */
export const getConversationMessages = getMessages;

/**
 * Send a message to a conversation
 */
export const sendMessage = async (apiKey: string, conversationId: string, messageData: any, locationId?: string) => {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  try {
    // Create GHL API client
    const client = createGhlApiClient(apiKey);
    
    // First, try with location-specific endpoint if locationId is provided
    if (locationId) {
      console.log(`Sending message with location ID: ${locationId} for conversation: ${conversationId}`);
      const response = await client.post(
        `/locations/${locationId}/conversations/${conversationId}/messages`,
        messageData
      );
      return response.data;
    }
    
    // Try without location ID
    try {
      console.log(`Sending message without location ID for conversation: ${conversationId}`);
      const response = await client.post(
        `/conversations/${conversationId}/messages`,
        messageData
      );
      return response.data;
    } catch (error: any) {
      // If error is 404, try to get location ID from /locations endpoint
      if (error?.response?.status === 404) {
        console.log("404 error for sendMessage endpoint, attempting to fetch locations");
        const locationsData = await getCachedData<{ locations: Array<{ id: string }> }>({
          apiKey,
          endpoint: "/locations",
          params: {},
        });
        
        if (locationsData?.locations?.length > 0) {
          const firstLocationId = locationsData.locations[0].id;
          console.log(`Found location ID: ${firstLocationId}, retrying with location-specific endpoint`);
          
          // Try with location-specific endpoint
          const response = await client.post(
            `/locations/${firstLocationId}/conversations/${conversationId}/messages`,
            messageData
          );
          return response.data;
        }
      }
      
      // Re-throw if we cannot recover
      throw error;
    }
  } catch (error) {
    console.error(`Error sending message for conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Generic function for making API calls with error handling
 */
export const fetchWithErrorHandling = async <T>(
  apiFunction: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<{ data?: T; error?: string }> => {
  try {
    const data = await apiFunction(...args);
    return { data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Error:', errorMessage);
    return { error: errorMessage };
  }
};

/**
 * Get a single contact by ID (wrapper with user token handling)
 */
export async function getContact(contactId: string) {
  try {
    const response = await fetch(`/api/contacts/${contactId}`);
    if (!response.ok) throw new Error('Failed to fetch contact');
    return await response.json();
  } catch (error) {
    console.error('Error fetching contact:', error);
    throw error;
  }
}

/**
 * Create a contact (wrapper with user token handling)
 */
export async function createContact(contactData: any) {
  try {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
    if (!response.ok) throw new Error('Failed to create contact');
    return await response.json();
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
}

/**
 * Update a contact (wrapper with user token handling)
 */
export async function updateContact(contactId: string, contactData: any) {
  try {
    const response = await fetch(`/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData),
    });
    if (!response.ok) throw new Error('Failed to update contact');
    return await response.json();
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}

/**
 * Create an opportunity (wrapper with user token handling)
 */
export async function createOpportunity(pipelineId: string, opportunityData: any) {
  try {
    const response = await fetch(`/api/pipelines/${pipelineId}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opportunityData),
    });
    if (!response.ok) throw new Error('Failed to create opportunity');
    return await response.json();
  } catch (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }
}

/**
 * Update an opportunity (wrapper with user token handling)
 */
export async function updateOpportunity(pipelineId: string, opportunityId: string, opportunityData: any) {
  try {
    const response = await fetch(`/api/pipelines/${pipelineId}/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opportunityData),
    });
    if (!response.ok) throw new Error('Failed to update opportunity');
    return await response.json();
  } catch (error) {
    console.error('Error updating opportunity:', error);
    throw error;
  }
}

/**
 * Log a call (wrapper with user token handling)
 */
export async function logCall(callData: any) {
  try {
    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData),
    });
    if (!response.ok) throw new Error('Failed to log call');
    return await response.json();
  } catch (error) {
    console.error('Error logging call:', error);
    throw error;
  }
}

/**
 * Validate API key format (simple check for now)
 */
function validateApiKey(apiKey: string): boolean {
  if (!apiKey) {
    return false;
  }

  // Check for JWT format (common for location-specific API keys)
  if (apiKey.startsWith('eyJ') && apiKey.includes('.')) {
    // This looks like a JWT token, which is valid for GHL
    return true;
  }
  
  // Old validation for non-JWT API keys
  // Check if API key is at least 10 characters long and alphanumeric
  const hasMinLength = apiKey.length >= 10;
  const isAlphanumeric = /^[a-zA-Z0-9_-]+$/.test(apiKey);
  
  return hasMinLength && isAlphanumeric;
}

/**
 * Get all notes for a contact
 */
export async function getContactNotes(contactId: string) {
  try {
    const response = await fetch(`/api/contacts/${contactId}/notes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to get contact notes');
    return await response.json();
  } catch (error) {
    console.error('Error getting contact notes:', error);
    throw error;
  }
}

/**
 * Get a specific note
 */
export async function getContactNote(contactId: string, noteId: string) {
  try {
    const response = await fetch(`/api/contacts/${contactId}/notes/${noteId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to get contact note');
    return await response.json();
  } catch (error) {
    console.error('Error getting contact note:', error);
    throw error;
  }
}

/**
 * Create a new note for a contact
 */
export async function createContactNote(contactId: string, noteData: { body: string; userId?: string }) {
  try {
    const response = await fetch(`/api/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    if (!response.ok) throw new Error('Failed to create contact note');
    return await response.json();
  } catch (error) {
    console.error('Error creating contact note:', error);
    throw error;
  }
}

/**
 * Update an existing note
 */
export async function updateContactNote(contactId: string, noteId: string, noteData: { body: string; userId?: string }) {
  try {
    const response = await fetch(`/api/contacts/${contactId}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    if (!response.ok) throw new Error('Failed to update contact note');
    return await response.json();
  } catch (error) {
    console.error('Error updating contact note:', error);
    throw error;
  }
}

/**
 * Delete a note
 */
export async function deleteContactNote(contactId: string, noteId: string) {
  try {
    const response = await fetch(`/api/contacts/${contactId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to delete contact note');
    return await response.json();
  } catch (error) {
    console.error('Error deleting contact note:', error);
    throw error;
  }
} 