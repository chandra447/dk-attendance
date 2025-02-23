'use client';

import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRegistersByUserId, syncUser, deleteRegister, createRegister } from "@/app/actions/register";
import { Register } from "@/app/types/register";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateRegisterDialog } from "@/components/dashboard/create-register-dialog";
import { format } from "date-fns";
import { FileText, Plus, Trash2 } from "lucide-react";

export default function DashboardPage() {
    const user = useUser();
    const router = useRouter();
    const [registers, setRegisters] = useState<Register[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [localUserId, setLocalUserId] = useState<number | null>(null);
    const [isCreatingRegister, setIsCreatingRegister] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [registerToDelete, setRegisterToDelete] = useState<Register | null>(null);

    useEffect(() => {
        async function initializeUser() {
            if (!user?.id || !user.primaryEmail) return;
            setIsLoading(true);
            try {
                const dbUser = await syncUser({
                    stackAuthUserId: user.id,
                    email: user.primaryEmail,
                    name: user.displayName || user.primaryEmail.split('@')[0]
                });

                if (dbUser) {
                    setLocalUserId(dbUser.id);
                    const userRegisters = await getRegistersByUserId(dbUser.id);
                    setRegisters(userRegisters);
                }
            } catch (error) {
                console.error('Error initializing user:', error);
            } finally {
                setIsLoading(false);
            }
        }

        initializeUser();
    }, [user?.id, user?.primaryEmail, user?.displayName]);

    const handleCreateRegister = async (description: string) => {
        if (!localUserId) return;
        setIsCreatingRegister(true);
        try {
            const result = await createRegister(localUserId, description);
            if (result) {
                const userRegisters = await getRegistersByUserId(localUserId);
                setRegisters(userRegisters);
                router.push(`/dashboard/registers/${result.id}`);
            }
        } catch (error) {
            console.error('Error creating register:', error);
        } finally {
            setIsCreatingRegister(false);
        }
    };

    const handleDeleteRegister = async () => {
        if (!registerToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteRegister(registerToDelete.id);
            if ('data' in result) {
                const updatedRegisters = registers.filter(r => r.id !== registerToDelete.id);
                setRegisters(updatedRegisters);
            }
        } catch (error) {
            console.error('Error deleting register:', error);
        } finally {
            setIsDeleting(false);
            setRegisterToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <p className="text-muted-foreground">Loading registers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome, {user?.displayName || user?.primaryEmail?.split('@')[0]}
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your attendance registers
                    </p>
                </div>
            </div>

            {registers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] gap-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">No Registers</h3>
                        <p className="text-sm text-muted-foreground">
                            Get started by creating your first register
                        </p>
                    </div>
                    <CreateRegisterDialog
                        isLoading={isCreatingRegister}
                        onCreateRegister={handleCreateRegister}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registers.map((register) => (
                        <Card
                            key={register.id}
                            className="hover:bg-muted/50 transition-colors cursor-pointer group relative"
                        >
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute right-2 top-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRegisterToDelete(register);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <CardHeader onClick={() => router.push(`/dashboard/registers/${register.id}`)}>
                                <CardTitle>{register.description || 'Untitled Register'}</CardTitle>
                                <CardDescription>
                                    Created on {format(new Date(register.date), 'PPP')}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                    <Card
                        className="hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center h-[140px]"
                        onClick={() => document.querySelector<HTMLButtonElement>('[data-create-register]')?.click()}
                    >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Plus className="h-8 w-8" />
                            <p className="text-sm font-medium">Create New Register</p>
                        </div>
                    </Card>
                </div>
            )}

            <AlertDialog open={!!registerToDelete} onOpenChange={(open: boolean) => !open && setRegisterToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the register
                            and all associated data including employees, attendance records, and salary advances.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRegister}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete Register"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 