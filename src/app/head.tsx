export default function CustomHead() {
    return (
        <>
            {/* PWA capabilities */}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />

            {/* Viewport settings with safe area insets */}
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

            {/* Status bar appearance for iOS */}
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            {/* Theme colors for browser UI - these will be dynamically updated by JavaScript */}
            <meta name="theme-color" content="#ffffff" />
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1729" />

            {/* Prevent telephone number detection */}
            <meta name="format-detection" content="telephone=no" />

            {/* Apple touch icons */}
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        </>
    );
} 