import { GHL_AUTH_CONFIG } from "@/lib/ghlAuth";
import { CookieOptions, TokenResponse } from "@/types/auth";
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