'use client';

import { useEffect, useState, useRef } from "react";
import { EmployeeList, EmployeeListRef } from "@/components/dashboard/employee-list";
import { getRegistersByUserId, syncUser, getRegisterById } from "@/app/actions/register";
import { Register } from "@/app/types/register";
import { useUser } from "@stackframe/stack";
import { UserPlus } from "lucide-react";
import { CreateEmployeeDialog } from "@/components/dashboard/create-employee-dialog";
import { PullToRefreshWrapper } from "@/components/pull-to-refresh-wrapper";

interface RegisterPageClientProps {
    id: string;
}

export function RegisterPageClient({ id }: RegisterPageClientProps) {
    const user = useUser();
    const [register, setRegister] = useState<Register | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmployee, setIsEmployee] = useState(false);
    const employeeListRef = useRef<EmployeeListRef>(null);

    useEffect(() => {
        // Check if there's an employee token in cookies
        const checkEmployeeToken = async () => {
            try {
                const response = await fetch('/api/employee/me');
                if (response.ok) {
                    setIsEmployee(true);
                    return true;
                }
            } catch (error) {
                console.error('Error checking employee token:', error);
            }
            return false;
        };

        async function fetchRegister() {
            try {
                setIsLoading(true);

                // Check if user is an employee
                const isEmployeeUser = await checkEmployeeToken();

                if (isEmployeeUser) {
                    // Fetch register directly by ID for employees
                    const registerData = await getRegisterById(parseInt(id));
                    if (registerData) {
                        setRegister(registerData);
                    } else {
                        console.log('Register not found for employee:', id);
                        setRegister(null);
                    }
                } else if (user?.id && user.primaryEmail) {
                    // For admin users, fetch registers through user association
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
                            console.log('Register not found for admin:', id);
                            setRegister(null);
                        }
                    } else {
                        console.log('No dbUser found');
                        setRegister(null);
                    }
                } else {
                    // Neither employee nor admin user
                    setIsLoading(false);
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

    // Set a global flag to indicate this is an employee view
    useEffect(() => {
        if (isEmployee) {
            // Set a flag in localStorage or window object to indicate employee view
            window.localStorage.setItem('isEmployeeView', 'true');
        }

        return () => {
            // Clean up when component unmounts
            window.localStorage.removeItem('isEmployeeView');
        };
    }, [isEmployee]);

    const refreshData = async () => {
        if (isEmployee) {
            // For employees, fetch register directly
            try {
                const registerData = await getRegisterById(parseInt(id));
                if (registerData) {
                    setRegister(registerData);
                }

                // Refresh the employee list
                if (employeeListRef.current) {
                    await employeeListRef.current.refresh();
                }
            } catch (error) {
                console.error('Error refreshing register for employee:', error);
            }
        } else if (user?.id && user.primaryEmail) {
            // For admin users
            try {
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

                        // Refresh the employee list
                        if (employeeListRef.current) {
                            await employeeListRef.current.refresh();
                        }
                    }
                }
            } catch (error) {
                console.error('Error refreshing register for admin:', error);
            }
        }
    };

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
        <PullToRefreshWrapper onRefresh={refreshData}>
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
                    ref={employeeListRef}
                    registerId={id}
                    registerName={register.description || 'Untitled Register'}
                    isEmployee={isEmployee}
                />
            </div>
        </PullToRefreshWrapper>
    );
} 