'use client';

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronRight, Grid2x2 } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { getEmployeeAttendanceLogs } from "@/app/actions/register";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/components/dashboard/utils/attendance-utils";
import { useReports } from "../context/reports-context";

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

export function AttendanceLogsSection() {
    const { selectedEmployee, dateRange } = useReports();
    const [attendanceLogs, setAttendanceLogs] = useState<DailyAttendance[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDayLogs, setSelectedDayLogs] = useState<AttendanceLog[]>([]);

    useEffect(() => {
        if (selectedEmployee && dateRange?.from && dateRange?.to) {
            loadAttendanceLogs();
        }
    }, [selectedEmployee, dateRange]);

    const loadAttendanceLogs = async () => {
        if (!selectedEmployee || !dateRange?.from || !dateRange?.to) return;

        try {
            const result = await getEmployeeAttendanceLogs(selectedEmployee.id, dateRange.from, dateRange.to);
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
        } catch (error) {
            console.error('Error loading attendance logs:', error);
        }
    };

    const handleDateClick = (date: Date) => {
        if (selectedDate?.toDateString() === date.toDateString()) {
            setSelectedDate(null);
            setSelectedDayLogs([]);
        } else {
            setSelectedDate(date);
            const dayLogs = attendanceLogs.find(log =>
                log.date.toDateString() === date.toDateString()
            )?.logs || [];
            setSelectedDayLogs(dayLogs);
        }
    };

    // Group attendance logs by month
    const groupedAttendance = attendanceLogs.reduce((groups, day) => {
        const month = format(day.date, 'MMMM yyyy');
        if (!groups[month]) {
            groups[month] = [];
        }
        groups[month].push(day);
        return groups;
    }, {} as Record<string, DailyAttendance[]>);

    if (!selectedEmployee || !dateRange) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Grid2x2 className="h-12 w-12 mb-4" />
                    <p>Select an employee and date range to view attendance logs</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="text-2xl font-semibold mb-6">Attendance Logs Report</div>

            {selectedEmployee && (
                <Card className="mb-6">
                    <CardContent className="flex items-center justify-between py-6">
                        <div className="grid grid-cols-3 gap-8 w-full">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Start Time</div>
                                <div className="text-2xl font-bold">{format(new Date(`2000-01-01T${selectedEmployee.startTime}`), 'hh:mm a')}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">End Time</div>
                                <div className="text-2xl font-bold">{format(new Date(`2000-01-01T${selectedEmployee.endTime}`), 'hh:mm a')}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Allowed Duration</div>
                                <div className="text-2xl font-bold">{formatMinutes(selectedEmployee.durationAllowed)}</div>
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
                                monthLogs.map((day, index) => {
                                    const isOvertime = selectedEmployee && day.totalDuration > selectedEmployee.durationAllowed;
                                    return (
                                        <TableRow
                                            key={day.date.toISOString()}
                                            className={cn(
                                                "cursor-pointer hover:bg-muted/50",
                                                selectedDate?.toDateString() === day.date.toDateString() && "bg-muted",
                                                isOvertime && "bg-red-100 dark:bg-red-900/20"
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
                                            <TableCell className="text-right">
                                                {formatMinutes(day.totalDuration)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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
                                        <TableHead>Clock In</TableHead>
                                        <TableHead>Clock Out</TableHead>
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
                                                    {log.clockIn ? format(log.clockIn, 'hh:mm a') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {log.clockOut ? format(log.clockOut, 'hh:mm a') : '-'}
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
    );
} 