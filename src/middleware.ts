// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, isTokenExpired, refreshAccessToken, setAuthCookies } from '@/utils/authUtils';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  log(`[Middleware] Processing request for: ${pathname}`);

  // Skip auth for specific paths
  if (
    pathname === '/api' || 
    pathname.startsWith('/api/twilio/') || 
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/stripe/') ||
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/signup') ||
    pathname == '/auth/signup' ||
    pathname === '/register'
  ) {
    log('[Middleware] Public route detected, skipping auth check');
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/');
  if (!isApiRoute) {
    log('[Middleware] Not an API route, skipping');
    return NextResponse.next();
  }

  // // Skip auth for health check route
  // if (pathname === '/api') {
  //   log('[Middleware] Health check route detected, skipping auth check');
  //   return NextResponse.next();
  // }

  const isAuthRoute = pathname.startsWith('/api/auth/');
  if (isAuthRoute) {
    log('[Middleware] Auth route detected, skipping auth check');
    return NextResponse.next();
  }

  // // Skip auth for Twilio webhook routes
  // const isTwilioWebhook = pathname.startsWith('/api/twilio/');
  // if (isTwilioWebhook) {
  //   log('[Middleware] Twilio webhook route detected, skipping auth check');
  //   return NextResponse.next();
  // }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('ghl_access_token')?.value;
  const refreshToken = cookieStore.get('ghl_refresh_token')?.value;
  const tokenTimestamp = cookieStore.get('ghl_token_timestamp')?.value;
  // const userId = cookieStore.get('ghl_user_id')?.value;

  // console.log('[Middleware] Cookies - Access Token:', accessToken);
  // console.log('[Middleware] Cookies - User ID:', userId);
  // console.log('[Middleware] Cookies - Refresh Token:', refreshToken ? 'exists' : 'missing');
  // console.log('[Middleware] Cookies - Timestamp:', tokenTimestamp);

  // If no access token, redirect immediately
  if (!accessToken) {
    log('[Middleware] No access token, redirecting to login');
    clearAuthCookies(cookieStore);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If timestamp is missing or token is expired, attempt refresh or redirect
  if (!tokenTimestamp || isTokenExpired(tokenTimestamp)) {
    if (!refreshToken) {
      log('[Middleware] Token expired/missing timestamp and no refresh token, redirecting');
      clearAuthCookies(cookieStore);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      log('[Middleware] Attempting token refresh');
      const newTokens = await refreshAccessToken(refreshToken);
      log('[Middleware] Token refresh successful');
      setAuthCookies(cookieStore, newTokens);

      const response = NextResponse.next();
      response.cookies.set('ghl_access_token', newTokens.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
      response.cookies.set('ghl_token_timestamp', Date.now().toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      if (newTokens.refresh_token) {
        response.cookies.set('ghl_refresh_token', newTokens.refresh_token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
      return response;
    } catch (error) {
      logError(`Token refresh failed: ${error}`);
      clearAuthCookies(cookieStore);
      log('[Middleware] Redirecting to login due to refresh failure');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
 
  return NextResponse.next();
}

export const log = (mesage: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Middleware] ${mesage}`)
  }
}
export const logError = (mesage: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Middleware] ${mesage}`)
  }
}
export const config = {
  matcher: [
    // Match all API routes except specific ones
    '/api/:path*',
    '/api/twilio/:path*',
    '/api/auth/:path*',
    '/api',
    // Add public routes
    '/onboarding/:path*',
    '/register/:path*',
    '/register'
  ],
};