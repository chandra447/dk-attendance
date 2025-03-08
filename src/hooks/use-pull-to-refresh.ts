'use client';

import { useEffect, useState } from 'react';

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
    const [startY, setStartY] = useState(0);

    useEffect(() => {
        if (!containerElement || typeof window === 'undefined') return;

        let touchStartY = 0;
        let touchMoveY = 0;
        let isPulling = false;
        let refreshElement: HTMLDivElement | null = null;

        // Create refresh indicator element
        const createRefreshElement = () => {
            if (document.querySelector('.ptr-element')) return;

            refreshElement = document.createElement('div');
            refreshElement.className = 'ptr-element';
            refreshElement.innerHTML = `
        <div class="ptr-icon">↓</div>
        <div class="ptr-spinner" style="display: none;"></div>
      `;
            refreshElement.style.transform = 'translateY(-50px)';
            document.body.insertBefore(refreshElement, document.body.firstChild);

            return refreshElement;
        };

        const handleTouchStart = (e: TouchEvent) => {
            // Only enable pull-to-refresh when at the top of the page
            if (window.scrollY > 0) return;

            touchStartY = e.touches[0].clientY;
            setStartY(touchStartY);
            isPulling = true;

            // Create refresh element if it doesn't exist
            createRefreshElement();
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling || !refreshElement) return;

            touchMoveY = e.touches[0].clientY;
            const distance = touchMoveY - touchStartY;

            // Only allow pulling down, not up
            if (distance <= 0) {
                setPullDistance(0);
                refreshElement.style.transform = `translateY(-50px)`;
                return;
            }

            // Calculate pull distance with resistance
            const pullDistanceWithResistance = Math.min(distance * 0.5, pullDownThreshold);
            setPullDistance(pullDistanceWithResistance);

            // Update the refresh element position
            refreshElement.style.transform = `translateY(${pullDistanceWithResistance - 50}px)`;

            // Add refresh class when pulled enough
            if (pullDistanceWithResistance >= pullDownThreshold) {
                refreshElement.classList.add('ptr-refresh');
            } else {
                refreshElement.classList.remove('ptr-refresh');
            }

            // Prevent default to disable browser's native pull-to-refresh
            if (window.scrollY === 0 && distance > 0) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling || !refreshElement) return;
            isPulling = false;

            // If pulled enough, trigger refresh
            if (pullDistance >= pullDownThreshold) {
                setIsRefreshing(true);
                refreshElement.classList.add('ptr-loading');
                const iconElement = refreshElement.querySelector('.ptr-icon') as HTMLElement;
                const spinnerElement = refreshElement.querySelector('.ptr-spinner') as HTMLElement;
                if (iconElement) iconElement.style.display = 'none';
                if (spinnerElement) spinnerElement.style.display = 'block';

                try {
                    await onRefresh();
                } catch (error) {
                    console.error('Refresh failed:', error);
                } finally {
                    setIsRefreshing(false);
                    setPullDistance(0);
                    refreshElement.classList.remove('ptr-refresh', 'ptr-loading');
                    if (iconElement) iconElement.style.display = 'inline-block';
                    if (spinnerElement) spinnerElement.style.display = 'none';
                    refreshElement.style.transform = 'translateY(-50px)';
                }
            } else {
                // Reset if not pulled enough
                setPullDistance(0);
                refreshElement.style.transform = 'translateY(-50px)';
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
            if (refreshElement && refreshElement.parentNode) {
                refreshElement.parentNode.removeChild(refreshElement);
            }
        };
    }, [containerElement, onRefresh, pullDistance, pullDownThreshold, startY]);

    return { isRefreshing };
} 