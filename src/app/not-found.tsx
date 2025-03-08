import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import type { Metadata } from 'next';
import { defaultViewport } from './metadata';

export const viewport = defaultViewport;

export const metadata: Metadata = {
    title: "Page Not Found - DK Attendance",
};

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="space-y-4">
                <h1 className="text-6xl font-bold">404</h1>
                <h2 className="text-2xl font-semibold">Page Not Found</h2>
                <p className="text-muted-foreground">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Button asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </div>
    );
} 