import { NextRequest, NextResponse } from 'next/server';

// Define which routes are public (don't require auth)
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define paths that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/signup',
    '/api/health',
    '/api/auth/ghl/callback',
    '/api/auth',
    '/oauth/callback',  // Add the OAuth callback route
    '/oauth/chooselocation'  // Add the location selection route
  ];
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(publicPath + '/') ||
    path.startsWith('/_next/') ||
    path.includes('favicon.ico')
  );
  
  // Get the tokens from cookies
  const ghlToken = request.cookies.get('ghl_access_token')?.value;
  
  // Allow OAuth flow to proceed without redirects
  if (path.startsWith('/oauth/')) {
    return NextResponse.next();
  }
  
  // If it's a protected path and there's no valid token, redirect to login
  if (!isPublicPath && !ghlToken) {
    if (path.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For regular routes, redirect to login
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};