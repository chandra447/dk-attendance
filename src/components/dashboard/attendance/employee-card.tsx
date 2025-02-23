import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, UserRoundCheck, UserRoundX } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markEmployeePresent, checkEmployeePresent, clockInEmployee, clockOutEmployee, getEmployeeAttendanceLogs } from "@/app/actions/register";
import { Employee, EmployeePresent, AttendanceLog } from "../types/attendance-types";
import { AttendanceLogDrawer } from "./attendance-log-drawer";
import { EditEmployeeDialog } from "./edit-employee-dialog";

interface EmployeeCardProps {
    employee: Employee;
    date: Date;
    onStatusChange: () => void;
}

export function EmployeeCard({
    employee,
    date,
    onStatusChange
}: EmployeeCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [presentRecord, setPresentRecord] = useState<EmployeePresent | null>(null);
    const [lastLog, setLastLog] = useState<AttendanceLog | null>(null);
    const [showLogDrawer, setShowLogDrawer] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [clockOutDuration, setClockOutDuration] = useState<string>("00:00:00");

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (lastLog && lastLog.status === 'clock-out' && lastLog.clockOut) {
            const updateDuration = () => {
                const now = new Date();
                const clockOutTime = new Date(lastLog.clockOut!);
                const diffInSeconds = Math.floor((now.getTime() - clockOutTime.getTime()) / 1000);

                // Calculate hours, minutes, seconds
                const hours = Math.floor(diffInSeconds / 3600);
                const minutes = Math.floor((diffInSeconds % 3600) / 60);
                const seconds = diffInSeconds % 60;

                // Format with leading zeros
                const formattedHours = hours.toString().padStart(2, '0');
                const formattedMinutes = minutes.toString().padStart(2, '0');
                const formattedSeconds = seconds.toString().padStart(2, '0');

                setClockOutDuration(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
            };

            // Update immediately
            updateDuration();
            // Then update every second
            intervalId = setInterval(updateDuration, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [lastLog]);

    useEffect(() => {
        async function fetchStatus() {
            try {
                // Check present record for today without creating one
                const presentResult = await checkEmployeePresent(employee.id, date);
                if ('data' in presentResult) {
                    setPresentRecord(presentResult.data);

                    // Get attendance logs for today
                    const logsResult = await getEmployeeAttendanceLogs(employee.id, date);
                    if ('data' in logsResult && logsResult.data && logsResult.data.length > 0) {
                        // Sort logs by creation time to get the latest one
                        const sortedLogs = [...logsResult.data].sort((a, b) => {
                            const dateA = a.clockOut || a.clockIn;
                            const dateB = b.clockOut || b.clockIn;
                            return new Date(dateB).getTime() - new Date(dateA).getTime();
                        });
                        setLastLog(sortedLogs[0]); // Get the most recent log
                    } else {
                        setLastLog(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            }
        }
        fetchStatus();
    }, [employee.id, date]);

    const handlePresent = async () => {
        setIsLoading(true);
        try {
            const result = await markEmployeePresent(employee.id, date);
            if ('data' in result) {
                setPresentRecord(result.data);
                onStatusChange();
            }
        } catch (error) {
            console.error('Error marking present:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!presentRecord) return;
        setIsLoading(true);
        try {
            const result = await clockOutEmployee(employee.id, presentRecord.id);
            if ('data' in result) {
                setLastLog(result.data);
                onStatusChange();
            }
        } catch (error) {
            console.error('Error clocking out:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockIn = async () => {
        if (!presentRecord) return;
        setIsLoading(true);
        try {
            const result = await clockInEmployee(employee.id, presentRecord.id);
            if ('data' in result) {
                setLastLog(result.data);
                onStatusChange();
            }
        } catch (error) {
            console.error('Error clocking in:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Determine button states based on present record and last log
    const shouldEnableClockIn = presentRecord && lastLog?.status === 'clock-out';

    const shouldEnableClockOut = presentRecord &&
        (!lastLog || lastLog.status === 'clock-in');

    return (
        <Card className="relative">
            {lastLog && lastLog.status === 'clock-out' && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}

            <CardContent className="pt-6">
                <div className="absolute right-12 top-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowLogDrawer(true)}>
                                View Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                Edit
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{employee.name}</h3>
                            {presentRecord ? (
                                <UserRoundCheck className="h-5 w-5 text-green-500" />
                            ) : (
                                <UserRoundX className="h-5 w-5 text-red-500" />
                            )}
                        </div>
                        {presentRecord && (
                            <div className="text-sm text-muted-foreground">
                                Present since {format(presentRecord.createdAt, "h:mm a")}
                            </div>
                        )}
                        {lastLog && lastLog.status === 'clock-out' && (
                            <div className="text-sm font-mono text-muted-foreground">
                                Out for {clockOutDuration}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={handlePresent}
                            disabled={isLoading || !!presentRecord}
                            variant={presentRecord ? "secondary" : "default"}
                            className="rounded-full"
                            size="sm"
                        >
                            {presentRecord ? "Present" : "Mark Present"}
                        </Button>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleClockIn}
                                disabled={isLoading || !shouldEnableClockIn}
                                variant="outline"
                            >
                                Clock In
                            </Button>
                            <Button
                                onClick={handleClockOut}
                                disabled={isLoading || !shouldEnableClockOut}
                                variant="outline"
                            >
                                Clock Out
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>

            <AttendanceLogDrawer
                employee={employee}
                date={date}
                open={showLogDrawer}
                onOpenChange={setShowLogDrawer}
                presentRecord={presentRecord}
            />

            <EditEmployeeDialog
                employee={employee}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onEmployeeUpdate={onStatusChange}
            />
        </Card>
    );
} 