import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function restricts access to only the root path and essential system paths
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define paths that are allowed to be accessed directly
  const allowedPaths = [
    '/', 
    '/api', 
    '/_next', 
    '/icons',
    '/SynthOS-tranparent.png', 
    '/favicon.ico', 
    '/manifest.json',
    '/static'
  ];
  
  // Define paths that should be accessible after authentication
  // These will be protected by client-side code
  const protectedPaths = [
    '/home',
    '/setting',
    '/holding',
    '/protocol'
  ];
  
  const isAllowedPath = allowedPaths.some(allowedPath => 
    path === allowedPath || path.startsWith(`${allowedPath}/`)
  );
  
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );

  // If the path is allowed directly, proceed
  if (isAllowedPath) {
    return NextResponse.next();
  }
  
  // If the path is protected, allow access but client-side code will handle auth check
  if (isProtectedPath) {
    return NextResponse.next();
  }
  
  // For any other paths, redirect to the root
  return NextResponse.redirect(new URL('/', request.url));
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|favicon.ico|manifest.json).*)',
  ],
}; 