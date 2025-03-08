import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GHL_AUTH_CONFIG } from '@/lib/ghlAuth';

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('ghl_refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
    }

    // Prepare the token refresh request
    const data = new URLSearchParams({
      client_id: GHL_AUTH_CONFIG.clientId,
      client_secret: GHL_AUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    // Make the request to refresh the token
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
      console.error('Token refresh failed:', errorData);
      // Clear all auth cookies if refresh fails
      cookieStore.delete('ghl_access_token');
      cookieStore.delete('ghl_refresh_token');
      cookieStore.delete('ghl_location_id');
      cookieStore.delete('ghl_user_id');
      cookieStore.delete('ghl_user_type');
      cookieStore.delete('ghl_company_id');
      cookieStore.delete('ghl_token_timestamp');
      
      return NextResponse.json({ 
        error: 'Failed to refresh token', 
        message: errorData.message || 'Unknown error'
      }, { status: 401 });
    }

    // Get the new tokens
    const tokens = await response.json();
    console.log('Token refresh successful:', tokens);

    // Set the new access token
    cookieStore.set('ghl_access_token', tokens.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Store the timestamp when we refreshed the token
    cookieStore.set('ghl_token_timestamp', Date.now().toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set the new refresh token if provided
    if (tokens.refresh_token) {
      cookieStore.set('ghl_refresh_token', tokens.refresh_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Update other tokens if provided
    if (tokens.locationId) {
      cookieStore.set('ghl_location_id', tokens.locationId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Token refreshed successfully',
      expiresIn: tokens.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh token', 
      message: (error as Error).message 
    }, { status: 500 });
  }
} 