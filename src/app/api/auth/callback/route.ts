import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, GHL_AUTH_CONFIG } from '@/lib/ghlAuth';
import { cookies } from 'next/headers';
// app/api/oauth/ghl/callback/route.tsx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
    }

    const data = new URLSearchParams({
      client_id: GHL_AUTH_CONFIG.clientId,
      client_secret: GHL_AUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
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

    const tokens = await response.json();
    const cookieStore = await cookies();
    console.log(`Callback: `, JSON.stringify(tokens));
    // Set cookies with explicit options
    cookieStore.set('ghl_access_token', tokens.access_token, {
      httpOnly: false, // Accessible from client
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (tokens.locationId) {
      cookieStore.set('ghl_location_id', tokens.locationId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (tokens.userId) {
      cookieStore.set('ghl_user_id', tokens.userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (tokens.userType) {
      cookieStore.set('ghl_user_type', tokens.userType, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }


    if (tokens.companyId) {
      cookieStore.set('ghl_company_id', tokens.companyId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }


    if (tokens.refresh_token) {
      cookieStore.set('ghl_refresh_token', tokens.refresh_token, {
        httpOnly: true, // Keep refresh token secure
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    const dashboardUrl = new URL('/', request.url);
    dashboardUrl.searchParams.set('auth', 'success');
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = new URL('/auth/login', request.url);
    errorUrl.searchParams.set('error', 'auth_failed');
    errorUrl.searchParams.set('message', (error as Error).message);
    return NextResponse.redirect(errorUrl);
  }
}