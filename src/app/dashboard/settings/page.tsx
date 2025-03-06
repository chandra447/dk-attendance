'use client';

import { AccountSettings } from '@stackframe/stack';

export default function SettingsPage() {
    return (
        <div className="container py-6">
            <AccountSettings
                fullPage={false}
            />
        </div>
    );
} 