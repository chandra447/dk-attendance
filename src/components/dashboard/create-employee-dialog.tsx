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
    onEmployeeUpdate: () => void;
}

const POSITIONS = ["employee", "supervisor"] as const;

export function CreateEmployeeDialog({ registerId, registerName, onEmployeeUpdate }: CreateEmployeeDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        position: 'employee' as typeof POSITIONS[number],
        baseSalary: '',
        passcode: '',
        startTime: '09:00',
        endTime: '17:00',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.position === 'supervisor' && !formData.passcode) {
            alert('Passcode is required for supervisors');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createEmployee({
                ...formData,
                department: 'default', // Set a default department
                baseSalary: parseFloat(formData.baseSalary),
                registerId: parseInt(registerId),
                startTime: formData.startTime,
                endTime: formData.endTime,
            });

            if ('data' in result) {
                onEmployeeUpdate(); // This will trigger a local state update in the parent
                setFormData({
                    name: '',
                    position: 'employee',
                    baseSalary: '',
                    passcode: '',
                    startTime: '09:00',
                    endTime: '17:00',
                });
                setOpen(false);
            }
        } catch (error) {
            console.error('Error creating employee:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] sm:w-full sm:max-w-[425px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="space-y-2 text-center">
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Add a new employee to {registerName || 'your register'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                                disabled={!registerName}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Position</Label>
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
                                <Label htmlFor="passcode">Passcode</Label>
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
                            <Label htmlFor="baseSalary">Base Salary</Label>
                            <Input
                                id="baseSalary"
                                type="number"
                                value={formData.baseSalary}
                                onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
                                required
                                disabled={!registerName}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    required
                                    disabled={!registerName}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    required
                                    disabled={!registerName}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            type="submit"
                            disabled={isLoading || !registerName}
                            className="w-full"
                        >
                            {isLoading ? "Adding..." : "Add Employee"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 