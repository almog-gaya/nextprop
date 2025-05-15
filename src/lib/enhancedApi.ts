import { refreshAccessToken, setAuthCookies, shouldRefreshToken } from '@/utils/authUtils';
import axios from 'axios';

const API_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Default values for API access
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_GHL_API_KEY || '';
const DEFAULT_LOCATION_ID = process.env.NEXT_PUBLIC_GHL_LOCATION_ID || '';

// Add logging control to reduce console noise
const ENABLE_VERBOSE_LOGGING = false;

const log = (message: string, data?: any) => {
  if (ENABLE_VERBOSE_LOGGING) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Only show actual errors in console
const logError = (message: string, error?: any) => {
  console.error(message, error);
};

// Function to get the current user's API key
export function getCurrentApiKey() {
  if (typeof window !== 'undefined') {
    try {
      // Try to get from localStorage first
      const storedUser = localStorage.getItem('nextprop_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.ghlApiKey && validateApiKey(user.ghlApiKey)) {
          return user.ghlApiKey;
        }
      }

      // If not in localStorage, try to get from nextprop_token
      const token = localStorage.getItem('nextprop_token');
      if (token && validateApiKey(token)) {
        return token;
      }
    } catch (error) {
      console.error('Error getting API key from session:', error);
    }
  }

  // Fall back to default API key
  return DEFAULT_API_KEY;
}

// Rate limiting implementation
const rateLimitConfig = {
  maxRequestsPerWindow: 10,
  windowMs: 1000, // 1 second
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryMultiplier: 2 // Exponential backoff multiplier
};

// Request tracking for rate limiting
const requestTracker = {
  requests: [] as number[],
  isRateLimited: false,
  retryTimeout: null as NodeJS.Timeout | null,
};

