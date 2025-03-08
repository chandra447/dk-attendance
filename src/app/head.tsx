export default function CustomHead() {
    return (
        <>
            {/* PWA capabilities */}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />

            {/* Viewport settings */}
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

            {/* Status bar appearance for iOS */}
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            {/* Theme colors for browser UI */}
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1729" />
        </>
    );
} 