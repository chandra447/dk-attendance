'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { toast } from 'react-hot-toast';

interface PullToRefreshWrapperProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
}

export function PullToRefreshWrapper({ children, onRefresh }: PullToRefreshWrapperProps) {
    const [isMounted, setIsMounted] = useState(false);

    // Only enable on client-side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleRefresh = async () => {
        try {
            await onRefresh();
            toast.success('Refreshed successfully');
        } catch (error) {
            console.error('Refresh error:', error);
            toast.error('Failed to refresh');
        }
    };

    const { isRefreshing } = usePullToRefresh({
        onRefresh: handleRefresh,
        containerElement: isMounted ? document.body : null,
    });

    return (
        <div className="pull-to-refresh-container">
            {isRefreshing && (
                <div className="fixed top-0 left-0 w-full h-1 bg-primary z-50">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                </div>
            )}
            {children}
        </div>
    );
} 