'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getAllRegisters } from "@/app/actions/register";
import { getAllEmployees } from "@/app/actions/register";
import { getAllSalaryAdvances } from "@/app/actions/register";

interface SalaryAdvance {
    id: number;
    amount: string;
    requestDate: Date;
    description: string | null;
    status: string;
    createdAt: Date;
}

export function ReportsPage() {
    const [registers, setRegisters] = useState([]);
    const [selectedRegister, setSelectedRegister] = useState<number | null>(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
    const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
    const [totalAmount, setTotalAmount] = useState("0");

    useEffect(() => {
        loadRegisters();
    }, []);

    useEffect(() => {
        if (selectedRegister) {
            loadEmployees();
        }
    }, [selectedRegister]);

    useEffect(() => {
        if (selectedEmployee && dateRange?.from && dateRange?.to) {
            loadAdvances();
        }
    }, [selectedEmployee, dateRange]);

    const loadRegisters = async () => {
        const result = await getAllRegisters();
        if ('data' in result) {
            setRegisters(result.data);
        }
    };

    const loadEmployees = async () => {
        if (!selectedRegister) return;
        const result = await getAllEmployees(selectedRegister);
        if ('data' in result) {
            setEmployees(result.data);
        }
    };

    const loadAdvances = async () => {
        if (!selectedEmployee || !dateRange?.from || !dateRange?.to) return;
        const result = await getAllSalaryAdvances(selectedEmployee);
        if ('data' in result) {
            const filteredAdvances = result.data
                .map(advance => ({
                    ...advance,
                    requestDate: new Date(advance.requestDate),
                    createdAt: new Date(advance.createdAt)
                }))
                .filter(advance =>
                    advance.requestDate >= dateRange.from &&
                    advance.requestDate <= dateRange.to
                );

            setAdvances(filteredAdvances);
            const total = filteredAdvances.reduce((sum, advance) =>
                sum + parseFloat(advance.amount), 0
            ).toFixed(2);
            setTotalAmount(total);
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

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center space-x-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">Salary Advance Reports</h1>
                        <div className="flex items-center space-x-4 ml-auto">
                            <Select
                                value={selectedRegister?.toString()}
                                onValueChange={(value) => {
                                    setSelectedRegister(Number(value));
                                    setSelectedEmployee(null);
                                }}
                            >
                                <SelectTrigger className="w-[200px] bg-primary-foreground text-primary">
                                    <SelectValue placeholder="Select Register" />
                                </SelectTrigger>
                                <SelectContent>
                                    {registers.map((register: any) => (
                                        <SelectItem
                                            key={register.id}
                                            value={register.id.toString()}
                                        >
                                            {register.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedEmployee?.toString()}
                                onValueChange={(value) => setSelectedEmployee(Number(value))}
                                disabled={!selectedRegister}
                            >
                                <SelectTrigger className="w-[200px] bg-primary-foreground text-primary">
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee: any) => (
                                        <SelectItem
                                            key={employee.id}
                                            value={employee.id.toString()}
                                        >
                                            {employee.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-[300px] justify-start text-left font-normal bg-primary-foreground text-primary
                                            ${!dateRange && "text-muted-foreground"}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {selectedEmployee && dateRange && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Amount Owned
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{totalAmount}</div>
                            </CardContent>
                        </Card>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(groupedAdvances).map(([month, monthAdvances]) => (
                                        monthAdvances.map((advance, index) => (
                                            <TableRow key={advance.id}>
                                                {index === 0 && (
                                                    <TableCell
                                                        rowSpan={monthAdvances.length}
                                                        className="align-top"
                                                    >
                                                        {month}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    {format(advance.requestDate, 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ₹{advance.amount}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell className="text-right">₹{totalAmount}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 