'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, ClipboardList } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Employee {
    id: number;
    name: string;
    position: string;
}

interface Register {
    id: number;
    description: string;
    createdAt: Date;
}

export default function EmployeeDashboard() {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [registers, setRegisters] = useState<Register[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Fetch employee data and registers
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch employee data
                const employeeResponse = await fetch('/api/employee/me');
                if (!employeeResponse.ok) {
                    throw new Error('Failed to fetch employee data');
                }
                const employeeData = await employeeResponse.json();
                setEmployee(employeeData.employee);

                // Fetch registers
                const registersResponse = await fetch('/api/employee/registers');
                if (!registersResponse.ok) {
                    throw new Error('Failed to fetch registers');
                }
                const registersData = await registersResponse.json();
                setRegisters(registersData.registers);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            // Clear the employee token
            await fetch('/api/auth/employee-logout', { method: 'POST' });

            // Clear localStorage flags
            window.localStorage.removeItem('isEmployeeView');

            // Redirect to auth page
            router.push('/auth');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex h-14 items-center justify-between gap-4 border-b px-6">
                <div className="flex items-center gap-4">
                    <Link href="/employee/dashboard" className="flex items-center">
                        <Image
                            src="/assets/logo_transparent.png"
                            alt="DK Attendance Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain"
                        />
                    </Link>
                    <h1 className="text-lg font-semibold">Employee Dashboard</h1>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" title="Sign Out" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                    {employee && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Welcome, {employee.name}</h2>
                            <p className="text-muted-foreground">Position: {employee.position}</p>
                        </div>
                    )}

                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Your Registers</h3>

                        {registers.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {registers.map((register) => (
                                    <Card key={register.id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <CardTitle>{register.description || 'Untitled Register'}</CardTitle>
                                            <CardDescription>
                                                Created on {new Date(register.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-end">
                                                <Link href={`/employee/registers/${register.id}`}>
                                                    <Button variant="default" size="sm">
                                                        <ClipboardList className="h-4 w-4 mr-2" />
                                                        View Register
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-muted-foreground">You are not assigned to any registers yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
} 