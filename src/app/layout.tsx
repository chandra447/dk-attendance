import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import CustomHead from "./head";
import { defaultMetadata, defaultViewport } from "./metadata";
import { ThemeHandler } from "@/components/theme-handler";

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

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="dk-attendance-theme"
        >
          {/* Theme handler component to update status bar color */}
          <ThemeHandler />

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
