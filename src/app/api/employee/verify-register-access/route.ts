import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db/config';
import { employees, registerEmployees, registers } from '@/app/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Secret key for JWT verification - in production, use an environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'employee-jwt-secret-key');

export async function GET(request: NextRequest) {
    try {
        // Get the employee token from cookies
        const employeeToken = request.cookies.get('employee-token')?.value;

        if (!employeeToken) {
            return NextResponse.json(
                { error: 'Unauthorized', hasAccess: false },
                { status: 401 }
            );
        }

        // Get the register ID from the query parameters
        const { searchParams } = new URL(request.url);
        const registerId = searchParams.get('registerId');

        if (!registerId) {
            return NextResponse.json(
                { error: 'Register ID is required', hasAccess: false },
                { status: 400 }
            );
        }

        // Verify the token using jose
        const { payload } = await jwtVerify(employeeToken, JWT_SECRET);

        if (payload.role !== 'employee') {
            return NextResponse.json(
                { error: 'Unauthorized', hasAccess: false },
                { status: 401 }
            );
        }

        // Check if the employee has access to the register
        const employeeId = Number(payload.id);
        const registerIdNum = Number(registerId);

        const access = await db.query.registerEmployees.findFirst({
            where: and(
                eq(registerEmployees.employeeId, employeeId),
                eq(registerEmployees.registerId, registerIdNum)
            ),
        });

        if (!access) {
            return NextResponse.json(
                { error: 'You do not have access to this register', hasAccess: false },
                { status: 403 }
            );
        }

        return NextResponse.json({
            hasAccess: true
        });
    } catch (error) {
        console.error('Error verifying register access:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred', hasAccess: false },
            { status: 500 }
        );
    }
} 