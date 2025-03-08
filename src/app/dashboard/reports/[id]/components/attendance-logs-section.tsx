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
            const result = await getEmployeeAttendanceLogs(
                selectedEmployee.id,
                dateRange.from,
                dateRange.to
            );

            if ('data' in result && result.data) {
                // Group logs by date
                const groupedLogs: Record<string, AttendanceLog[]> = {};

                result.data.forEach(log => {
                    const date = startOfDay(new Date(log.createdAt)).toISOString();
                    if (!groupedLogs[date]) {
                        groupedLogs[date] = [];
                    }
                    groupedLogs[date].push({
                        ...log,
                        clockIn: log.clockIn ? new Date(log.clockIn) : null,
                        clockOut: log.clockOut ? new Date(log.clockOut) : null,
                        createdAt: new Date(log.createdAt)
                    });
                });

                // Calculate total duration for each day
                const dailyAttendance: DailyAttendance[] = Object.keys(groupedLogs).map(dateStr => {
                    const date = new Date(dateStr);
                    const logs = groupedLogs[dateStr];
                    let totalDuration = 0;

                    logs.forEach(log => {
                        if (log.clockIn && log.clockOut) {
                            const duration = Math.floor((log.clockOut.getTime() - log.clockIn.getTime()) / (1000 * 60));
                            totalDuration += duration;
                        }
                    });

                    return {
                        date,
                        totalDuration,
                        logs
                    };
                });

                // Sort by date (newest first)
                dailyAttendance.sort((a, b) => b.date.getTime() - a.date.getTime());
                setAttendanceLogs(dailyAttendance);

                // Reset selected date
                setSelectedDate(null);
                setSelectedDayLogs([]);
            }
        } catch (error) {
            console.error('Error loading attendance logs:', error);
        }
    };

    const handleDateClick = (date: Date) => {
        if (selectedDate && selectedDate.getTime() === date.getTime()) {
            // If clicking the same date, toggle off
            setSelectedDate(null);
            setSelectedDayLogs([]);
        } else {
            // Otherwise, select the date and show its logs
            setSelectedDate(date);
            const dayLogs = attendanceLogs.find(
                a => a.date.getTime() === date.getTime()
            )?.logs || [];
            setSelectedDayLogs(dayLogs);
        }
    };

    if (!selectedEmployee) {
        return (
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Select an employee to view attendance logs
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
                        Select a date range to view attendance logs
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 mt-4 overflow-x-auto">
            <Card>
                <CardContent className="pt-6 overflow-auto">
                    <div className="text-sm font-medium mb-4">Attendance Summary</div>
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">Date</TableHead>
                                    <TableHead className="hidden sm:table-cell">Day</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceLogs.length > 0 ? (
                                    attendanceLogs.map((attendance) => (
                                        <TableRow
                                            key={attendance.date.toISOString()}
                                            className={cn(
                                                "cursor-pointer",
                                                selectedDate && selectedDate.getTime() === attendance.date.getTime()
                                                    ? "bg-muted/50"
                                                    : ""
                                            )}
                                            onClick={() => handleDateClick(attendance.date)}
                                        >
                                            <TableCell className="font-medium">
                                                {format(attendance.date, "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {format(attendance.date, "EEEE")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatMinutes(attendance.totalDuration)}
                                            </TableCell>
                                            <TableCell>
                                                <ChevronRight className={cn(
                                                    "h-4 w-4 transition-transform",
                                                    selectedDate && selectedDate.getTime() === attendance.date.getTime()
                                                        ? "rotate-90"
                                                        : ""
                                                )} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No attendance records found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {selectedDate && selectedDayLogs.length > 0 && (
                <Card>
                    <CardContent className="pt-6 overflow-auto">
                        <div className="text-sm font-medium mb-4">
                            Logs for {format(selectedDate, "MMMM dd, yyyy")}
                        </div>
                        <div className="overflow-x-auto -mx-6 px-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden sm:table-cell">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedDayLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">
                                                {log.clockIn
                                                    ? format(log.clockIn, "hh:mm a")
                                                    : log.clockOut
                                                        ? format(log.clockOut, "hh:mm a")
                                                        : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <div
                                                        className={cn(
                                                            "h-2 w-2 rounded-full mr-2",
                                                            log.status === "CLOCK_IN"
                                                                ? "bg-green-500"
                                                                : log.status === "CLOCK_OUT"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-gray-500"
                                                        )}
                                                    />
                                                    {log.status === "CLOCK_IN"
                                                        ? "Clock In"
                                                        : log.status === "CLOCK_OUT"
                                                            ? "Clock Out"
                                                            : log.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {log.notes || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 