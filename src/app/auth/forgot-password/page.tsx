'use client';

import { ForgotPassword } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  return (
    <main className="container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900">
          <div className="absolute inset-0 bg-[url('/patterns/geometric-pattern.svg')] bg-center bg-no-repeat bg-cover opacity-40" />
        </div>
        <div className="relative z-20 flex items-center gap-2">
          <Image
            src="/assets/logo_transparent.png"
            alt="DK Attendance Logo"
            width={50}
            height={50}
            className="rounded-full bg-white/10 p-1"
          />
          <h1 className="text-xl font-bold">DK Attendance</h1>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Image
                src="/assets/logo_transparent.png"
                alt="DK Attendance Logo"
                width={40}
                height={40}
                className="lg:hidden"
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                Reset your password
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>
          
          <div className="flex w-full items-center justify-start mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Button>
          </div>
          
          <ForgotPassword />
        </div>
      </div>
    </main>
  );
}
