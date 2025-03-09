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
import { markEmployeePresent, checkEmployeePresent, clockInEmployee, clockOutEmployee, getEmployeeAttendanceLogs, markEmployeeAbsent, markEmployeeReturnFromAbsent } from "@/app/actions/register";
import { Employee, EmployeePresent, AttendanceLog } from "../types/attendance-types";
import { AttendanceLogDrawer } from "./attendance-log-drawer";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { SalaryAdvanceDialog } from "./salary-advance-dialog";
import { cn } from "@/lib/utils";
import { formatMinutes } from "../utils/attendance-utils";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface EmployeeCardProps {
    employee: Employee;
    date: Date;
    isLoading?: boolean;
    presentRecord: EmployeePresent | null;
    logs: AttendanceLog[];
    onStatusChange: (employeeId: number) => void;
    onLoadingChange: (isLoading: boolean) => void;
    onUpdateStatus: (presentRecord: EmployeePresent | null, logs: AttendanceLog[]) => void;
    registerStartTime: Date | null;
}

export function EmployeeCard({
    employee,
    date,
    isLoading = false,
    presentRecord,
    logs,
    onStatusChange,
    onLoadingChange,
    onUpdateStatus,
    registerStartTime
}: EmployeeCardProps) {
    const [showLogDrawer, setShowLogDrawer] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showSalaryAdvanceDialog, setShowSalaryAdvanceDialog] = useState(false);
    const [clockOutDuration, setClockOutDuration] = useState<string>("00:00:00");
    const lastLog = logs.length > 0 ? logs[0] : null;
    const router = useRouter();


    // Check if employee has returned from absence today
    const hasReturnedFromAbsence = logs.some(log =>
        log.notes === 'Returned from absence' &&
        log.clockIn &&
        new Date(log.clockIn).toDateString() === date.toDateString()
    );

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

    const calculateTotalDuration = (logs: AttendanceLog[]) => {
        let totalMinutes = 0;

        logs.forEach(log => {
            if (log.status === 'clock-in' && log.clockIn && log.clockOut) {
                // For completed clock-in periods
                const clockInTime = new Date(log.clockIn);
                const clockOutTime = new Date(log.clockOut);
                const diffInMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
                totalMinutes += Math.abs(diffInMinutes);
            } else if (log.status === 'clock-out' && log.clockOut) {
                // For ongoing clock-out periods (negative because employee is clocked out)
                const clockOutTime = new Date(log.clockOut);
                const now = new Date();
                const diffInMinutes = Math.floor((now.getTime() - clockOutTime.getTime()) / (1000 * 60));
                // We don't add clock-out time to total duration
                // This was causing negative durations in the UI
                // totalMinutes += diffInMinutes;
            }
        });

        return totalMinutes;
    };

    const totalMinutes = calculateTotalDuration(logs);
    const isOvertime = totalMinutes > employee.durationAllowed;

    const handlePresent = async () => {
        onLoadingChange(true);
        try {
            const result = await markEmployeePresent(employee.id, date);
            if ('data' in result && result.data) {
                const newPresentRecord = {
                    ...result.data,
                    date: new Date(result.data.date),
                    createdAt: new Date(result.data.createdAt),
                    updatedAt: new Date(result.data.updatedAt)
                };
                onUpdateStatus(newPresentRecord, logs);
                onStatusChange(employee.id);
            }
        } catch (error) {
            console.error('Error marking present:', error);
        } finally {
            onLoadingChange(false);
        }
    };

    const handleClockOut = async () => {
        if (!presentRecord) return;
        console.log('Starting clock-out operation for:', employee.name);
        console.log('Using present record:', presentRecord);
        console.log('Current logs before clock-out:', logs);

        onLoadingChange(true);
        try {
            const result = await clockOutEmployee(employee.id, presentRecord.id);
            console.log('Clock-out API response:', result);

            if ('data' in result && result.data) {
                const newLog = {
                    ...result.data,
                    clockIn: result.data.clockIn ? new Date(result.data.clockIn) : null,
                    clockOut: result.data.clockOut ? new Date(result.data.clockOut) : null
                };
                console.log('Processed new log:', newLog);

                const newLogs = [newLog, ...logs];
                console.log('Updated logs array:', newLogs);

                onUpdateStatus(presentRecord, newLogs);
                onStatusChange(employee.id);
                toast.success("Employee clocked out successfully");
            }
        } catch (error) {
            console.error('Error clocking out:', error);
            toast.error("Failed to clock out employee");
        } finally {
            onLoadingChange(false);
        }
    };

    const handleClockIn = async () => {
        if (!presentRecord) return;
        console.log('Starting clock-in operation for:', employee.name);
        console.log('Using present record:', presentRecord);
        console.log('Current logs before clock-in:', logs);

        onLoadingChange(true);
        try {
            const result = await clockInEmployee(employee.id, presentRecord.id);
            console.log('Clock-in API response:', result);

            if ('data' in result && result.data) {
                // Find the latest clock-out log and update it with the new clock-in time
                const updatedLogs = logs.map(log => {
                    if (log.id === result.data.id) {
                        return {
                            ...result.data,
                            clockIn: result.data.clockIn ? new Date(result.data.clockIn) : null,
                            clockOut: result.data.clockOut ? new Date(result.data.clockOut) : null,
                            status: 'clock-in'
                        };
                    }
                    return log;
                });

                console.log('Updated logs array:', updatedLogs);
                onUpdateStatus(presentRecord, updatedLogs);
                onStatusChange(employee.id);
                toast.success("Employee clocked in successfully");
            }
        } catch (error) {
            console.error('Error clocking in:', error);
            toast.error("Failed to clock in employee");
        } finally {
            onLoadingChange(false);
        }
    };

    // Helper variables for button visibility logic
    const isPresent = presentRecord?.status === 'present';
    const isAbsent = presentRecord?.status === 'absent';
    const isLastLogClockIn = lastLog?.status === 'clock-in';
    const isLastLogClockOut = lastLog?.status === 'clock-out';

    // Show Mark Absent only when employee is present AND either has no logs OR last log is clock-in
    const showMarkAbsentButton = isPresent && (!lastLog || isLastLogClockIn);

    // Show Clock Out button when employee is present AND (last log is clock-in OR no logs)
    const showClockOutButton = isPresent && (isLastLogClockIn || !lastLog);

    // Show Clock In button only when employee is present AND last log is clock-out
    const showClockInButton = isPresent && isLastLogClockOut;

    const handleUpdateLogs = (updatedLogs: AttendanceLog[]) => {
        onUpdateStatus(presentRecord, updatedLogs);
        onStatusChange(employee.id);
    };

    const handleAbsent = async () => {
        if (!presentRecord) return;
        onLoadingChange(true);
        try {
            const result = await markEmployeeAbsent(employee.id, presentRecord.id, new Date());
            if (result.error) {
                toast.error(result.error);
                return;
            }
            if ('data' in result && result.data) {
                const { presentRecord: updatedPresent } = result.data;
                // Update the present record with the new status and absentTimestamp
                const newPresentRecord = {
                    ...updatedPresent,
                    date: new Date(updatedPresent.date),
                    createdAt: new Date(updatedPresent.createdAt),
                    updatedAt: new Date(updatedPresent.updatedAt),
                    absentTimestamp: updatedPresent.absentTimestamp ? new Date(updatedPresent.absentTimestamp) : null
                };
                // No log is created when marking absent
                onUpdateStatus(newPresentRecord, logs);
                onStatusChange(employee.id);
                toast.success("Employee marked as absent");
            }
        } catch (error) {
            console.error("Error marking employee as absent:", error);
            toast.error("Failed to mark employee as absent");
        } finally {
            onLoadingChange(false);
        }
    };

    const handleReturn = async () => {
        if (!presentRecord) return;
        onLoadingChange(true);
        try {
            const result = await markEmployeeReturnFromAbsent(employee.id, presentRecord.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            if ('data' in result && result.data) {
                const { presentRecord: updatedPresent, log: newLog } = result.data;

                // Make sure newLog exists before using it
                if (!newLog) {
                    console.error("No log returned from markEmployeeReturnFromAbsent");
                    toast.error("Failed to mark employee return: No log data");
                    return;
                }

                // Update the present record with the new status
                const newPresentRecord = {
                    ...updatedPresent,
                    date: new Date(updatedPresent.date),
                    createdAt: new Date(updatedPresent.createdAt),
                    updatedAt: new Date(updatedPresent.updatedAt)
                };

                // Add the new log to the logs array with proper typing
                const newLogWithDates: AttendanceLog = {
                    id: newLog.id,
                    employeeId: newLog.employeeId,
                    employeePresentId: newLog.employeePresentId,
                    clockIn: newLog.clockIn ? new Date(newLog.clockIn) : null,
                    clockOut: newLog.clockOut ? new Date(newLog.clockOut) : null,
                    status: newLog.status,
                    notes: newLog.notes
                };

                const newLogs = [newLogWithDates, ...logs];

                onUpdateStatus(newPresentRecord, newLogs);
                onStatusChange(employee.id);
                toast.success("Employee marked as returned");
            }
        } catch (error) {
            console.error("Error marking employee return:", error);
            toast.error("Failed to mark employee return");
        } finally {
            onLoadingChange(false);
        }
    };

    return (
        <Card className="relative w-full">
            {lastLog && lastLog.status === 'clock-out' && !hasReturnedFromAbsence && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}

            {hasReturnedFromAbsence && (
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-red-500" />
            )}

            <CardContent className="pt-6">
                <div className="absolute right-4 top-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            side="bottom"
                            className="w-[160px]"
                            sideOffset={4}
                        >
                            <DropdownMenuItem onClick={() => setShowLogDrawer(true)}>
                                View Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowSalaryAdvanceDialog(true)}>
                                Salary Advance
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn(
                                "font-semibold text-base sm:text-lg truncate max-w-[180px] sm:max-w-none",
                                isOvertime && "text-red-500"
                            )}>
                                {employee.name}
                            </h3>
                            {presentRecord && presentRecord.status === 'present' ? (
                                <UserRoundCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                            ) : (
                                <UserRoundX className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                            )}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground h-5 truncate">
                            {presentRecord ? (
                                hasReturnedFromAbsence ?
                                    "Returned from absence - done for today" :
                                    `Present since ${format(presentRecord.createdAt, "h:mm a")}`
                            ) : (
                                "Not present"
                            )}
                        </div>
                        {lastLog?.status === 'clock-out' ? (
                            <div className="text-xs sm:text-sm font-mono text-red-500">
                                Clocked out for: {clockOutDuration}
                            </div>
                        ) : (
                            <div className={cn(
                                "text-xs sm:text-sm font-mono",
                                isOvertime && "text-red-500"
                            )}>
                                Total Duration: {`${Math.floor(Math.abs(totalMinutes) / 60).toString().padStart(2, '0')}:${(Math.abs(totalMinutes) % 60).toString().padStart(2, '0')}`}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handlePresent}
                                disabled={isLoading || !!presentRecord}
                                variant={presentRecord ? "secondary" : "default"}
                                className="rounded-full text-xs sm:text-sm h-8 sm:h-9"
                                size="sm"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        <span>Loading...</span>
                                    </div>
                                ) : presentRecord ? "Present" : "Mark Present"}
                            </Button>
                            {presentRecord?.status === 'present' && (!lastLog || lastLog.status !== 'clock-out') && (
                                <Button
                                    onClick={handleAbsent}
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-full text-xs sm:text-sm h-8 sm:h-9"
                                >
                                    Mark Absent
                                </Button>
                            )}
                            {presentRecord?.status === 'absent' && (
                                <Button
                                    onClick={handleReturn}
                                    variant="default"
                                    size="sm"
                                    className="rounded-full text-xs sm:text-sm h-8 sm:h-9"
                                >
                                    Mark Return
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            {presentRecord?.status === 'present' && (
                                <>
                                    {/* If employee is present and either has no logs OR last log is clock-in, show Clock Out button */}
                                    {showClockOutButton && (
                                        <Button
                                            onClick={handleClockOut}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full text-xs sm:text-sm h-8 sm:h-9"
                                        >
                                            Clock Out
                                        </Button>
                                    )}
                                    {/* If employee is present AND last log is clock-out, show Clock In button */}
                                    {showClockInButton && (
                                        <Button
                                            onClick={handleClockIn}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full text-xs sm:text-sm h-8 sm:h-9"
                                        >
                                            Clock In
                                        </Button>
                                    )}
                                </>
                            )}
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
                logs={logs}
                onUpdateLogs={handleUpdateLogs}
                onStatusChange={onStatusChange}
                registerStartTime={registerStartTime}
            />

            <EditEmployeeDialog
                employee={employee}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onEmployeeUpdate={() => onStatusChange(employee.id)}
            />

            <SalaryAdvanceDialog
                employee={employee}
                open={showSalaryAdvanceDialog}
                onOpenChange={setShowSalaryAdvanceDialog}
            />
        </Card>
    );
}