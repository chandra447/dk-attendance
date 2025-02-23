'use client';

import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { EmployeeList } from "@/components/dashboard/employee-list";
import { getRegistersByUserId } from "@/app/actions/register";
import { Register } from "@/app/types/register";

export default function DashboardPage() {
    const user = useUser();
    const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
    const [registers, setRegisters] = useState<Register[]>([]);

    useEffect(() => {
        async function fetchRegisters() {
            if (!user?.id) return;

            try {
                const userRegisters = await getRegistersByUserId(parseInt(user.id));
                setRegisters(userRegisters);
                if (userRegisters.length > 0) {
                    setSelectedRegister(userRegisters[0]);
                }
            } catch (error) {
                console.error('Error fetching registers:', error);
            }
        }

        fetchRegisters();
    }, [user?.id]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome, {user?.displayName || user?.primaryEmail?.split('@')[0]}
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your attendance registers and employees
                    </p>
                </div>
            </div>

            {selectedRegister ? (
                <EmployeeList
                    registerId={String(selectedRegister.id)}
                    registerName={selectedRegister.description || 'Untitled Register'}
                />
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    Select a register from the sidebar to view employees
                </div>
            )}
        </div>
    );
} 