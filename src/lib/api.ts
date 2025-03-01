import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import router from 'next/router';

// GoHighLevel API base URL
const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Rate limiting configuration
const rateLimitConfig = {
  maxRequests: 20, // Maximum requests per window
  windowMs: 60000, // Window size in ms (1 minute)
  retryAfterMs: 5000, // Initial retry delay
  maxRetries: 3 // Maximum number of retries
};

// Request tracking for rate limiting
const requestTracker = {
  requests: [] as number[],
  isRateLimited: false,
  retryTimeout: null as NodeJS.Timeout | null,
};

// Enhanced caching with expiration
const cache: Record<string, { data: any; timestamp: number; expiresAt: number }> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache lifetime

/**
 * Create an API client with the user's GHL API key
 */
const createGhlApiClient = (apiKey: string) => {
  const client = axios.create({
    baseURL: 'https://services.leadconnectorhq.com',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-07-28',
    },
  });
  
  // Add request interceptor for rate limiting
  client.interceptors.request.use(async (config) => {
    // Check if we're currently rate limited
    if (requestTracker.isRateLimited) {
      throw new Error('Rate limited: Too many requests');
    }

    // Clean up old requests
    const now = Date.now();
    requestTracker.requests = requestTracker.requests.filter(
      time => now - time < rateLimitConfig.windowMs
    );

    // Check if we've hit the limit
    if (requestTracker.requests.length >= rateLimitConfig.maxRequests) {
      console.log('Rate limit reached, throttling requests');
      requestTracker.isRateLimited = true;
      
      // Set a timeout to reset the rate limit
      requestTracker.retryTimeout = setTimeout(() => {
        requestTracker.isRateLimited = false;
        requestTracker.requests = [];
        console.log('Rate limit reset, resuming requests');
      }, rateLimitConfig.retryAfterMs);
      
      throw new Error('Rate limited: Too many requests');
    }

    // Track this request
    requestTracker.requests.push(now);
    return config;
  });
  
  // Add response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    async (error) => {
      if (error.response) {
        // Handle specific error codes
        switch (error.response.status) {
          case 401:
            console.error('Authentication error: Invalid or expired API key');
            // Clear invalid credentials
            if (typeof window !== 'undefined') {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const user = JSON.parse(storedUser);
                // Only clear if this is definitely an auth issue
                if (user.apiKey) {
                  console.log('Clearing invalid credentials');
                  // We'll redirect to login in the UI layer
                }
              }
            }
            break;
            
          case 429:
            console.log('Rate limit hit on GoHighLevel API, implementing backoff');
            // Implement exponential backoff
            const retryCount = error.config.retryCount || 0;
            if (retryCount < rateLimitConfig.maxRetries) {
              const delay = rateLimitConfig.retryAfterMs * Math.pow(2, retryCount);
              console.log(`Retrying after ${delay}ms (retry ${retryCount + 1}/${rateLimitConfig.maxRetries})`);
              
              return new Promise(resolve => {
                setTimeout(() => {
                  error.config.retryCount = retryCount + 1;
                  resolve(client(error.config));
                }, delay);
              });
            }
            break;
        }
      }
      return Promise.reject(error);
    }
  );
  
  return client;
};

/**
 * Get data with caching to reduce API calls
 */
async function getCachedData(endpoint: string, params: any = {}, apiKey: string, forceRefresh = false) {
  // Generate cache key based on endpoint and parameters
  const cacheKey = `${endpoint}:${JSON.stringify(params)}:${apiKey}`;
  const now = Date.now();
  
  // Check if we have valid cached data
  if (!forceRefresh && cache[cacheKey] && now < cache[cacheKey].expiresAt) {
    console.log(`Using cached data for ${endpoint}`);
    return cache[cacheKey].data;
  }
  
  try {
    const client = createGhlApiClient(apiKey);
    const response = await client.get(endpoint, { params });
    
    // Cache the response with expiration
    cache[cacheKey] = { 
      data: response.data, 
      timestamp: now,
      expiresAt: now + CACHE_TTL
    };
    
    return response.data;
  } catch (error) {
    // Check if we have stale cache we can use as fallback
    if (cache[cacheKey]) {
      console.log(`Rate limit hit on GoHighLevel API, using cached data for ${endpoint}`);
      // Extend the expiration to avoid hammering the API
      cache[cacheKey].expiresAt = now + (CACHE_TTL / 3); // Extend by 1/3 of normal TTL
      return cache[cacheKey].data;
    }
    
    // If no cache, propagate the error
    throw error;
  }
}

/**
 * Get contacts from GoHighLevel
 */
export const getContacts = async (apiKey: string, locationId?: string, params = {}) => {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }
  
  try {
    const fullParams = locationId ? { ...params, locationId } : params;
    router.push('/auth/login');

    return await getCachedData('/contacts', fullParams, apiKey);

  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    throw error;
  }
};

