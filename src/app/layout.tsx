import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import CustomHead from "./head";
import { defaultMetadata, defaultViewport } from "./metadata";
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = defaultViewport;
export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <CustomHead />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Status bar overlay */}
        <div className="status-bar-overlay"></div>

        {/* Theme change handler script */}
        <Script id="theme-change-handler" strategy="afterInteractive">
          {`
            (function() {
              // Function to update status bar color based on theme
              function updateStatusBarColor(theme) {
                const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                if (metaThemeColor) {
                  if (theme === 'dark') {
                    metaThemeColor.setAttribute('content', '#0f1729');
                  } else {
                    metaThemeColor.setAttribute('content', '#ffffff');
                  }
                }
              }
              
              // Initial theme detection
              const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              updateStatusBarColor(isDarkMode ? 'dark' : 'light');
              
              // Watch for theme changes
              const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation.attributeName === 'class' && mutation.target === document.documentElement) {
                    const htmlElement = document.documentElement;
                    if (htmlElement.classList.contains('dark')) {
                      updateStatusBarColor('dark');
                    } else {
                      updateStatusBarColor('light');
                    }
                  }
                });
              });
              
              // Start observing theme changes
              observer.observe(document.documentElement, { attributes: true });
            })();
          `}
        </Script>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="dk-attendance-theme"
        >
          <StackProvider app={stackServerApp}>
            <div className="relative min-h-screen bg-background">
              <div className="absolute top-16 right-4 z-50">
                <ModeToggle />
              </div>
              {children}
            </div>
          </StackProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
