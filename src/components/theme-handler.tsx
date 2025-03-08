'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function ThemeHandler() {
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        // Function to update status bar color based on theme
        const updateStatusBarColor = (currentTheme: string | undefined) => {
            // Default to light if theme is undefined
            const isDark = currentTheme === 'dark';

            // Update meta theme color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', isDark ? '#0f1729' : '#ffffff');
            }

            // Update status bar overlay
            const statusBarOverlay = document.querySelector('.status-bar-overlay');
            if (statusBarOverlay instanceof HTMLElement) {
                statusBarOverlay.style.backgroundColor = isDark ? '#0f1729' : '#ffffff';
            }

            // Force iOS to update status bar (hack)
            setTimeout(() => {
                const html = document.documentElement;
                const currentClass = html.className;
                html.className = currentClass + ' force-repaint';
                setTimeout(() => {
                    html.className = currentClass;
                }, 10);
            }, 50);
        };

        // Update when theme changes
        updateStatusBarColor(resolvedTheme);

        // Also update on window focus, as iOS sometimes doesn't update properly
        const handleFocus = () => updateStatusBarColor(resolvedTheme);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [theme, resolvedTheme]);

    return null;
} 