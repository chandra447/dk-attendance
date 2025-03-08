'use client';

import { useStackApp, OAuthButton } from "@stackframe/stack";
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

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const app = useStackApp();
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await app.signInWithCredential({ email, password });
            if (result.status === 'error') {
                if (result.error.message && result.error.message.includes('REDIRECT_URL_NOT_WHITELISTED')) {
                    setError('Authentication error: The current domain is not authorized for login. Please add this domain to the trusted domains list in the Stack Auth dashboard, or access the application from an authorized domain.');
                } else {
                    setError(result.error.message);
                }
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            // Check for redirect URL whitelist errors
            if (err.message && err.message.includes('REDIRECT_URL_NOT_WHITELISTED')) {
                setError('Authentication error: The current domain is not authorized for login. Please add this domain to the trusted domains list in the Stack Auth dashboard, or access the application from an authorized domain.');
            }
            // Check for crypto-related errors
            else if (err.message && (
                err.message.includes('crypto') ||
                err.message.includes('subtle') ||
                err.message.includes('undefined is not an object')
            )) {
                setError('Authentication error: Your browser may not support required security features. Please try a different browser or use email login.');
            } else {
                setError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="w-full">
                    {typeof window !== 'undefined' && typeof window.crypto !== 'undefined' && typeof window.crypto.subtle !== 'undefined' ? (
                        <>
                            <OAuthButton
                                provider="google"
                                type="sign-in"
                            />

                        </>
                    ) : (
                        <div className="p-2 text-center text-sm text-red-500 border border-red-200 rounded-md">
                            Google login is not available on this device or browser. Please use email login instead.
                        </div>
                    )}
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with email
                        </span>
                    </div>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
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
    );
} 