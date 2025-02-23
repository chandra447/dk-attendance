import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getEmployeeAttendanceLogs } from "@/app/actions/register";
import { Employee, EmployeePresent, AttendanceLog } from "../types/attendance-types";
import { formatDuration } from "../utils/attendance-utils";

interface AttendanceLogDrawerProps {
    employee: Employee;
    date: Date;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    presentRecord: EmployeePresent | null;
}

export function AttendanceLogDrawer({
    employee,
    date,
    open,
    onOpenChange,
    presentRecord
}: AttendanceLogDrawerProps) {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalDuration, setTotalDuration] = useState<string>("00:00:00");

    const calculateTotalDuration = (logs: AttendanceLog[]) => {
        let totalSeconds = 0;

        logs.forEach(log => {
            if (log.clockIn && log.clockOut) {
                // Only calculate duration for completed sessions
                const clockInTime = new Date(log.clockIn);
                const clockOutTime = new Date(log.clockOut);
                const diffInSeconds = Math.floor((clockInTime.getTime() - clockOutTime.getTime()) / 1000);
                totalSeconds += diffInSeconds;
            }
        });

        // Convert total seconds to HH:MM format
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    };

    useEffect(() => {
        async function fetchLogs() {
            setIsLoading(true);
            try {
                const result = await getEmployeeAttendanceLogs(employee.id, date);
                if ('data' in result && result.data) {
                    const processedLogs = result.data.map(log => ({
                        ...log,
                        clockIn: log.clockIn ? new Date(log.clockIn) : null,
                        clockOut: log.clockOut ? new Date(log.clockOut) : null
                    }));
                    setLogs(processedLogs);
                    setTotalDuration(calculateTotalDuration(processedLogs));
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setIsLoading(false);
            }
        }

        if (open) {
            fetchLogs();
        }
    }, [employee.id, date, open]);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[50vh]">
                <DrawerHeader className="pb-2">
                    <DrawerTitle>{employee.name} - Attendance Log</DrawerTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        {presentRecord ? (
                            <span>Present since {format(presentRecord.createdAt, "h:mm a")}</span>
                        ) : (
                            <span>Not marked present</span>
                        )}
                        <div className="font-mono">
                            Total Duration: {totalDuration}
                        </div>
                    </div>
                </DrawerHeader>
                <div className="flex-1 flex items-start justify-center px-4">
                    <div className="w-full max-w-2xl">
                        {isLoading ? (
                            <div className="text-center py-4">Loading logs...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Check-in Time</TableHead>
                                        <TableHead className="w-[120px]">Check-out Time</TableHead>
                                        <TableHead className="w-[100px]">Duration</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">
                                                No attendance records found for this date
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{log.clockIn ? format(log.clockIn, "p") : "-"}</TableCell>
                                                <TableCell>{log.clockOut ? format(log.clockOut, "p") : "-"}</TableCell>
                                                <TableCell className="flex items-center gap-2">
                                                    {log.status === 'clock-out' && (
                                                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                    )}
                                                    {formatDuration(log.clockIn, log.clockOut)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
} 