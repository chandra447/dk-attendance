import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stackServerApp } from '@/lib/stack';

export async function middleware(request: NextRequest) {

    const user = await stackServerApp.getUser();

    // Public routes that don't require authentication
    if (request.nextUrl.pathname === '/') {
        return NextResponse.next();
    }

    // If the user is not logged in and trying to access protected routes
    if (!user && (request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname.startsWith('/dashboard/'))) {
        console.log('User not logged in. Redirecting to auth page');
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // If the user is logged in and trying to access auth page
    if (user && request.nextUrl.pathname === '/auth') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Configure the paths that should be checked by the middleware
export const config = {
    matcher: ['/', '/dashboard', '/dashboard/:path*', '/auth']
}; 