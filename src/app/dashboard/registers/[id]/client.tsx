'use client';

import { useEffect, useState } from "react";
import { EmployeeList } from "@/components/dashboard/employee-list";
import { getRegistersByUserId, syncUser } from "@/app/actions/register";
import { Register } from "@/app/types/register";
import { useUser } from "@stackframe/stack";
import { UserPlus } from "lucide-react";
import { CreateEmployeeDialog } from "@/components/dashboard/create-employee-dialog";

interface RegisterPageClientProps {
    id: string;
}

export function RegisterPageClient({ id }: RegisterPageClientProps) {
    const user = useUser();
    const [register, setRegister] = useState<Register | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRegister() {
            if (!user?.id || !user.primaryEmail) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // First sync the user to get their local ID
                const dbUser = await syncUser({
                    stackAuthUserId: user.id,
                    email: user.primaryEmail,
                    name: user.displayName || user.primaryEmail.split('@')[0]
                });

                if (dbUser) {
                    // Then fetch their registers
                    const registers = await getRegistersByUserId(dbUser.id);
                    const currentRegister = registers.find(r => r.id === parseInt(id));
                    if (currentRegister) {
                        setRegister(currentRegister);
                    } else {
                        console.log('Register not found:', id);
                        setRegister(null);
                    }
                } else {
                    console.log('No dbUser found');
                    setRegister(null);
                }
            } catch (error) {
                console.error('Error fetching register:', error);
                setRegister(null);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRegister();
    }, [id, user?.id, user?.primaryEmail, user?.displayName]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <p className="text-muted-foreground">Loading register...</p>
            </div>
        );
    }

    if (!register) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <p className="text-muted-foreground">Register not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {register.description || 'Untitled Register'}
                    </h2>
                    <p className="text-muted-foreground">
                        Manage employees and attendance
                    </p>
                </div>
            </div> */}
            <EmployeeList
                registerId={id}
                registerName={register.description || 'Untitled Register'}
            />
        </div>
    );
} 