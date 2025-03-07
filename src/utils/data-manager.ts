'use client';

import { useEffect, useState, useCallback } from 'react';

// Define common types
export type DataStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DataState<T> {
  data: T | null;
  status: DataStatus;
  error: Error | null;
  timestamp: number;
}

export interface CacheOptions {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_OPTIONS: CacheOptions = {
  cacheKey: 'default',
  ttl: DEFAULT_TTL,
  staleWhileRevalidate: true,
};

// In-memory cache (will be lost on page refresh)
const memoryCache: Record<string, DataState<any>> = {};

// Local storage cache helper functions
const getFromStorage = <T>(key: string): DataState<T> | null => {
  try {
    const item = localStorage.getItem(`nextprop_cache_${key}`);
    if (!item) return null;
    return JSON.parse(item);
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return null;
  }
};

const saveToStorage = <T>(key: string, data: DataState<T>): void => {
  try {
    localStorage.setItem(`nextprop_cache_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
};

// Hook for data fetching with caching
export function useDataFetch<T, P extends any[] = []>(
  fetcher: (...params: P) => Promise<T>,
  options: Partial<CacheOptions> = {},
) {
  // Merge provided options with defaults
  const { cacheKey, ttl, staleWhileRevalidate } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const [state, setState] = useState<DataState<T>>({
    data: null,
    status: 'idle',
    error: null,
    timestamp: 0,
  });

  const executeFetch = useCallback(
    async (...params: P) => {
      const fetchKey = `${cacheKey}_${JSON.stringify(params)}`;
      
      // Check memory cache first
      const memCachedData = memoryCache[fetchKey];
      
      // Check local storage if not in memory
      const storageCachedData = !memCachedData 
        ? getFromStorage<T>(fetchKey) 
        : null;
      
      const cachedData = memCachedData || storageCachedData;
      
      // Check if cache is valid
      const now = Date.now();
      const isCacheValid = cachedData && (now - cachedData.timestamp < (ttl || DEFAULT_TTL));
      
      // If we have valid cache and not stale-while-revalidate, return it
      if (isCacheValid && !staleWhileRevalidate) {
        setState(cachedData);
        return cachedData.data;
      }
      
      // If we have cache (valid or not) and using stale-while-revalidate
      if (cachedData && staleWhileRevalidate) {
        setState(cachedData);
      } else {
        // Otherwise show loading state
        setState(prev => ({ ...prev, status: 'loading' }));
      }
      
      // Fetch fresh data
      try {
        const data = await fetcher(...params);
        
        const newState: DataState<T> = {
          data,
          status: 'success',
          error: null,
          timestamp: Date.now(),
        };
        
        // Update state
        setState(newState);
        
        // Update caches
        memoryCache[fetchKey] = newState;
        saveToStorage(fetchKey, newState);
        
        return data;
      } catch (error) {
        const errorState: DataState<T> = {
          data: cachedData?.data || null,
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: Date.now(),
        };
        
        setState(errorState);
        
        // If we have stale data, we still return it on error
        if (cachedData) {
          return cachedData.data;
        }
        
        throw error;
      }
    },
    [cacheKey, ttl, staleWhileRevalidate]
  );

  // Add the refresh function with proper type handling
  const refresh = useCallback(() => {
    return executeFetch(...([] as unknown as P));
  }, [executeFetch]);
  
  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    executeFetch,
    refresh,
  };
}

// Utility to clear all caches
export function clearAllCaches(): void {
  // Clear memory cache
  Object.keys(memoryCache).forEach(key => {
    delete memoryCache[key];
  });
  
  // Clear local storage cache
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    if (key.startsWith('nextprop_cache_')) {
      localStorage.removeItem(key);
    }
  });
}

// Utility to clear specific cache by key
export function clearCache(cacheKey: string): void {
  // Clear from memory cache
  Object.keys(memoryCache).forEach(key => {
    if (key.startsWith(cacheKey)) {
      delete memoryCache[key];
    }
  });
  
  // Clear from local storage
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach(key => {
    if (key.startsWith(`nextprop_cache_${cacheKey}`)) {
      localStorage.removeItem(key);
    }
  });
}

// Batch operations helper
export interface BatchOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

export async function executeBatch<T, P>(
  items: P[],
  operation: (item: P) => Promise<T>,
  options: BatchOptions = {}
): Promise<T[]> {
  const { 
    concurrency = 3,
    onProgress = () => {} 
  } = options;
  
  const results: T[] = [];
  let completed = 0;
  const total = items.length;
  
  // Process in chunks based on concurrency
  for (let i = 0; i < total; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    
    const chunkPromises = chunk.map(async (item) => {
      try {
        const result = await operation(item);
        completed++;
        onProgress(completed, total);
        return result;
      } catch (error) {
        completed++;
        onProgress(completed, total);
        throw error;
      }
    });
    
    const chunkResults = await Promise.allSettled(chunkPromises);
    
    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Error in batch operation:', result.reason);
      }
    }
  }
  
  return results;
} 