// Handle rate limits and retries
async function executeRequest(request: any) {
  let retryCount = 0;
  
  const makeRequest = async () => {
    try {
      const response = await fetch(request.url, request.options);
      
      // Check for invalid credentials
      if (response.status === 401) {
        log('Clearing invalid credentials');
        // Handle invalid credentials
        // e.g., clearCredentials();
        return { error: 'Invalid credentials', status: 401 };
      }
      
      // Handle rate limits
      if (response.status === 429) {
        logError('Rate limit hit on GoHighLevel API, implementing backoff');
        
        if (retryCount < rateLimitConfig.maxRetries) {
          const delay = rateLimitConfig.retryDelay * Math.pow(rateLimitConfig.retryMultiplier, retryCount);
          log(`Retrying after ${delay}ms (retry ${retryCount + 1}/${rateLimitConfig.maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          return makeRequest();
        } else {
          return { error: 'Rate limit exceeded and max retries reached', status: 429 };
        }
      }
      
      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { ...data, status: response.status };
      } else {
        const text = await response.text();
        return { data: text, status: response.status };
      }
      
    } catch (error: any) {
      logError('Fetch error:', error);
      return { error: error.message, status: 0 };
    }
  };
  
  return makeRequest();
}

// Enhanced caching with expiration
const cache: Record<string, { data: any; timestamp: number; expiresAt: number }> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache lifetime

// Create API client with better error handling
const createGhlApiClient = (apiKey: string) => {
  const client = axios.create({
    baseURL: 'https://services.leadconnectorhq.com',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-04-15',
      Accept: 'application/json',
    },
  });

  // Add request interceptor for rate limiting (simple version)
  client.interceptors.request.use(async (config) => {
    // Simple implementation without the requestTracker
    return config;
  });

  // Add response interceptor for handling errors and rate limits
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      // Handle rate limiting
      if (error.response && error.response.status === 429) {
        logError('Rate limit hit on GoHighLevel API, implementing backoff');
        
        const retryCount = error.config.retryCount || 0;
        if (retryCount < rateLimitConfig.maxRetries) {
          const delay = rateLimitConfig.retryDelay * Math.pow(rateLimitConfig.retryMultiplier, retryCount);
          log(`Retrying after ${delay}ms (retry ${retryCount + 1}/${rateLimitConfig.maxRetries})`);
          
          // Wait for the specified delay
          await new Promise((resolve) => setTimeout(resolve, delay));
          
          // Update retry count
          error.config.retryCount = retryCount + 1;
          
          // Retry the request
          return client(error.config);
        }
      }
      
      // Re-throw the error if we're not retrying
      return Promise.reject(error);
    }
  );

  return client;
};

// Helper function for API validation
function validateApiKey(apiKey: string): boolean {
  return true;
  // Basic validation - ensure key exists and has reasonable length
  if (!apiKey || apiKey.length < 20) {
    return false;
  }

  // Check for JWT format (three parts separated by dots)
  // Many JWT tokens may include other characters, so this is a more permissive check
  const jwtPattern = /^[\w-]+\.[\w-]+\.[\w-]+$/;

  // Check for traditional API key format
  const apiKeyPattern = /^[a-zA-Z0-9_-]{20,}$/;

  // For debugging - remove in production
  console.log('API Key validation:', apiKey.substring(0, 10) + '...',
    'JWT format:', jwtPattern.test(apiKey),
    'API key format:', apiKeyPattern.test(apiKey));

  // Return true if it matches either pattern
  return jwtPattern.test(apiKey) || apiKeyPattern.test(apiKey);
}

// Enhanced API data fetching with caching
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

// Fetch contacts from API
async function getContacts(params: any = {}, apiKey = getCurrentApiKey(), locationId = DEFAULT_LOCATION_ID, forceRefresh = false) {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }

  try {
    const fullParams = {
      locationId,
      ...params,
    };

    const data = await getCachedData('/contacts', fullParams, apiKey, forceRefresh);
    return data;
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    throw error;
  }
}

// Fetch opportunities from API
async function getOpportunities(pipelineId: string, params: any = {}, apiKey = getCurrentApiKey(), locationId = DEFAULT_LOCATION_ID) {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }

  try {
    const fullParams = {
      ...params,
    };

    const data = await getCachedData(`/pipelines/${pipelineId}/opportunities/`, fullParams, apiKey);
    return data;
  } catch (error) {
    console.error('Failed to fetch opportunities:', error);
    throw error;
  }
}

// Fetch pipelines from API
async function getPipelines(params: any = {}, apiKey = getCurrentApiKey(), locationId = DEFAULT_LOCATION_ID) {
  console.log('getPipelines called with apiKey:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'none');
  console.log('locationId:', locationId || 'none');

  if (!validateApiKey(apiKey)) {
    console.error('API key validation failed in getPipelines');
    throw new Error('Invalid API key format');
  }

  try {
    const fullParams = {
      ...params,
    };

    console.log('Fetching pipeline data from API...');
    const data = await getCachedData('/pipelines/', fullParams, apiKey);
    console.log('Pipeline data fetched successfully:', data ? 'Data received' : 'No data');
    return data;
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    throw error;
  }
}

// Fetch calls from API
async function getCalls(params: any = {}, apiKey = getCurrentApiKey(), locationId = DEFAULT_LOCATION_ID) {
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }

  try {
    const fullParams = {
      locationId,
      ...params,
    };

    const data = await getCachedData('/calls', fullParams, apiKey);
    return data;
  } catch (error) {
    console.error('Failed to fetch calls:', error);
    throw error;
  }
}

// Generic error handler for API requests
async function fetchWithErrorHandling<T>(fetcher: () => Promise<T>) {
  try {
    return await fetcher();
  } catch (error) {
    console.error('Error in fetchWithErrorHandling:', error);

    // Check if it's an API key validation error
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      console.error('API key validation error:', error.message);
      return {
        error: 'The GoHighLevel API key is invalid or missing. Please update your API key in settings.',
        status: 401,
        details: error.message
      };
    }

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        let message = 'An error occurred while fetching data.';

        if (status === 401) {
          message = 'Authentication failed. Please check your API key.';
        } else if (status === 403) {
          message = 'You do not have permission to access this resource.';
        } else if (status === 404) {
          message = 'The requested resource was not found.';
        } else if (status === 429) {
          message = 'Too many requests, please try again later.';
        } else if (status >= 500) {
          message = 'A server error occurred. Please try again later.';
        }

        console.error('API Error:', message, error.response.data);
        return { error: message, status, details: error.response.data };
      }
    }

    console.error('Unknown error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { error: errorMessage, status: 500 };
  }
}

export async function updateContact(contactId: string, data: any) {
  const apiKey = await getCurrentApiKey();
  if (!apiKey) {
    throw new Error('API key not found');
  }

  // Clean up the data for GHL API
  const updateData = {
    contactName: data.contactName,
    firstName: data.firstName,
    lastName: data.lastName
  };

  console.log('Sending update to GHL:', updateData);

  // Clear all contact-related cache before the update
  Object.keys(cache).forEach(key => {
    if (key.includes('/contacts')) {
      delete cache[key];
    }
  });

  // Update the contact
  const updateResponse = await axios.put(
    `${API_BASE_URL}/contacts/${contactId}`,
    updateData,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  // Small delay to ensure GHL has processed the update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Then fetch the updated contact
  const getResponse = await axios.get(
    `${API_BASE_URL}/contacts/${contactId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const updatedContact = getResponse.data;

  // Update the cache with the new data
  const cacheKey = `/contacts/${contactId}`;
  cache[cacheKey] = {
    data: updatedContact,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL
  };

  return updatedContact;
}

export async function deleteContact(contactId: string) {
  const apiKey = await getCurrentApiKey();
  if (!apiKey) {
    throw new Error('API key not found');
  }

  const response = await axios.delete(
    `${API_BASE_URL}/contacts/${contactId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  return response.data;
}

 const getAuthHeaders = async () => {
  
  const {cookies} = await import('next/headers');
  const cookieStore = await cookies();
  
  const token = cookieStore.get('ghl_access_token');
  const refreshToken = cookieStore.get('ghl_refresh_token');
  const timestamp = cookieStore.get('ghl_token_timestamp');
  const locationId = cookieStore.get('ghl_location_id');

  // Check if we have all required values
  if (!token?.value || !timestamp?.value) {
      throw new Error('Missing authentication credentials');
  }

  // Check if token needs refreshing
  if (refreshToken?.value && shouldRefreshToken(timestamp.value)) {
      try {
          const newTokens = await refreshAccessToken(refreshToken.value);
          // Update cookies with new tokens
          setAuthCookies(cookieStore, newTokens);
          return {
              token: newTokens.access_token,
              locationId: locationId?.value
          };
      } catch (error) {
          console.error('Failed to refresh token:', error);
          // Return existing token if refresh fails (it might still be valid)
      }
  }

  // Return existing values if no refresh needed or refresh failed
  return {
      token: token.value,
      locationId: locationId?.value
  };
};

// Optional: Add a force refresh function
 const forceRefreshToken = async () => {

  const {cookies} = await import('next/headers');
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('ghl_refresh_token');
  
  if (!refreshToken?.value) {
      throw new Error('No refresh token available');
  }

  const newTokens = await refreshAccessToken(refreshToken.value);
  setAuthCookies(cookieStore, newTokens);
  return {
      token: newTokens.access_token,
      locationId: cookieStore.get('ghl_location_id')?.value
  };
};
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
  DEFAULT_LOCATION_ID,
  getAuthHeaders,
  forceRefreshToken
}; 