'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function EmployeeRegisterRedirect() {
    const router = useRouter();
    const params = useParams();
    const registerId = params.id;
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAccessAndRedirect() {
            try {
                setIsLoading(true);

                // Verify that the employee has access to this register
                const response = await fetch(`/api/employee/verify-register-access?registerId=${registerId}`);
                const data = await response.json();

                if (response.ok && data.hasAccess) {
                    // Redirect to the dashboard register view
                    // Set a flag in localStorage to indicate this is an employee view
                    localStorage.setItem('isEmployeeView', 'true');

                    // Also set a flag to indicate this is not an admin view
                    localStorage.setItem('isAdmin', 'false');

                    router.push(`/dashboard/registers/${registerId}`);
                } else {
                    setError(data.error || 'You do not have access to this register');
                }
            } catch (error) {
                console.error('Error verifying register access:', error);
                setError('An error occurred while verifying access');
            } finally {
                setIsLoading(false);
            }
        }

        checkAccessAndRedirect();
    }, [registerId, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
                <p className="text-muted-foreground mb-8">{error}</p>
                <button
                    onClick={() => router.push('/employee/dashboard')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return null; // This should not be rendered as we're redirecting
} 