'use client';

import { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

interface PullToRefreshWrapperProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
}

export function PullToRefreshWrapper({ children, onRefresh }: PullToRefreshWrapperProps) {
    const { isRefreshing } = usePullToRefresh({
        onRefresh,
    });

    return (
        <div className="pull-to-refresh-container">
            {children}
        </div>
    );
} 