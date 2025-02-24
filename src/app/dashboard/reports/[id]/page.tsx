'use client';

import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Grid2x2, Loader2, ChevronRight, BanknoteIcon } from "lucide-react";
import { format } from "date-fns";
import { getAllEmployees, getAllSalaryAdvances, getEmployeeAttendanceLogs } from "@/app/actions/register";
import { DateRange } from "react-day-picker";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { formatMinutes } from "@/components/dashboard/utils/attendance-utils";
import { startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    durationAllowed: number;
}

interface SalaryAdvance {
    id: number;
    amount: string;
    requestDate: Date;
    description: string | null;
    status: string;
    createdAt: Date;
}

interface AttendanceLog {
    id: number;
    employeeId: number;
    employeePresentId: number;
    clockIn: Date | null;
    clockOut: Date | null;
    status: string;
    notes: string | null;
    createdAt: Date;
}

interface DailyAttendance {
    date: Date;
    totalDuration: number;
    logs: AttendanceLog[];
}

export default function ReportsPage() {
    const params = useParams();
    const registerId = params.id as string;
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
    const [totalAmount, setTotalAmount] = useState("0");
    const [attendanceLogs, setAttendanceLogs] = useState<DailyAttendance[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDayLogs, setSelectedDayLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedMonthAdvances, setSelectedMonthAdvances] = useState<SalaryAdvance[]>([]);

    useEffect(() => {
        if (registerId) {
            loadEmployees();
        }
    }, [registerId]);

    useEffect(() => {
        if (selectedEmployee && dateRange?.from && dateRange?.to) {
            loadAdvances();
            loadAttendanceLogs();
        }
    }, [selectedEmployee, dateRange]);

    const loadEmployees = async () => {
        if (!registerId) return;
        const result = await getAllEmployees(parseInt(registerId));
        if ('data' in result && result.data) {
            const validEmployees = result.data.filter(
                (employee): employee is Employee =>
                    employee.name !== null && typeof employee.name === 'string'
            );
            setEmployees(validEmployees);
        }
    };

    const loadAdvances = async () => {
        if (!selectedEmployee) return;
        setIsLoading(true);
        try {
            const result = await getAllSalaryAdvances(selectedEmployee);
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
        } finally {
            setIsLoading(false);
        }
    };

    const loadAttendanceLogs = async () => {
        if (!selectedEmployee || !dateRange?.from || !dateRange?.to) return;
        setIsLoading(true);

        try {
            const result = await getEmployeeAttendanceLogs(selectedEmployee, dateRange.from, dateRange.to);
            if ('data' in result && result.data) {
                const logs = result.data.map(log => ({
                    ...log,
                    clockIn: log.clockIn ? new Date(log.clockIn) : null,
                    clockOut: log.clockOut ? new Date(log.clockOut) : null,
                    createdAt: new Date(log.createdAt)
                }));

                // Group logs by date
                const logsByDate = logs.reduce((acc, log) => {
                    const date = log.clockIn || log.clockOut;
                    if (!date) return acc;

                    const dateKey = startOfDay(date).toISOString();
                    if (!acc[dateKey]) {
                        acc[dateKey] = [];
                    }
                    acc[dateKey].push(log);
                    return acc;
                }, {} as Record<string, AttendanceLog[]>);

                // Calculate daily totals and create DailyAttendance objects
                const dailyLogs: DailyAttendance[] = Object.entries(logsByDate).map(([dateStr, dayLogs]) => {
                    const totalDuration = dayLogs.reduce((total, log) => {
                        if (log.status === 'clock-in' && log.clockIn && log.clockOut) {
                            const duration = Math.floor((log.clockOut.getTime() - log.clockIn.getTime()) / (1000 * 60));
                            return total + Math.abs(duration);
                        }
                        return total;
                    }, 0);

                    return {
                        date: new Date(dateStr),
                        totalDuration,
                        logs: dayLogs.sort((a, b) => {
                            const aTime = a.clockOut?.getTime() || a.clockIn?.getTime() || 0;
                            const bTime = b.clockOut?.getTime() || b.clockIn?.getTime() || 0;
                            return bTime - aTime; // Sort by most recent first
                        })
                    };
                }).filter(day => day.logs.length > 0); // Only include days with logs

                setAttendanceLogs(dailyLogs);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateClick = (date: Date) => {
        if (selectedDate?.toDateString() === date.toDateString()) {
            // If clicking the same date, clear the selection
            setSelectedDate(null);
            setSelectedDayLogs([]);
        } else {
            // If clicking a different date, update the selection
            setSelectedDate(date);
            const dayLogs = attendanceLogs.find(log =>
                log.date.toDateString() === date.toDateString()
            )?.logs || [];
            setSelectedDayLogs(dayLogs);
        }
    };

    const handleMonthClick = (month: string, monthAdvances: SalaryAdvance[]) => {
        if (selectedMonth === month) {
            // If clicking the same month, clear the selection
            setSelectedMonth(null);
            setSelectedMonthAdvances([]);
        } else {
            // If clicking a different month, update the selection
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

    // Group attendance logs by month
    const groupedAttendance = attendanceLogs.reduce((groups, day) => {
        const month = format(day.date, 'MMMM yyyy');
        if (!groups[month]) {
            groups[month] = [];
        }
        groups[month].push(day);
        return groups;
    }, {} as Record<string, DailyAttendance[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Select
                    value={selectedEmployee?.toString()}
                    onValueChange={(value) => setSelectedEmployee(Number(value))}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                        {employees.map((employee) => (
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
                            className={`w-[300px] justify-start text-left font-normal
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
                    <PopoverContent className="w-auto p-0" align="start">
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

            {selectedEmployee && dateRange && (
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p>Loading data...</p>
                        </div>
                    ) : (
                        <>
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

                            <Separator className="my-8" />

                            <div className="text-2xl font-semibold mb-6">Attendance Logs Report</div>

                            {selectedEmployee && (
                                <Card className="mb-6">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Start Time</div>
                                                <div className="text-lg">
                                                    {employees.find(e => e.id === selectedEmployee)?.startTime
                                                        ? format(new Date(`2000-01-01T${employees.find(e => e.id === selectedEmployee)?.startTime}`), 'hh:mm a')
                                                        : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">End Time</div>
                                                <div className="text-lg">
                                                    {employees.find(e => e.id === selectedEmployee)?.endTime
                                                        ? format(new Date(`2000-01-01T${employees.find(e => e.id === selectedEmployee)?.endTime}`), 'hh:mm a')
                                                        : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-1">Allowed Duration</div>
                                                <div className="text-lg">{formatMinutes(employees.find(e => e.id === selectedEmployee)?.durationAllowed || 0)}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Total Duration</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.entries(groupedAttendance).map(([month, monthLogs]) => (
                                                monthLogs.map((day, index) => (
                                                    <TableRow
                                                        key={day.date.toISOString()}
                                                        className={cn(
                                                            "cursor-pointer hover:bg-muted/50",
                                                            selectedDate?.toDateString() === day.date.toDateString() && "bg-muted",
                                                            day.totalDuration > (employees.find(e => e.id === selectedEmployee)?.durationAllowed || 0) &&
                                                            "relative before:absolute before:inset-0 before:bg-red-500/10 before:animate-pulse"
                                                        )}
                                                        onClick={() => handleDateClick(day.date)}
                                                    >
                                                        {index === 0 && (
                                                            <TableCell
                                                                rowSpan={monthLogs.length}
                                                                className="align-top"
                                                            >
                                                                {month}
                                                            </TableCell>
                                                        )}
                                                        <TableCell>
                                                            {format(day.date, 'dd MMM yyyy')}
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-right",
                                                            day.totalDuration > (employees.find(e => e.id === selectedEmployee)?.durationAllowed || 0) &&
                                                            "text-red-600 font-medium"
                                                        )}>
                                                            {formatMinutes(day.totalDuration)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                                        <ChevronRight className="h-5 w-5" />
                                        <span className="font-medium">
                                            {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : 'Select a date'}
                                        </span>
                                    </div>
                                    <div className="rounded-md border flex-1">
                                        {selectedDate ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Clock Out</TableHead>
                                                        <TableHead>Clock In</TableHead>
                                                        <TableHead>Duration</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedDayLogs.map((log) => {
                                                        let duration = 0;
                                                        if (log.clockIn && log.clockOut) {
                                                            const clockInTime = new Date(log.clockIn);
                                                            const clockOutTime = new Date(log.clockOut);
                                                            duration = Math.abs(Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)));
                                                        }

                                                        return (
                                                            <TableRow key={log.id}>
                                                                <TableCell>
                                                                    {log.clockOut ? format(log.clockOut, 'hh:mm a') : '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {log.clockIn ? format(log.clockIn, 'hh:mm a') : '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatMinutes(duration)}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                                <Grid2x2 className="h-12 w-12 mb-4" />
                                                <p>Select a record on the log table</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
} 