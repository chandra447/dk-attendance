import type { Metadata, Viewport } from 'next';

// Default viewport configuration for all pages
export const defaultViewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#0f1729" }
    ]
};

// Default metadata configuration for all pages
export const defaultMetadata: Metadata = {
    title: {
        template: '%s | DK Attendance',
        default: 'DK Attendance',
    },
    description: 'Employee attendance tracking system',
    manifest: "/site.webmanifest",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "DK Attendance"
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
        ],
        apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
        other: [
            {
                rel: "android-chrome-192x192",
                url: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                rel: "android-chrome-512x512",
                url: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    },
};

// Home page metadata
export const homeMetadata: Metadata = {
    ...defaultMetadata,
    title: 'DK Attendance - Employee Attendance Tracking System',
    description: 'Track employee attendance, manage work hours, and handle salary advances with ease.',
}; 