import axios from 'axios';

const API_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Default values for API access
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_GHL_API_KEY || '';
const DEFAULT_LOCATION_ID = process.env.NEXT_PUBLIC_GHL_LOCATION_ID || '';

// Function to get the current user's API key
export function getCurrentApiKey() {
  if (typeof window !== 'undefined') {
    try {
      // Try to get from localStorage first
      const storedUser = localStorage.getItem('nextprop_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.apiKey && validateApiKey(user.apiKey)) {
          return user.apiKey;
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

// Create API client with better error handling
const createGhlApiClient = (apiKey: string) => {
  const client = axios.create({
    baseURL: 'https://rest.gohighlevel.com/v1',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

// Helper function for API validation
function validateApiKey(apiKey: string): boolean {
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
  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid API key format');
  }
  
  try {
    const fullParams = {
      ...params,
    };
    
    const data = await getCachedData('/pipelines/', fullParams, apiKey);
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

        console.error('API Error:', message);
        return { error: message, status };
      }
    }

    console.error('Unknown error:', error);
    return { error: 'An unexpected error occurred.', status: 500 };
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