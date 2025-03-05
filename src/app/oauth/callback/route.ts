import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GHL_AUTH_CONFIG } from '@/lib/ghlAuth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    console.log('1. Received OAuth callback with code:', code);
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
    }

    // Exchange code for tokens directly with GHL
    console.log('2. Exchanging code for tokens...');
    const data = new URLSearchParams({
      client_id: GHL_AUTH_CONFIG.clientId,
      client_secret: GHL_AUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      user_type: 'Location',
      redirect_uri: GHL_AUTH_CONFIG.redirectUri
    });

    const response = await fetch(GHL_AUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: data
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to exchange code for tokens');
    }

    const tokens = await response.json();
    console.log('Token response:', {
      access_token: tokens.access_token,
      location_id: tokens.location_id
    });
    
    // Store tokens in cookies
    const cookieStore = await cookies();
    
    // Store the access token
    cookieStore.set('ghl_access_token', tokens.access_token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', // Ensure cookie is available for all paths
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    // Store location ID if available
    if (tokens.location_id) {
      cookieStore.set('ghl_location_id', tokens.location_id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
    }

    // Store the raw token data for debugging
    cookieStore.set('ghl_token_data', JSON.stringify({
      access_token: tokens.access_token,
      location_id: tokens.location_id
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    console.log('4. Cookies set with token data');
    if (tokens.refresh_token) {
      cookieStore.set('ghl_refresh_token', tokens.refresh_token, {
        httpOnly: true, // Keep refresh token secure
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    if (tokens.locationData) {
      cookieStore.set('ghl_location_data', JSON.stringify(tokens.locationData), {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    console.log('4. Cookies set, redirecting to dashboard...');
    
    // Add success flag and token info in URL
    const dashboardUrl = new URL('/', request.url);
    dashboardUrl.searchParams.set('auth', 'success');
    dashboardUrl.searchParams.set('token_status', 'set');
    
    console.log('5. Redirect URL:', dashboardUrl.toString());
    
    return NextResponse.redirect(dashboardUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = new URL('/auth/login', request.url);
    errorUrl.searchParams.set('error', 'auth_failed');
    errorUrl.searchParams.set('message', (error as Error).message);
    return NextResponse.redirect(errorUrl);
  }
}