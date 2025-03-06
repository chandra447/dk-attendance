'use client';

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { UserButton } from "@stackframe/stack";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Settings,
    FileText,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { syncUser, getRegistersByUserId, createRegister } from "@/app/actions/register";
import { Register } from "@/app/types/register";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { CreateRegisterDialog } from "./create-register-dialog";
import { useRouter } from "next/navigation";

export function SidebarNav() {
    const user = useUser();
    const [registers, setRegisters] = useState<Register[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [localUserId, setLocalUserId] = useState<number | null>(null);
    const [selectedRegisterId, setSelectedRegisterId] = useState<string>();
    const router = useRouter();

    useEffect(() => {
        async function initializeUser() {
            if (user?.id && user.primaryEmail) {
                try {
                    // Sync user with our database
                    const dbUser = await syncUser({
                        stackAuthUserId: user.id,
                        email: user.primaryEmail,
                        name: user.displayName || user.primaryEmail.split('@')[0]
                    });

                    if (dbUser) {
                        setLocalUserId(dbUser.id);
                        // Fetch registers for the user
                        const userRegisters = await getRegistersByUserId(dbUser.id);
                        setRegisters(userRegisters);
                    }
                } catch (error) {
                    console.error('Error initializing user:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        }

        initializeUser();
    }, [user?.id, user?.primaryEmail, user?.displayName]);

    const handleCreateRegister = async (description: string) => {
        if (!localUserId) return;

        try {
            const newRegister = await createRegister(localUserId, description);
            if (newRegister) {
                setRegisters(prev => [...prev, newRegister]);
                setSelectedRegisterId(String(newRegister.id));
            }
        } catch (error) {
            console.error('Error creating register:', error);
        }
    };

    const handleRegisterChange = (registerId: string) => {
        setSelectedRegisterId(registerId);
        router.push(`/dashboard/registers/${registerId}`);
    };

    return (
        <Sidebar>
            <SidebarHeader className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <FileText className="h-6 w-6" />
                    DK Attendance
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <div className="flex items-center gap-2 p-4">
                    {registers.length > 0 ? (
                        <>
                            <Select value={selectedRegisterId} onValueChange={handleRegisterChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Register" />
                                </SelectTrigger>
                                <SelectContent>
                                    {registers.map((register) => (
                                        <SelectItem key={register.id} value={String(register.id)}>
                                            {register.description || 'Untitled Register'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <CreateRegisterDialog
                                isLoading={isLoading}
                                onCreateRegister={handleCreateRegister}
                            />
                        </>
                    ) : (
                        <CreateRegisterDialog
                            isLoading={isLoading}
                            onCreateRegister={handleCreateRegister}
                        />
                    )}
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4">
                        <h2 className="mb-2 text-lg font-semibold">Registers</h2>
                        {/* Register list will be added here later */}
                    </div>
                </ScrollArea>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <div className="flex items-center gap-4">
                    <UserButton />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {user?.displayName || user?.primaryEmail?.split('@')[0]}
                        </span>
                        <Link
                            href="/dashboard/settings"
                            className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                        >
                            <Settings className="mr-1 h-3 w-3" />
                            Account Settings
                        </Link>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
} 