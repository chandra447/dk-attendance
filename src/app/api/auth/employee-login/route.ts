import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db/config';
import { employees } from '@/app/db/schema';
import { eq, and } from 'drizzle-orm';
import { SignJWT } from 'jose';

// Secret key for JWT signing - in production, use an environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'employee-jwt-secret-key');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, pin } = body;

        if (!name || !pin) {
            return NextResponse.json(
                { error: 'Name and PIN are required' },
                { status: 400 }
            );
        }

        // Find the employee by name and PIN
        const employee = await db.query.employees.findFirst({
            where: and(
                eq(employees.name, name),
                eq(employees.passcode, pin)
            ),
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate a JWT token using jose
        const token = await new SignJWT({
            id: employee.id,
            name: employee.name,
            role: 'employee',
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('8h') // Token expires in 8 hours
            .sign(JWT_SECRET);

        // Create a response
        const response = NextResponse.json({
            success: true,
            employee: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
            },
        });

        // Set the token in a cookie
        response.cookies.set({
            name: 'employee-token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8 * 60 * 60, // 8 hours in seconds
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Employee login error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 