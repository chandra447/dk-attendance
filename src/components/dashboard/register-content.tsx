'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Plus } from "lucide-react";

interface Employee {
    id: number;
    name: string;
    position: string;
    department: string;
    baseSalary: number;
}

interface RegisterContentProps {
    registerId: string;
    registerName: string;
}

export function RegisterContent({ registerId, registerName }: RegisterContentProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateEmployee = async (employeeData: Partial<Employee>) => {
        // TODO: Implement employee creation
        console.log('Creating employee:', employeeData);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">{registerName}</h1>
                <CreateEmployeeDialog onCreateEmployee={handleCreateEmployee} />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Base Salary</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell>{employee.name}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell className="text-right">
                                {employee.baseSalary.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'INR'
                                })}
                            </TableCell>
                        </TableRow>
                    ))}
                    {employees.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No employees found. Create one to get started.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function CreateEmployeeDialog({ onCreateEmployee }: { onCreateEmployee: (data: Partial<Employee>) => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        department: '',
        baseSalary: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onCreateEmployee({
            ...formData,
            baseSalary: parseFloat(formData.baseSalary),
        });
        setFormData({
            name: '',
            position: '',
            department: '',
            baseSalary: '',
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Add a new employee to this register.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="position" className="text-right">
                                Position
                            </Label>
                            <Input
                                id="position"
                                value={formData.position}
                                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="department" className="text-right">
                                Department
                            </Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="baseSalary" className="text-right">
                                Base Salary
                            </Label>
                            <Input
                                id="baseSalary"
                                type="number"
                                value={formData.baseSalary}
                                onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Employee</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 