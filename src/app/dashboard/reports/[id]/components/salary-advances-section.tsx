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
        } else {
            setAdvances([]);
            setTotalAmount("0");
            setSelectedMonth(null);
            setSelectedMonthAdvances([]);
        }
    }, [selectedEmployee, dateRange]);

    const loadAdvances = async () => {
        if (!selectedEmployee || !dateRange?.from || !dateRange?.to) return;

        try {
            const result = await getAllSalaryAdvances(selectedEmployee.id);
            if ('data' in result && result.data) {
                const advancesList = result.data.map(advance => ({
                    ...advance,
                    requestDate: new Date(advance.requestDate),
                    createdAt: new Date(advance.createdAt)
                }));

                // Filter advances by date range
                const filteredAdvances = advancesList.filter(advance => {
                    // At this point we know dateRange.from and dateRange.to are defined
                    // because we checked at the beginning of the function
                    const fromDate = dateRange.from as Date;
                    const toDate = dateRange.to as Date;
                    return advance.requestDate >= fromDate &&
                        advance.requestDate <= toDate;
                });

                // Sort by date (newest first)
                filteredAdvances.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
                setAdvances(filteredAdvances);

                // Calculate total amount
                const total = filteredAdvances.reduce((sum, advance) => {
                    return sum + parseFloat(advance.amount);
                }, 0);
                setTotalAmount(total.toFixed(2));
            }
        } catch (error) {
            console.error('Error loading salary advances:', error);
        }
    };

    const handleMonthClick = (month: string, monthAdvances: SalaryAdvance[]) => {
        if (selectedMonth === month) {
            // If clicking the same month, toggle off
            setSelectedMonth(null);
            setSelectedMonthAdvances([]);
        } else {
            // Otherwise, select the month and show its advances
            setSelectedMonth(month);
            setSelectedMonthAdvances(monthAdvances);
        }
    };

    const handleSalaryAdvanceDialogClose = (open: boolean) => {
        setShowSalaryAdvanceDialog(open);
        if (!open) {
            // Refresh data when dialog is closed
            loadAdvances();
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

    if (!selectedEmployee) {
        return (
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Select an employee to view salary advances
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!dateRange?.from || !dateRange?.to) {
        return (
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Select a date range to view salary advances
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Salary Advances</h3>
                {adaptedEmployee && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSalaryAdvanceDialog(true)}
                        className="text-xs sm:text-sm"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Advance
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6 overflow-auto">
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(groupedAdvances).length > 0 ? (
                                    Object.entries(groupedAdvances).map(([month, monthAdvances]) => {
                                        const monthTotal = monthAdvances.reduce((sum, advance) => {
                                            return sum + parseFloat(advance.amount);
                                        }, 0);

                                        return (
                                            <TableRow
                                                key={month}
                                                className={cn(
                                                    "cursor-pointer",
                                                    selectedMonth === month ? "bg-muted/50" : ""
                                                )}
                                                onClick={() => handleMonthClick(month, monthAdvances)}
                                            >
                                                <TableCell className="font-medium">{month}</TableCell>
                                                <TableCell className="text-right">
                                                    ${monthTotal.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <ChevronRight className={cn(
                                                        "h-4 w-4 transition-transform",
                                                        selectedMonth === month ? "rotate-90" : ""
                                                    )} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
                                            No salary advances found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            {Object.keys(groupedAdvances).length > 0 && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right">${totalAmount}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {selectedMonth && selectedMonthAdvances.length > 0 && (
                <Card>
                    <CardContent className="pt-6 overflow-auto">
                        <div className="text-sm font-medium mb-4">
                            Advances for {selectedMonth}
                        </div>
                        <div className="overflow-x-auto -mx-6 px-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                                        <TableHead className="hidden sm:table-cell">Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedMonthAdvances.map((advance) => (
                                        <TableRow key={advance.id}>
                                            <TableCell className="font-medium">
                                                {format(advance.requestDate, "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${parseFloat(advance.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <div className="flex items-center">
                                                    <div
                                                        className={cn(
                                                            "h-2 w-2 rounded-full mr-2",
                                                            advance.status === "APPROVED"
                                                                ? "bg-green-500"
                                                                : advance.status === "PENDING"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
                                                        )}
                                                    />
                                                    {advance.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {advance.description || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {adaptedEmployee && (
                <SalaryAdvanceDialog
                    open={showSalaryAdvanceDialog}
                    onOpenChange={handleSalaryAdvanceDialogClose}
                    employee={adaptedEmployee}
                    registerId={registerId}
                />
            )}
        </div>
    );
} 