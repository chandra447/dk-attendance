import { Button } from "@/components/ui/button";
import { LogIn, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { stackServerApp } from "@/lib/stack";
import { homeMetadata, defaultViewport } from "./metadata";

export const metadata = homeMetadata;
export const viewport = defaultViewport;

export default async function Home() {
  const isLoggedIn = await stackServerApp.getUser();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background with geometric pattern */}
      <div className="absolute inset-0 bg-zinc-900">
        <div className="absolute inset-0 bg-[url('/patterns/geometric-pattern.svg')] bg-center bg-no-repeat bg-cover opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/logo_transparent.png"
              alt="DK Attendance Logo"
              width={60}
              height={60}
              className="rounded-full bg-white/10 p-1"
            />
            <h1 className="text-3xl font-bold text-white">DK Attendance</h1>
          </div>
          <p className="text-lg text-white/60">
            Current login status: {isLoggedIn ? 'Logged in' : 'Not logged in'}
          </p>
        </div>

        <div className="flex flex-col gap-4 px-4">
          <Button asChild variant="default" size="lg" className="w-full bg-white text-black hover:bg-white/90">
            <Link href="/auth" className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Login
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
            <Link href="/dashboard" className="flex items-center justify-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
