'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "../types/attendance-types";
import { createSalaryAdvance, getTotalSalaryAdvances } from "@/app/actions/register";
import { toast } from "react-hot-toast";

interface SalaryAdvanceDialogProps {
    employee: Employee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SalaryAdvanceDialog({
    employee,
    open,
    onOpenChange,
}: SalaryAdvanceDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [totalAdvances, setTotalAdvances] = useState("0");
    const [formData, setFormData] = useState({
        amount: "",
        description: "",
    });

    useEffect(() => {
        if (employee && open) {
            loadData();
        }
    }, [employee, open]);

    const loadData = async () => {
        if (!employee) return;

        try {
            const totalResult = await getTotalSalaryAdvances(employee.id);
            if ('data' in totalResult) {
                setTotalAdvances(totalResult.data || "0");
            }
        } catch (error) {
            console.error('Error loading salary advance data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee) return;

        setIsLoading(true);
        try {
            const result = await createSalaryAdvance({
                employeeId: employee.id,
                amount: parseFloat(formData.amount),
                description: formData.description,
            });

            if ('data' in result) {
                toast.success('Salary advance created successfully');
                setFormData({
                    amount: "",
                    description: "",
                });
                await loadData();
                onOpenChange(false);
            } else {
                toast.error('Failed to create salary advance');
            }
        } catch (error) {
            console.error('Error creating salary advance:', error);
            toast.error('Failed to create salary advance');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Salary Advance</DialogTitle>
                    <DialogDescription>
                        Create a new salary advance for {employee?.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Total Advances</Label>
                            <p className="text-lg font-semibold">₹{totalAdvances}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    <span>Creating...</span>
                                </div>
                            ) : "Create Advance"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 