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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Employee } from "../types/attendance-types";
import { updateEmployee } from "@/app/actions/register";

interface EditEmployeeDialogProps {
    employee: Employee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmployeeUpdate: () => void;
}

const POSITIONS = ["employee", "supervisor"] as const;

export function EditEmployeeDialog({
    employee,
    open,
    onOpenChange,
    onEmployeeUpdate
}: EditEmployeeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        position: 'employee' as typeof POSITIONS[number],
        department: '',
        baseSalary: '',
        passcode: '',
        startTime: '09:00',
        endTime: '17:00',
    });

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name,
                position: (employee.position === 'supervisor' ? 'supervisor' : 'employee') as typeof POSITIONS[number],
                department: employee.department,
                baseSalary: employee.baseSalary,
                passcode: employee.passcode || '',
                startTime: employee.startTime || '09:00',
                endTime: employee.endTime || '17:00',
            });
        }
    }, [employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee) return;

        if (formData.position === 'supervisor' && !formData.passcode) {
            alert('Passcode is required for supervisors');
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateEmployee({
                id: employee.id,
                ...formData,
                baseSalary: parseFloat(formData.baseSalary),
                startTime: formData.startTime,
                endTime: formData.endTime,
            });

            if ('data' in result) {
                onEmployeeUpdate();
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-lg sm:rounded-2xl p-6">
                <DialogHeader className="space-y-2 text-center">
                    <DialogTitle>Edit Employee</DialogTitle>
                    <DialogDescription>
                        Update employee information
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
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">
                                    Start Time
                                </Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">
                                    End Time
                                </Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full my-4"
                    >
                        {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
} 