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

        // Get the registers that the employee is part of
        const employeeRegisters = await db.select({
            id: registers.id,
            description: registers.description,
            createdAt: registers.createdAt,
        })
            .from(registers)
            .innerJoin(registerEmployees, eq(registers.id, registerEmployees.registerId))
            .where(eq(registerEmployees.employeeId, Number(payload.id)));

        return NextResponse.json({
            registers: employeeRegisters
        });
    } catch (error) {
        console.error('Error fetching employee registers:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 