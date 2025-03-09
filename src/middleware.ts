import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stackServerApp } from '@/lib/stack';
import { jwtVerify } from 'jose';

// Secret key for JWT verification - in production, use an environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'employee-jwt-secret-key');

export async function middleware(request: NextRequest) {
    // Check for employee token
    const employeeToken = request.cookies.get('employee-token')?.value;
    let employee = null;

    if (employeeToken) {
        try {
            // Verify the employee token
            const { payload } = await jwtVerify(employeeToken, JWT_SECRET);
            employee = payload;
        } catch (error) {
            console.error('Invalid employee token:', error);
        }
    }

    // Check for admin user
    const user = await stackServerApp.getUser();

    // Public routes that don't require authentication
    if (request.nextUrl.pathname === '/') {
        return NextResponse.next();
    }

    // Employee routes
    if (request.nextUrl.pathname.startsWith('/employee/')) {
        // If not an employee, redirect to employee login
        if (!employee) {
            return NextResponse.redirect(new URL('/auth/employee-login', request.url));
        }
        return NextResponse.next();
    }

    // Dashboard register routes - allow both admin users and employees with valid tokens
    if (request.nextUrl.pathname.startsWith('/dashboard/registers/')) {
        if (user || employee) {
            return NextResponse.next();
        }
        // If neither admin nor employee, redirect to appropriate login
        if (request.nextUrl.pathname.includes('/employee/')) {
            return NextResponse.redirect(new URL('/auth/employee-login', request.url));
        } else {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    // Other dashboard routes - only allow admin users
    if (request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname.startsWith('/dashboard/')) {
        if (!user) {
            console.log('User not logged in. Redirecting to auth page');
            return NextResponse.redirect(new URL('/auth', request.url));
        }
        return NextResponse.next();
    }

    // If the user is logged in and trying to access auth page
    if (user && request.nextUrl.pathname === '/auth') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If the employee is logged in and trying to access employee login page
    if (employee && request.nextUrl.pathname === '/auth/employee-login') {
        return NextResponse.redirect(new URL('/employee/dashboard', request.url));
    }

    return NextResponse.next();
}

// Configure the paths that should be checked by the middleware
export const config = {
    matcher: ['/', '/dashboard', '/dashboard/:path*', '/auth', '/auth/employee-login', '/employee/:path*']
}; 