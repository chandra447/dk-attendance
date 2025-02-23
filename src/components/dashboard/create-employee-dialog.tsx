'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createEmployee } from "@/app/actions/register";

interface CreateEmployeeDialogProps {
    registerId: string;
    registerName?: string;
}

const POSITIONS = ["employee", "supervisor"] as const;

export function CreateEmployeeDialog({ registerId, registerName }: CreateEmployeeDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        position: 'employee' as typeof POSITIONS[number],
        department: '',
        baseSalary: '',
        passcode: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.position === 'supervisor' && !formData.passcode) {
            alert('Passcode is required for supervisors');
            return;
        }

        setIsLoading(true);
        try {
            await createEmployee({
                ...formData,
                baseSalary: parseFloat(formData.baseSalary),
                registerId: parseInt(registerId),
            });

            setFormData({
                name: '',
                position: 'employee',
                department: '',
                baseSalary: '',
                passcode: '',
            });
            setOpen(false);
            window.location.reload(); // Refresh to show new employee
        } catch (error) {
            console.error('Error creating employee:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-lg sm:rounded-2xl p-6">
                <DialogHeader className="space-y-2 text-center">
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        {registerName
                            ? `Add a new employee to ${registerName}`
                            : "Please select a register to add employees"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                                disabled={!registerName}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">
                                Position
                            </Label>
                            <Select
                                value={formData.position}
                                onValueChange={(value: typeof POSITIONS[number]) =>
                                    setFormData(prev => ({ ...prev, position: value }))
                                }
                                disabled={!registerName}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {POSITIONS.map((position) => (
                                        <SelectItem key={position} value={position}>
                                            {position.charAt(0).toUpperCase() + position.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.position === 'supervisor' && (
                            <div className="space-y-2">
                                <Label htmlFor="passcode">
                                    Passcode
                                </Label>
                                <Input
                                    id="passcode"
                                    type="number"
                                    value={formData.passcode}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.length <= 5) {
                                            setFormData(prev => ({ ...prev, passcode: value }));
                                        }
                                    }}
                                    placeholder="5-digit passcode"
                                    required={formData.position === 'supervisor'}
                                    min="0"
                                    max="99999"
                                    disabled={!registerName}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="department">
                                Department
                            </Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                required
                                disabled={!registerName}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="baseSalary">
                                Base Salary
                            </Label>
                            <Input
                                id="baseSalary"
                                type="number"
                                value={formData.baseSalary}
                                onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
                                required
                                disabled={!registerName}
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !registerName}
                        className="w-full my-4"
                    >
                        {isLoading ? "Adding..." : "Add Employee"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
} 