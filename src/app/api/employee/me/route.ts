import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db/config';
import { employees } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Secret key for JWT verification - in production, use an environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'employee-jwt-secret-key');

export async function GET(request: NextRequest) {
    try {
        // Get the employee token from cookies
        const employeeToken = request.cookies.get('employee-token')?.value;

        if (!employeeToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify the token using jose
        const { payload } = await jwtVerify(employeeToken, JWT_SECRET);

        if (payload.role !== 'employee') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the employee data
        const employee = await db.query.employees.findFirst({
            where: eq(employees.id, Number(payload.id)),
            columns: {
                id: true,
                name: true,
                position: true,
                department: true,
                startTime: true,
                endTime: true,
                durationAllowed: true,
                createdAt: true,
                // Exclude sensitive fields like passcode
            }
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            employee
        });
    } catch (error) {
        console.error('Error fetching employee data:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 