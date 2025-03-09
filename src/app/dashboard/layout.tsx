'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BarChart, LogOut, ClipboardList, Menu } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function DashboardHeader({ isAdmin = true }: { isAdmin?: boolean }) {
    const user = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [registers, setRegisters] = useState<Register[]>([]);
    const [selectedRegisterId, setSelectedRegisterId] = useState<string>();
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingRegister, setIsCreatingRegister] = useState(false);
    const [localUserId, setLocalUserId] = useState<number | null>(null);
    const [isEmployeeView, setIsEmployeeView] = useState(false);
    const [isAdminView, setIsAdminView] = useState(true);

    const showRegisterSelector = pathname !== '/dashboard';

    useEffect(() => {
        // Check if this is an employee view and admin status
        const checkViewStatus = () => {
            const isEmployee = window.localStorage.getItem('isEmployeeView') === 'true';
            const isAdminStorage = window.localStorage.getItem('isAdmin');

            // If isEmployeeView is false, ensure isAdminView is true
            const isAdmin = isEmployee ? false : (isAdminStorage !== 'false');

            setIsEmployeeView(isEmployee);
            setIsAdminView(isAdmin);
        };

        checkViewStatus();

        // Listen for storage changes in case the flags change
        const handleStorageChange = () => {
            checkViewStatus();
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        async function initializeUser() {
            if (isEmployeeView) {
                setIsLoading(false);
                return;
            }

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
    }, [user?.id, user?.primaryEmail, user?.displayName, pathname, isEmployeeView]);

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

    const navigateToReports = () => {
        if (selectedRegisterId) {
            router.push(`/dashboard/reports/${selectedRegisterId}`);
        }
    };

    const navigateToRegister = () => {
        if (selectedRegisterId) {
            router.push(`/dashboard/registers/${selectedRegisterId}`);
        }
    };

    // Add function to handle employee logout
    const handleEmployeeLogout = async () => {
        try {
            // First clear the employee token
            await fetch('/api/auth/employee-logout', { method: 'POST' });

            // Clear localStorage flags
            window.localStorage.removeItem('isEmployeeView');
            window.localStorage.setItem('isAdmin', 'true'); // Reset to admin view

            // Dispatch storage event to notify other components
            window.dispatchEvent(new Event('storage'));

            // Then redirect to auth page
            router.push('/auth');
        } catch (error) {
            console.error('Error logging out employee:', error);
        }
    };

    // Add function to handle admin logout
    const handleAdminLogout = () => {
        // Clear any localStorage flags
        window.localStorage.removeItem('isEmployeeView');
        window.localStorage.setItem('isAdmin', 'true'); // Reset to admin view

        // Dispatch storage event to notify other components
        window.dispatchEvent(new Event('storage'));

        // Redirect to the Stack Auth sign-out URL
        window.location.href = '/handler/signout';
    };

    return (
        <header className="flex h-14 items-center justify-between gap-4 border-b px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                <Link href="/dashboard" className="flex items-center">
                    <Image
                        src="/assets/logo_transparent.png"
                        alt="DK Attendance Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                    />
                </Link>
                {showRegisterSelector && isAdminView ? (
                    <>
                        <ChevronsRight className="h-4 w-4 hidden sm:block" />
                        <Select
                            value={selectedRegisterId}
                            onValueChange={handleRegisterChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-[120px] sm:w-[200px] text-xs sm:text-sm">
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

            <div className="flex items-center gap-2 md:gap-4">
                {/* Desktop view - Show reports button directly */}
                <div className="hidden md:block">
                    <Link href={selectedRegisterId ?
                        pathname.includes('/reports/') ?
                            `/dashboard/registers/${selectedRegisterId}` :
                            `/dashboard/reports/${selectedRegisterId}`
                        : "#"}>
                        <Button
                            variant="ghost"
                            size="icon"
                            title={pathname.includes('/reports/') ? "View Register" : "View Reports"}
                            disabled={!selectedRegisterId}
                        >
                            {pathname.includes('/reports/') ? (
                                <ClipboardList className="h-5 w-5" />
                            ) : (
                                <BarChart className="h-5 w-5" />
                            )}
                        </Button>
                    </Link>
                </div>

                {/* Mobile view - Show dropdown menu */}
                <div className="block md:block">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {pathname.includes('/reports/') ? (
                                <DropdownMenuItem onClick={navigateToRegister} disabled={!selectedRegisterId}>
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    View Register
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={navigateToReports} disabled={!selectedRegisterId}>
                                    <BarChart className="h-4 w-4 mr-2" />
                                    View Reports
                                </DropdownMenuItem>
                            )}

                            {/* Only show sign-out in dropdown for employee view */}
                            {!isAdminView && isEmployeeView && (
                                <DropdownMenuItem onClick={handleEmployeeLogout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Separator orientation="vertical" className="h-6 hidden md:block" />

                {isAdminView && !isEmployeeView ? (
                    <>
                        <div className="flex items-center">
                            <UserButton />
                        </div>
                        <Link href="/handler/signout">
                            <Button
                                variant="outline"
                                size="icon"
                                title="Sign Out"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </Link>
                    </>
                ) : (
                    // Employee sign out button - always visible
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEmployeeLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                )}
            </div>
        </header>
    );
}

export default function DashboardLayout({
    children,
    isAdmin = true
}: {
    children: React.ReactNode;
    isAdmin?: boolean;
}) {
    return (
        <main className="flex-1">
            <DashboardHeader isAdmin={isAdmin} />
            <div className="p-2 sm:p-4 w-full max-w-full overflow-x-hidden">
                {children}
            </div>
        </main>
    );
} 