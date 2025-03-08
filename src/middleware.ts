import { NextRequest, NextResponse } from 'next/server';

// Define which routes are public (don't require auth)
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes or auth routes to prevent infinite loops
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth/') || 
                      request.nextUrl.pathname.startsWith('/auth/');
  
  // Don't run this middleware for auth-related routes to avoid loops
  if (!isApiRoute || isAuthRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('ghl_access_token')?.value;
  
  // If no access token, allow the request to fail naturally
  if (!accessToken) {
    return NextResponse.next();
  }

  // Calculate if the token needs refreshing (we'll assume it's needed if it exists but may be old)
  // You can implement more sophisticated logic if you can decode the JWT to check actual expiry
  const needsRefresh = shouldRefreshToken(request.cookies);
  
  if (needsRefresh) {
    try {
      // Call our refresh endpoint
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      const refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token in middleware');
        
        // If refresh fails on a data API, redirect to login
        if (isApiDataRoute(request)) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        
        // For other API routes, let the request proceed (will likely fail with auth errors)
        return NextResponse.next();
      }

      // Get cookies from refresh response
      const refreshData = await refreshResponse.json();
      console.log('Token refreshed successfully in middleware');
      
      // The response already has set cookies in our refresh endpoint,
      // so we can just proceed with the original request
      return NextResponse.next();
    } catch (error) {
      console.error('Error in token refresh middleware:', error);
      return NextResponse.next();
    }
  }

  // No refresh needed, continue
  return NextResponse.next();
}

// Only run the middleware for API routes
export const config = {
  matcher: '/api/:path*',
};

// Helper function to determine if a token needs refreshing
function shouldRefreshToken(cookies: any): boolean {
  // This is a simplistic check. In a real app, you might:
  // 1. Decode the JWT and check its expiration
  // 2. Refresh when within 1 hour of expiry
  
  // Get the timestamp when the token was last refreshed (if we track it)
  const tokenTimestamp = cookies.get('ghl_token_timestamp')?.value;
  
  if (!tokenTimestamp) {
    // No timestamp, assume we need to refresh
    return true;
  }
  
  const tokenAge = Date.now() - parseInt(tokenTimestamp);
  // Refresh if token is older than 23 hours
  return tokenAge > 23 * 60 * 60 * 1000;
}

// Helper function to check if this is a data API route that should redirect to login on auth failure
function isApiDataRoute(request: NextRequest): boolean {
  // Define which API routes should redirect to login if auth fails
  const dataRoutes = [
    '/api/contacts',
    '/api/opportunities',
    '/api/pipelines',
    '/api/locations',
    '/api/conversations',
  ];
  
  return dataRoutes.some(route => request.nextUrl.pathname.startsWith(route));
}