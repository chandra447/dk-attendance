'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    pullDownThreshold?: number;
    containerElement?: HTMLElement | null;
}

export function usePullToRefresh({
    onRefresh,
    pullDownThreshold = 80,
    containerElement = typeof document !== 'undefined' ? document.body : null,
}: PullToRefreshOptions) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const refreshElementRef = useRef<HTMLDivElement | null>(null);
    const isPullingRef = useRef(false);
    const touchStartYRef = useRef(0);

    // Wrap the refresh function to handle errors
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        try {
            setIsRefreshing(true);
            await onRefresh();
        } catch (error) {
            console.error('Pull to refresh error:', error);
        } finally {
            setIsRefreshing(false);
            setPullDistance(0);
            if (refreshElementRef.current) {
                refreshElementRef.current.style.transform = 'translateY(-50px)';
                refreshElementRef.current.classList.remove('ptr-refresh', 'ptr-loading');

                const iconElement = refreshElementRef.current.querySelector('.ptr-icon') as HTMLElement;
                const spinnerElement = refreshElementRef.current.querySelector('.ptr-spinner') as HTMLElement;

                if (iconElement) iconElement.style.display = 'inline-block';
                if (spinnerElement) spinnerElement.style.display = 'none';
            }
        }
    }, [isRefreshing, onRefresh]);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined' || !containerElement) return;

        // Create refresh indicator element
        const createRefreshElement = () => {
            // Remove any existing element first
            const existingElement = document.querySelector('.ptr-element');
            if (existingElement) {
                existingElement.parentNode?.removeChild(existingElement);
            }

            const element = document.createElement('div');
            element.className = 'ptr-element';
            element.innerHTML = `
        <div class="ptr-icon">↓</div>
        <div class="ptr-spinner" style="display: none;"></div>
      `;
            element.style.transform = 'translateY(-50px)';
            document.body.insertBefore(element, document.body.firstChild);

            refreshElementRef.current = element;
            return element;
        };

        // Create the element on mount
        createRefreshElement();

        const handleTouchStart = (e: TouchEvent) => {
            // Only enable pull-to-refresh when at the top of the page
            if (window.scrollY > 5) return;

            touchStartYRef.current = e.touches[0].clientY;
            isPullingRef.current = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPullingRef.current || !refreshElementRef.current) return;

            const touchMoveY = e.touches[0].clientY;
            const distance = touchMoveY - touchStartYRef.current;

            // Only allow pulling down, not up
            if (distance <= 0) {
                setPullDistance(0);
                refreshElementRef.current.style.transform = `translateY(-50px)`;
                return;
            }

            // Calculate pull distance with resistance
            const pullDistanceWithResistance = Math.min(distance * 0.5, pullDownThreshold);
            setPullDistance(pullDistanceWithResistance);

            // Update the refresh element position
            refreshElementRef.current.style.transform = `translateY(${pullDistanceWithResistance - 50}px)`;

            // Add refresh class when pulled enough
            if (pullDistanceWithResistance >= pullDownThreshold) {
                refreshElementRef.current.classList.add('ptr-refresh');
            } else {
                refreshElementRef.current.classList.remove('ptr-refresh');
            }

            // Prevent default to disable browser's native pull-to-refresh
            if (window.scrollY <= 5 && distance > 0) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = async () => {
            if (!isPullingRef.current || !refreshElementRef.current) return;
            isPullingRef.current = false;

            // If pulled enough, trigger refresh
            if (pullDistance >= pullDownThreshold) {
                refreshElementRef.current.classList.add('ptr-loading');

                const iconElement = refreshElementRef.current.querySelector('.ptr-icon') as HTMLElement;
                const spinnerElement = refreshElementRef.current.querySelector('.ptr-spinner') as HTMLElement;

                if (iconElement) iconElement.style.display = 'none';
                if (spinnerElement) spinnerElement.style.display = 'block';

                await handleRefresh();
            } else {
                // Reset if not pulled enough
                setPullDistance(0);
                if (refreshElementRef.current) {
                    refreshElementRef.current.style.transform = 'translateY(-50px)';
                }
            }
        };

        // Add event listeners
        containerElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        containerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        containerElement.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Clean up
        return () => {
            containerElement.removeEventListener('touchstart', handleTouchStart);
            containerElement.removeEventListener('touchmove', handleTouchMove);
            containerElement.removeEventListener('touchend', handleTouchEnd);

            // Remove refresh element
            if (refreshElementRef.current && refreshElementRef.current.parentNode) {
                refreshElementRef.current.parentNode.removeChild(refreshElementRef.current);
            }
        };
    }, [containerElement, handleRefresh, pullDistance, pullDownThreshold]);

    return { isRefreshing };
} 