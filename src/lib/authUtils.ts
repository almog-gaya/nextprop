/**
 * Utility functions for authentication management
 */

import Cookies from 'js-cookie';
import { NextRequest } from 'next/server';

/**
 * Flushes all authentication data from the system
 * This includes localStorage user data and authentication cookies
 */
export function flushAllAuthData() {
  if (typeof window !== 'undefined') {
    // Clear all possible localStorage keys
    localStorage.removeItem('user');
    localStorage.removeItem('nextprop_user');
    localStorage.removeItem('nextprop_token');
    
    // Clear auth tokens from cookies (multiple methods to ensure all are cleared)
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'nextprop_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Also clear all GHL cookies on client side
    document.cookie = 'ghl_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_token_timestamp=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_location_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_company_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_location_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'ghl_token_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Use js-cookie for the nextprop_token
    try {
      Cookies.remove('nextprop_token', { path: '/' });
      Cookies.remove('auth_token', { path: '/' });
      
      // Also remove GHL cookies with js-cookie
      Cookies.remove('ghl_access_token', { path: '/' });
      Cookies.remove('ghl_refresh_token', { path: '/' });
      Cookies.remove('ghl_token_timestamp', { path: '/' });
      Cookies.remove('ghl_location_id', { path: '/' });
      Cookies.remove('ghl_user_id', { path: '/' });
      Cookies.remove('ghl_company_id', { path: '/' });
      Cookies.remove('ghl_user_type', { path: '/' });
      Cookies.remove('ghl_location_data', { path: '/' });
      Cookies.remove('ghl_token_data', { path: '/' });
    } catch (e) {
      console.warn('Error removing cookie with js-cookie:', e);
    }
    
    // Call the logout API to ensure server-side cookies are cleared
    try {
      fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Error calling logout API:', e);
    }
    
    console.log('All authentication data has been flushed');
    return true;
  }
  return false;
}

/**
 * Sets all authentication data consistently across the system
 * This ensures both authentication systems have the necessary data
 */
export function setAllAuthData(userData: any, token: string) {
  if (typeof window !== 'undefined') {
    // Set localStorage data
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('nextprop_user', JSON.stringify(userData));
    localStorage.setItem('nextprop_token', token);
    
    // Set cookies (two methods to ensure both authentication systems work)
    document.cookie = `auth_token=${token}; path=/; max-age=86400`;
    try {
      Cookies.set('nextprop_token', token, { 
        expires: 7, // 7 days
        path: '/',
        sameSite: 'strict'
      });
    } catch (e) {
      console.warn('Error setting cookie with js-cookie:', e);
    }
    
    console.log('All authentication data has been set');
    return true;
  }
  return false;
}

/**
 * Gets the authentication token from a NextRequest
 * Checks both possible cookie names for compatibility
 */
export function getAuthToken(request: NextRequest): string | null {
  // Try to get the token from both possible cookie names
  const authToken = request.cookies.get('auth_token')?.value;
  const nextpropToken = request.cookies.get('nextprop_token')?.value;
  
  // Return the first valid token found
  if (authToken && authToken.length >= 20) {
    return authToken;
  }
  
  if (nextpropToken && nextpropToken.length >= 20) {
    return nextpropToken;
  }
  
  return null;
}

/**
 * Temporary fallback to get the demo user email when token decoding fails
 * This is for development/demo purposes only and should be replaced with proper token decoding
 */
export function getTemporaryDemoEmail(): string {
  return 'demo@example.com';
} 