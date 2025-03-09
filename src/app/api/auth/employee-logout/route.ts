import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Create a response
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });

        // Clear the employee token cookie
        response.cookies.set({
            name: 'employee-token',
            value: '',
            expires: new Date(0), // Expire immediately
            path: '/',
        });

        // Note: We can't directly modify localStorage from the server
        // The client-side code will need to handle clearing localStorage

        return response;
    } catch (error) {
        console.error('Error logging out employee:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 