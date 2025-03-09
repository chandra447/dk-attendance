'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator
} from "@/components/ui/input-otp";

export default function EmployeeLoginPage() {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Call the API to authenticate the employee
            const response = await fetch('/api/auth/employee-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, pin }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid credentials');
            } else {
                // Redirect to the employee dashboard
                router.push('/employee/dashboard');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900">
                    <div className="absolute inset-0 bg-[url('/patterns/geometric-pattern.svg')] bg-center bg-no-repeat bg-cover opacity-40" />
                </div>
                <div className="relative z-20 flex items-center gap-2">
                    <Image
                        src="/assets/logo_transparent.png"
                        alt="DK Attendance Logo"
                        width={50}
                        height={50}
                        className="rounded-full bg-white/10 p-1"
                    />
                    <h1 className="text-xl font-bold">DK Attendance</h1>
                </div>
            </div>
            <div className="p-4 lg:p-8 h-full flex items-center">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Image
                                src="/assets/logo_transparent.png"
                                alt="DK Attendance Logo"
                                width={40}
                                height={40}
                                className="lg:hidden"
                            />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Employee Login
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Sign in with your name and PIN
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Sign In</CardTitle>
                            <CardDescription>
                                Enter your name and PIN to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={onSubmit}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pin">PIN</Label>
                                        <div className="flex justify-center">
                                            <InputOTP
                                                maxLength={5}
                                                value={pin}
                                                onChange={setPin}
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                </InputOTPGroup>
                                                <InputOTPSeparator />
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 text-center">
                                            Enter your 5-digit PIN
                                        </p>
                                    </div>
                                    {error && (
                                        <div className="text-sm text-red-500">
                                            {error}
                                        </div>
                                    )}
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Signing in...' : 'Sign in'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <Link href="/auth" className="text-sm text-muted-foreground hover:underline">
                            Back to Admin Login
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
} 