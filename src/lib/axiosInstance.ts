import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

// Define interface for Business data
interface Business {
  id: string;
}

// Custom error classes for better error handling
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 10000,
});

// Cache for storing userId and businessId
const authCache = {
  userId: null as string | null,
  businessId: null as string | null,
  lastFetched: 0,
  cacheDuration: 5 * 60 * 1000,
};

// Function to clear the auth cache
export const clearAuthCache = (): void => {
  authCache.userId = null;
  authCache.businessId = null;
  authCache.lastFetched = 0;
};

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const now = Date.now();
      if (
        authCache.userId &&
        authCache.businessId &&
        now - authCache.lastFetched < authCache.cacheDuration
      ) {
        const newConfig = { ...config };
        newConfig.headers['X-User-Id'] = authCache.userId;
        newConfig.headers['X-Business-Id'] = authCache.businessId;
        return newConfig;
      }

      const userId = await getUserId();
      if (!userId) {
        throw new AuthError('No authenticated user found');
      }

      const businessId = await getBusinessId(userId);
      if (!businessId) {
        throw new BusinessError('No business found for user');
      }

      authCache.userId = userId;
      authCache.businessId = businessId;
      authCache.lastFetched = now;

      const newConfig = { ...config };
      newConfig.headers['X-User-Id'] = userId;
      newConfig.headers['X-Business-Id'] = businessId;
      return newConfig;
    } catch (error) {
      console.error('[Axios]: Request interceptor error:', error);
      throw error; // Re-throw the error to be caught by the caller
    }
  },
  (error) => Promise.reject(error)
);

// Get user ID from session
const getUserId = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[Axios]: Error fetching session:', error);
      return null;
    }
    return session?.user.id ?? null;
  } catch (error) {
    console.error('[Axios]: Unexpected error in getUserId:', error);
    return null;
  }
};

// Get business ID for user
const getBusinessId = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Axios]: Error fetching business ID:', error);
      return null;
    }
    return (data as Business)?.id ?? null;
  } catch (error) {
    console.error('[Axios]: Unexpected error in getBusinessId:', error);
    return null;
  }
};

export default axiosInstance;