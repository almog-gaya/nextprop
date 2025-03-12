import { GHL_AUTH_CONFIG } from "@/lib/ghlAuth";
import { CookieOptions, TokenResponse } from "@/types/auth";
import { cookies } from "next/headers";
const COOKIE_DEFAULTS: CookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
};

export const exchangeCodeForTokens = async (code: string): Promise<TokenResponse> => {
    const data = new URLSearchParams({
        client_id: GHL_AUTH_CONFIG.clientId,
        client_secret: GHL_AUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code,
        user_type: 'Location',
        redirect_uri: GHL_AUTH_CONFIG.redirectUri,
    });

    const response = await fetch(GHL_AUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to exchange code for tokens');
    }

    return response.json();
};

export const setAuthCookies = (cookieStore: any, tokenResponse: TokenResponse) => {
    const cookieOptions = { ...COOKIE_DEFAULTS };

    // Required cookies
    cookieStore.set('ghl_access_token', tokenResponse.access_token, cookieOptions);
    cookieStore.set('ghl_token_timestamp', Date.now().toString(), cookieOptions);

    // Optional cookies with fallbacks
    if (tokenResponse.locationId) cookieStore.set('ghl_location_id', tokenResponse.locationId, cookieOptions);
    if (tokenResponse.userId) cookieStore.set('ghl_user_id', tokenResponse.userId, cookieOptions);
    if (tokenResponse.companyId) cookieStore.set('ghl_company_id', tokenResponse.companyId, cookieOptions);
    if (tokenResponse.refresh_token) cookieStore.set('ghl_refresh_token', tokenResponse.refresh_token, cookieOptions);

    // User type with fallback
    const userTypeValue = tokenResponse.userType || 'Location';
    console.log('Setting ghl_user_type to:', userTypeValue);
    cookieStore.set('ghl_user_type', userTypeValue, cookieOptions);
};

export const logTokenResponse = (tokens: TokenResponse) => {
    console.log('=== GHL Token Response ===');
    console.log('Full tokens object:', JSON.stringify(tokens, null, 2));
    console.log('userType exists:', 'userType' in tokens);
    console.log('userType value:', tokens.userType);
    console.log('===================');
};

export const getRedirectUrl = (base: string, success: boolean, error?: Error) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || base;
    const url = new URL(success ? '/' : '/auth/login', baseUrl);

    if (success) {
        url.searchParams.set('auth', 'success');
    } else if (error) {
        url.searchParams.set('error', 'auth_failed');
        url.searchParams.set('message', error.message);
    }

    return url;
};

