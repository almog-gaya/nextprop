import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/reset-password', '/registration-success'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  // API paths that don't require authentication
  const publicApiPaths = ['/api/auth'];
  const isPublicApiPath = publicApiPaths.some(path => request.nextUrl.pathname.startsWith(path));
  
  // Handle authentication based on path
  if (!session) {
    // If user is not authenticated and trying to access a protected route, redirect to login
    if (!isPublicPath && !isPublicApiPath) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // If user is authenticated but trying to access login/register pages, redirect to dashboard
    if (isPublicPath && !request.nextUrl.pathname.startsWith('/reset-password')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

// Specify paths for middleware to run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}; 