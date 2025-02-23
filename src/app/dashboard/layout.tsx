'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@stackframe/stack";
import { getRegistersByUserId, createRegister, syncUser } from "@/app/actions/register";
import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { Register } from "@/app/types/register";
import { CreateRegisterDialog } from "@/components/dashboard/create-register-dialog";
import { useRouter, usePathname } from "next/navigation";
import { ChevronsRight } from "lucide-react";

function DashboardHeader() {
    const user = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [registers, setRegisters] = useState<Register[]>([]);
    const [selectedRegisterId, setSelectedRegisterId] = useState<string>();
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingRegister, setIsCreatingRegister] = useState(false);
    const [localUserId, setLocalUserId] = useState<number | null>(null);

    const showRegisterSelector = pathname !== '/dashboard';

    useEffect(() => {
        async function initializeUser() {
            if (!user?.id || !user.primaryEmail) return;
            setIsLoading(true);
            try {
                // First sync user with our database
                const dbUser = await syncUser({
                    stackAuthUserId: user.id,
                    email: user.primaryEmail,
                    name: user.displayName || user.primaryEmail.split('@')[0]
                });

                if (dbUser) {
                    setLocalUserId(dbUser.id);
                    // Then fetch registers for the user
                    const userRegisters = await getRegistersByUserId(dbUser.id);
                    setRegisters(userRegisters);

                    // Set selected register from URL if we're on a register page
                    if (pathname.startsWith('/dashboard/registers/')) {
                        const registerId = pathname.split('/').pop();
                        if (registerId) {
                            setSelectedRegisterId(registerId);
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing user:', error);
            } finally {
                setIsLoading(false);
            }
        }
        initializeUser();
    }, [user?.id, user?.primaryEmail, user?.displayName, pathname]);

    const handleRegisterChange = (value: string) => {
        setSelectedRegisterId(value);
        router.push(`/dashboard/registers/${value}`);
    };

    const handleCreateRegister = async (description: string) => {
        if (!localUserId) return;
        setIsCreatingRegister(true);
        try {
            const result = await createRegister(localUserId, description);
            if (result) {
                // Refresh registers list
                const userRegisters = await getRegistersByUserId(localUserId);
                setRegisters(userRegisters);
                // Select the newly created register
                const newRegisterId = String(result.id);
                setSelectedRegisterId(newRegisterId);
                router.push(`/dashboard/registers/${newRegisterId}`);
            }
        } catch (error) {
            console.error('Error creating register:', error);
        } finally {
            setIsCreatingRegister(false);
        }
    };

    return (
        <header className="flex h-14 items-center justify-between gap-4 border-b px-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center">
                    <Image
                        src="/assets/logo_transparent.png"
                        alt="DK Attendance Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                    />
                </Link>
                {showRegisterSelector ? (
                    <>
                        <ChevronsRight className="h-4 w-4" />
                        <Select
                            value={selectedRegisterId}
                            onValueChange={handleRegisterChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder={isLoading ? "Loading..." : "Select Register"} />
                            </SelectTrigger>
                            <SelectContent>
                                {registers.length > 0 ? (
                                    registers.map((register) => (
                                        <SelectItem key={register.id} value={String(register.id)}>
                                            {register.description || 'Untitled Register'}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="empty" disabled>
                                        No registers found
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <CreateRegisterDialog
                            isLoading={isCreatingRegister}
                            onCreateRegister={handleCreateRegister}
                        />
                    </>
                ) : null}
            </div>

            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="icon" title="Account Settings">
                        <Settings className="h-5 w-5" />
                    </Button>
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <UserButton />
                <Link href="/handler/signout">
                    <Button variant="outline" size="icon" title="Sign Out">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </header>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex-1">
            <DashboardHeader />
            <div className="p-4">
                {children}
            </div>
        </main>
    );
} 