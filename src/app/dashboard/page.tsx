'use client';

import { useUser, useStackApp } from "@stackframe/stack";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    const user = useUser();
    const app = useStackApp();

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <Link href="/handler/signout">
                        <Button variant="outline">
                            Sign Out
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Hello, {user?.id}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                User ID: {user?.id}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p>Status: {user?.id ? 'Active' : 'Not logged in'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 