import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DK-stores",
  manifest: "/site.webmanifest",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script id="crypto-polyfill" strategy="beforeInteractive">
          {`
            // Polyfill for crypto.subtle in browsers that don't support it
            if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.subtle)) {
              try {
                // Simple fallback for basic functionality
                window.crypto = window.crypto || {};
                window.crypto.subtle = window.crypto.subtle || {};
                
                if (!window.crypto.subtle.digest) {
                  // This is a very simplified fallback and not secure for production
                  // It's just to prevent the app from crashing
                  window.crypto.subtle.digest = async function(algorithm, data) {
                    console.warn('Using insecure crypto.subtle.digest polyfill');
                    // Return a dummy ArrayBuffer
                    return new ArrayBuffer(32);
                  };
                }
              } catch (e) {
                console.error('Failed to polyfill crypto API:', e);
              }
            }
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
            <div className="relative min-h-screen">
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