export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
    const data = new URLSearchParams({
        client_id: GHL_AUTH_CONFIG.clientId,
        client_secret: GHL_AUTH_CONFIG.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

    const response = await fetch(GHL_AUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh token');
    }

    return response.json();
};

/// With threshold of 1 hour before expiration
 export const shouldRefreshToken = (tokenTimestamp: string) => {
    const now = Date.now();
    const tokenAge = now - parseInt(tokenTimestamp);
    const maxAgeMs = COOKIE_DEFAULTS.maxAge! * 1000; 
    const refreshThreshold = maxAgeMs - (60 * 60 * 1000); 
    return tokenAge < maxAgeMs && tokenAge > refreshThreshold;
};

//Completely expired
export const isTokenExpired = (tokenTimestamp: string) => {
    const now = Date.now();
    const tokenAge = now - parseInt(tokenTimestamp);
    return tokenAge >= COOKIE_DEFAULTS.maxAge! * 1000;
};
export const clearAuthCookies = (cookieStore: any) => {
    cookieStore.delete('ghl_access_token');
    cookieStore.delete('ghl_refresh_token');
    cookieStore.delete('ghl_token_timestamp');
    cookieStore.delete('ghl_location_id');
    cookieStore.delete('ghl_user_id');
    cookieStore.delete('ghl_company_id');
    cookieStore.delete('ghl_user_type');
};



/**
 returns:
    {
        access_token,
        expires_in,
        token_type,
        refresh_token,
        id_token,
        user_id,
        project_id, 
    }
 */
/**
 * Refreshes the authentication token only if the current token is older than 40 minutes
 * @returns {Promise<Object>} The token response data containing:
 *   - access_token
 *   - expires_in
 *   - token_type
 *   - refresh_token
 *   - id_token
 *   - user_id
 *   - project_id
 */
export const refreshTokenIdBackend = async () => {
    try {
      const cookieStore = await cookies();
      const currentToken = cookieStore.get('token_id')?.value;
      const refreshToken = cookieStore.get('token_id_refresh')?.value || 'AMf-vBwVv8zF2qFKjAxaeNX8hffkiGsLenYQQyzfaMCD5ZgldF0elrHBjwk_LPiJDSdEMRofwmR8l6FXjU2QpcZlPZqQXlzPpTbpFgqDcsKN_i17EwNGgqC3L0ZvVjHLjJ6CT-k5bdpqfrH3b0IilK1tXH0fjtHwpajPtc6bHPk5hXYBOWuX2fv3zUKRYV9pRjTeMEH8LPQuQ6776u8t1tJZ13Aj87xZfFF4kfUnmydUTWrt38Rmc5FFHzt79b_vNpX5fFOnRxGFIAWzbi-MPbksrFHANZx508VN0LYFrUYdKz_6siHJMIJgGBBgWDsBpTjnLZ7_9ueJ1KZDdR9rj7c05QKfvYESfp-5YUdXZy1nHLpWLKRbN-gjwXawLVE9nNKHxJsZKuOI2CH4C9a0F6ZnmFRrQ27jia55MDU4TuL7tW-VMn95gtIGfTIzqZVoxZGpFrEsGg9_JRcpcK-nyUUhCA1BPBuTQLJDoNXcJ0ouGzgU7Mh3x4uvkBiKsf81AZoKKl3XNA_i';
      const tokenTimestamp = cookieStore.get('token_id_timestamp')?.value;
  
      // Check if we have a valid refresh token
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new Error('No valid refresh token found');
      }
  
      // Check if current token is still valid (less than 40 minutes old)
      const now = Date.now();
      const tokenAge = tokenTimestamp ? now - parseInt(tokenTimestamp, 10) : Infinity;
      const TOKEN_MAX_AGE = 40 * 60 * 1000; // 40 minutes in milliseconds
  
      // If token exists and is less than 40 minutes old, return cached token info
      if (currentToken && tokenAge < TOKEN_MAX_AGE) {
        console.log('[RefreshTokenId] Using cached token (age: ' + Math.round(tokenAge / 60000) + ' minutes)');
  
        // Return the cached complete token data if available
        const cachedTokenData = cookieStore.get('token_data')?.value;
        if (cachedTokenData) {
          try {
            const parsedData = JSON.parse(cachedTokenData);
            return { ...parsedData, cached: true };
          } catch (e) {
            console.log('[RefreshTokenId] Could not parse cached token data, will refresh');
            // If parsing fails, continue to refresh the token
          }
        }
      }
  
      // Token doesn't exist, is expired, or cache parsing failed - refresh it
      console.log('[RefreshTokenId] Token expired or missing, refreshing...');
  
      // Create form data (application/x-www-form-urlencoded format)
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
  
      const urlencoded = new URLSearchParams();
      urlencoded.append('grant_type', 'refresh_token');
      urlencoded.append('refresh_token', refreshToken);
  
      // Set up request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
      const response = await fetch(
        'https://securetoken.googleapis.com/v1/token?key=AIzaSyB_w3vXmsI7WeQtrIOkjR6xTRVN5uOieiE',
        {
          method: 'POST',
          headers: myHeaders,
          body: urlencoded,
          redirect: 'follow',
        }
      );
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed with status ${response.status}: ${errorText}`);
      }
  
      const responseBody = await response.json();
  
      // Validate the response contains the expected fields
      const requiredFields = ['access_token', 'expires_in', 'refresh_token', 'id_token', 'user_id', 'project_id'];
      const missingFields = requiredFields.filter(field => !responseBody[field]);
  
      if (missingFields.length > 0) {
        console.warn(`[RefreshTokenId] Response missing fields: ${missingFields.join(', ')}`);
      }
  
      // Store all tokens and metadata
      cookieStore.set('token_id', responseBody.id_token);
      cookieStore.set('token_id_refresh', responseBody.refresh_token);
      cookieStore.set('token_id_timestamp', now.toString());
  
      // Store the complete token data as JSON for later use
      cookieStore.set('token_data', JSON.stringify({
        access_token: responseBody.access_token,
        expires_in: responseBody.expires_in,
        token_type: responseBody.token_type,
        refresh_token: responseBody.refresh_token,
        id_token: responseBody.id_token,
        user_id: responseBody.user_id,
        project_id: responseBody.project_id
      }));
  
      console.log('[RefreshTokenId] Token refreshed successfully');
      return {
        ...responseBody,
        cached: false
      };
    } catch (error) {
      console.error(`[RefreshTokenId] Error: ${error.message}`);
  
      if (error.name === 'AbortError') {
        throw new Error('Token refresh request timed out');
      }
  
      throw error;
    }
  };