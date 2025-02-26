'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BanknoteIcon, ChevronRight, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { getAllSalaryAdvances } from "@/app/actions/register";
import { cn } from "@/lib/utils";
import { useReports } from "../context/reports-context";
import { SalaryAdvanceDialog } from "@/components/dashboard/attendance/salary-advance-dialog";
import { Employee as AttendanceEmployee } from "@/components/dashboard/types/attendance-types";
import { useParams } from "next/navigation";

interface SalaryAdvance {
    id: number;
    amount: string;
    requestDate: Date;
    description: string | null;
    status: string;
    createdAt: Date;
}

export function SalaryAdvancesSection() {
    const params = useParams();
    const registerId = params.id as string;
    const { selectedEmployee, dateRange } = useReports();
    const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
    const [totalAmount, setTotalAmount] = useState("0");
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedMonthAdvances, setSelectedMonthAdvances] = useState<SalaryAdvance[]>([]);
    const [showSalaryAdvanceDialog, setShowSalaryAdvanceDialog] = useState(false);

    // Create a compatible employee object for the SalaryAdvanceDialog
    const adaptedEmployee = selectedEmployee ? {
        ...selectedEmployee,
        position: 'employee',  // Default value
        department: 'General', // Default value
        baseSalary: '0',       // Default value
        passcode: null
    } as AttendanceEmployee : null;

    useEffect(() => {
        if (selectedEmployee && dateRange?.from && dateRange?.to) {
            loadAdvances();
        }
    }, [selectedEmployee, dateRange]);

    const loadAdvances = async () => {
        if (!selectedEmployee) return;
        try {
            const result = await getAllSalaryAdvances(selectedEmployee.id);
            if ('data' in result && result.data) {
                const mappedAdvances = result.data.map(advance => ({
                    ...advance,
                    requestDate: new Date(advance.requestDate),
                    createdAt: new Date(advance.createdAt)
                }));

                setAdvances(mappedAdvances);
                const total = mappedAdvances.reduce((sum, advance) =>
                    sum + parseFloat(advance.amount), 0
                ).toFixed(2);
                setTotalAmount(total);
            }
        } catch (error) {
            console.error('Error loading advances:', error);
        }
    };

    const handleMonthClick = (month: string, monthAdvances: SalaryAdvance[]) => {
        if (selectedMonth === month) {
            setSelectedMonth(null);
            setSelectedMonthAdvances([]);
        } else {
            setSelectedMonth(month);
            setSelectedMonthAdvances(monthAdvances);
        }
    };

    // Group advances by month
    const groupedAdvances = advances.reduce((groups, advance) => {
        const month = format(advance.requestDate, 'MMMM yyyy');
        if (!groups[month]) {
            groups[month] = [];
        }
        groups[month].push(advance);
        return groups;
    }, {} as Record<string, SalaryAdvance[]>);

    const handleSalaryAdvanceDialogClose = (open: boolean) => {
        setShowSalaryAdvanceDialog(open);
        if (!open) {
            // Reload advances after dialog closes to refresh the data
            loadAdvances();
        }
    };

    if (!selectedEmployee || !dateRange) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <BanknoteIcon className="h-12 w-12 mb-4" />
                    <p>Select an employee and date range to view salary advances</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Amount Owned
                        </CardTitle>
                        <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => setShowSalaryAdvanceDialog(true)}
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span>Add Salary Advance</span>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalAmount}</div>
                    </CardContent>
                </Card>
            </div>

            {advances.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(groupedAdvances).map(([month, monthAdvances]) => {
                                    const monthTotal = monthAdvances.reduce(
                                        (sum, advance) => sum + parseFloat(advance.amount),
                                        0
                                    ).toFixed(2);

                                    return (
                                        <TableRow
                                            key={month}
                                            className={cn(
                                                "cursor-pointer hover:bg-muted/50",
                                                selectedMonth === month && "bg-muted"
                                            )}
                                            onClick={() => handleMonthClick(month, monthAdvances)}
                                        >
                                            <TableCell>{month}</TableCell>
                                            <TableCell className="text-right">₹{monthTotal}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">₹{totalAmount}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                            <ChevronRight className="h-5 w-5" />
                            <span className="font-medium">
                                {selectedMonth || 'Select a month'}
                            </span>
                        </div>
                        <div className="rounded-md border flex-1">
                            {selectedMonth ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedMonthAdvances.map((advance) => (
                                            <TableRow key={advance.id}>
                                                <TableCell>
                                                    {format(advance.requestDate, 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ₹{advance.amount}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                    <BanknoteIcon className="h-12 w-12 mb-4" />
                                    <p>Select a month to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <BanknoteIcon className="h-12 w-12 mb-4" />
                        <p>No salary advances to show</p>
                    </CardContent>
                </Card>
            )}

            {selectedEmployee && (
                <SalaryAdvanceDialog
                    employee={adaptedEmployee}
                    open={showSalaryAdvanceDialog}
                    onOpenChange={handleSalaryAdvanceDialogClose}
                    registerId={registerId}
                />
            )}
        </>
    );
} 