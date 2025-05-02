'use client';

import { AccountSettings } from '@stackframe/stack';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="container py-6">
            <div className="flex items-center mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="mr-4"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold">Account Settings</h1>
            </div>

            <AccountSettings
                fullPage={false}
            />
        </div>
    );
} 