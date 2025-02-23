import { stackServerApp } from "@/lib/stack";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Welcome to DK Attendance</h1>
        <p className="text-center">
          Current login status: {await stackServerApp.getUser() ? 'Logged in' : 'Not logged in'}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/auth"
            className="text-primary hover:underline"
          >
            Go to Login
          </Link>
          <Link
            href="/dashboard"
            className="text-primary hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