/**
 * Get opportunities from GoHighLevel
 */
export const getOpportunities = async (apiKey: string, pipelineId: string, locationId?: string, params = {}) => {
  try {
    const fullParams = locationId ? { ...params, locationId } : params;
    return await getCachedData(`/pipelines/${pipelineId}/opportunities`, fullParams, apiKey);
  } catch (error) {
    console.error('Failed to fetch opportunities:', error);
    throw error;
  }
};

/**
 * Get pipelines from GoHighLevel
 */
export const getPipelines = async (apiKey: string, locationId?: string, params = {}) => {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }
  
  try {
    const fullParams = locationId ? { ...params, locationId } : params;
    return await getCachedData('/pipelines', fullParams, apiKey);
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    throw error;
  }
};

/**
 * Get calls from GoHighLevel
 */
export const getCalls = async (apiKey: string, locationId?: string, params = {}) => {
  try {
    const fullParams = locationId ? { ...params, locationId } : params;
    return await getCachedData('/calls', fullParams, apiKey);
  } catch (error) {
    console.error('Failed to fetch calls:', error);
    throw error;
  }
};

/**
 * General-purpose API request with error handling
 */
export const fetchWithErrorHandling = async <T>(
  apiFunction: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<{ data?: T; error?: string }> => {
  try {
    const data = await apiFunction(...args);
    return { data };
  } catch (error: any) {
    const errorMessage = error.response?.status === 429
      ? 'Rate limit exceeded. Please try again later.'
      : error.response?.data?.message || error.message || 'An error occurred';
    
    return { error: errorMessage };
  }
};

// Get a single contact by ID
export async function getContact(contactId: string) {
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  const response = await axios.get(`${GHL_BASE_URL}/contacts/${contactId}`);
  return response.data;
}

// Create a new contact
export async function createContact(contactData: any) {
  const response = await axios.post(`${GHL_BASE_URL}/contacts/`, contactData);
  return response.data;
}

// Update an existing contact
export async function updateContact(contactId: string, contactData: any) {
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  const response = await axios.put(`${GHL_BASE_URL}/contacts/${contactId}`, contactData);
  return response.data;
}

// Create a new opportunity
export async function createOpportunity(pipelineId: string, opportunityData: any) {
  if (!pipelineId) {
    throw new Error('Pipeline ID is required');
  }
  const response = await axios.post(`${GHL_BASE_URL}/pipelines/${pipelineId}/opportunities`, opportunityData);
  return response.data;
}

// Update an existing opportunity
export async function updateOpportunity(pipelineId: string, opportunityId: string, opportunityData: any) {
  if (!pipelineId || !opportunityId) {
    throw new Error('Pipeline ID and Opportunity ID are required');
  }
  const response = await axios.put(`${GHL_BASE_URL}/pipelines/${pipelineId}/opportunities/${opportunityId}`, opportunityData);
  return response.data;
}

// Log a new call
export async function logCall(callData: any) {
  const response = await axios.post(`${GHL_BASE_URL}/calls/`, callData);
  return response.data;
}

// Update the validation function to check API key format
function validateApiKey(apiKey: string): boolean {
  // Basic validation - ensure key exists and has reasonable length
  if (!apiKey || apiKey.length < 20) {
    return false;
  }
  
  // Check for expected format (this is a simplified check)
  const validFormat = /^[a-zA-Z0-9_-]{20,}$/.test(apiKey);
  
  return validFormat;
}

// Modify the existing getContacts function - DON'T redeclare it
async function getContacts(params: any = {}, apiKey = DEFAULT_API_KEY, locationId = DEFAULT_LOCATION_ID) {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }
  
  try {
    const fullParams = {
      locationId,
      ...params,
    };
    
    const data = await getCachedData('/contacts', fullParams, apiKey);
    return data;
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    throw error;
  }
}

// Modify the existing getPipelines function - DON'T redeclare it
async function getPipelines(params: any = {}, apiKey = DEFAULT_API_KEY, locationId = DEFAULT_LOCATION_ID) {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }
  
  try {
    const fullParams = {
      locationId,
      ...params,
    };
    
    const data = await getCachedData('/pipelines', fullParams, apiKey);
    return data;
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    throw error;
  }
}

// Similarly update other API functions that use direct API calls

// ... rest of the code ...

// Make sure we're exporting all the functions we need
export {
  createGhlApiClient,
  getContacts,
  getOpportunities,
  getPipelines,
  getCalls,
  fetchWithErrorHandling,
  validateApiKey,
  getCachedData,
  DEFAULT_API_KEY,
  DEFAULT_LOCATION_ID
}; 