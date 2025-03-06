import { format } from "date-fns";
import { useState } from "react";
import { Edit2, Save, X, Trash2 } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Employee, EmployeePresent, AttendanceLog } from "../types/attendance-types";
import { formatDuration, formatMinutes } from "../utils/attendance-utils";
import { Button } from "@/components/ui/button";
import { updateAttendanceLog, deleteAttendanceLog, markEmployeeAbsent, markEmployeeReturnFromAbsent } from "@/app/actions/register";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { differenceInMinutes } from "date-fns";
import { useRouter } from "next/navigation";

interface AttendanceLogDrawerProps {
    employee: Employee;
    date: Date;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    presentRecord: EmployeePresent | null;
    logs: AttendanceLog[];
    onUpdateLogs: (logs: AttendanceLog[]) => void;
    onStatusChange: (employeeId: number) => void;
    registerStartTime: Date | null;
}

export function AttendanceLogDrawer({
    employee,
    date,
    open,
    onOpenChange,
    presentRecord,
    logs,
    onUpdateLogs,
    onStatusChange,
    registerStartTime
}: AttendanceLogDrawerProps) {
    const [editingLogId, setEditingLogId] = useState<number | null>(null);
    const [logToDelete, setLogToDelete] = useState<AttendanceLog | null>(null);
    const [editingValues, setEditingValues] = useState<{
        clockIn: string;
        clockOut: string;
    }>({ clockIn: '', clockOut: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleEdit = (log: AttendanceLog) => {
        setEditingLogId(log.id);
        setEditingValues({
            clockIn: log.clockIn ? format(new Date(log.clockIn), "HH:mm") : '',
            clockOut: log.clockOut ? format(new Date(log.clockOut), "HH:mm") : ''
        });
    };

    const handleCancel = () => {
        setEditingLogId(null);
        setEditingValues({ clockIn: '', clockOut: '' });
    };

    const handleSave = async (log: AttendanceLog) => {
        setIsUpdating(true);
        try {
            // Convert time strings to Date objects
            const baseDate = new Date(date);
            let clockIn: Date | null = null;
            let clockOut: Date | null = null;

            if (editingValues.clockIn) {
                const [hours, minutes] = editingValues.clockIn.split(':').map(Number);
                clockIn = new Date(baseDate);
                clockIn.setHours(hours, minutes, 0, 0);
            }

            if (editingValues.clockOut) {
                const [hours, minutes] = editingValues.clockOut.split(':').map(Number);
                clockOut = new Date(baseDate);
                clockOut.setHours(hours, minutes, 0, 0);
            }

            const result = await updateAttendanceLog({
                id: log.id,
                clockIn,
                clockOut
            });

            if ('data' in result) {
                // Update the local state with the new log
                const updatedLogs = logs.map(l =>
                    l.id === log.id
                        ? { ...l, clockIn, clockOut }
                        : l
                );
                onUpdateLogs(updatedLogs);
                onStatusChange(employee.id);
            }
        } catch (error) {
            console.error('Error updating log:', error);
        } finally {
            setIsUpdating(false);
            setEditingLogId(null);
        }
    };

    const handleDelete = async (log: AttendanceLog) => {
        setIsDeleting(true);
        try {
            const result = await deleteAttendanceLog(log.id);
            if ('data' in result) {
                const updatedLogs = logs.filter(l => l.id !== log.id);
                onUpdateLogs(updatedLogs);
                onStatusChange(employee.id);
            }
        } catch (error) {
            console.error('Error deleting log:', error);
        } finally {
            setIsDeleting(false);
            setLogToDelete(null);
        }
    };

    const calculateTotalDuration = (logs: AttendanceLog[]) => {
        let totalMinutes = 0;

        logs.forEach(log => {
            if (log.clockOut) {
                const clockOutTime = new Date(log.clockOut);

                if (log.clockIn) {
                    // If both clock-in and clock-out exist, calculate normal duration
                    const clockInTime = new Date(log.clockIn);
                    const diffInMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
                    totalMinutes += diffInMinutes;
                } else {
                    // If only clock-out exists, calculate duration from clock-out to current time
                    const now = new Date();
                    const diffInMinutes = Math.floor((now.getTime() - clockOutTime.getTime()) / (1000 * 60));
                    totalMinutes += diffInMinutes;
                }
            }
        });

        return totalMinutes;
    };

    const calculateLateTime = () => {
        if (!registerStartTime || !presentRecord) return null;
        const lateMinutes = differenceInMinutes(
            new Date(presentRecord.createdAt),
            registerStartTime
        );
        return lateMinutes > 0 ? lateMinutes : null;
    };

    const lateMinutes = calculateLateTime();

    const totalMinutes = calculateTotalDuration(logs);
    const isOvertime = totalMinutes > employee.durationAllowed;
    const formattedDuration = `${Math.floor(Math.abs(totalMinutes) / 60).toString().padStart(2, '0')}:${(Math.abs(totalMinutes) % 60).toString().padStart(2, '0')}`;

    // Check if the employee can be marked as absent
    const canMarkAbsent = presentRecord?.status === 'present' && !logs.some(log => log.status === 'clock-out' && !log.clockIn);

    // Check if the employee can be marked as returned
    const canMarkReturn = presentRecord?.status === 'absent';

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[60vh]">
                <DrawerHeader className="pb-2">
                    <DrawerTitle className={cn(
                        isOvertime && "text-red-500"
                    )}>
                        Attendance Logs - {employee.name}
                    </DrawerTitle>
                    <DrawerDescription>
                        {format(date, 'EEEE, MMMM d, yyyy')}
                    </DrawerDescription>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        {presentRecord ? (
                            <div className="space-y-1">
                                <div>Present since {format(presentRecord.createdAt, "h:mm a")}</div>
                                {presentRecord.status === 'absent' && presentRecord.absentTimestamp && (
                                    <div>Absent at {format(new Date(presentRecord.absentTimestamp), "h:mm a")}</div>
                                )}
                                {lateMinutes && (
                                    <div className="text-red-500">
                                        Late by {Math.floor(lateMinutes / 60)}h {lateMinutes % 60}m
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span>Not marked present</span>
                        )}
                        <div className={cn(
                            "font-mono",
                            isOvertime && "text-red-500"
                        )}>
                            Total Duration: {formattedDuration}
                            <span className="ml-2">
                                (Allowed: {Math.floor(employee.durationAllowed / 60)}h {employee.durationAllowed % 60}m)
                            </span>
                            {isOvertime && (
                                <div className="text-red-500">
                                    {totalMinutes - employee.durationAllowed} minutes over limit
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerHeader>
                <div className="flex-1 flex items-start justify-center px-4">
                    <div className="w-full max-w-2xl">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">Clock-out Time</TableHead>
                                    <TableHead className="w-[120px]">Clock-in Time</TableHead>
                                    <TableHead className="w-[100px]">Duration</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No attendance records found for this date
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {editingLogId === log.id ? (
                                                    <Input
                                                        type="time"
                                                        value={editingValues.clockOut}
                                                        onChange={(e) => setEditingValues(prev => ({
                                                            ...prev,
                                                            clockOut: e.target.value
                                                        }))}
                                                        className="w-[100px]"
                                                    />
                                                ) : (
                                                    log.clockOut ? format(new Date(log.clockOut), "h:mm a") : "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingLogId === log.id ? (
                                                    <Input
                                                        type="time"
                                                        value={editingValues.clockIn}
                                                        onChange={(e) => setEditingValues(prev => ({
                                                            ...prev,
                                                            clockIn: e.target.value
                                                        }))}
                                                        className="w-[100px]"
                                                    />
                                                ) : (
                                                    log.clockIn ? format(new Date(log.clockIn), "h:mm a") : "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                {log.status === 'clock-out' && (
                                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                )}
                                                {formatDuration(log.clockIn, log.clockOut)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {editingLogId === log.id ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleSave(log)}
                                                                disabled={isUpdating}
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={handleCancel}
                                                                disabled={isUpdating}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(log)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setLogToDelete(log)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
            <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attendance Log</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this attendance log? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => logToDelete && handleDelete(logToDelete)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Duration</p>
                        <p className={cn("text-lg font-semibold", isOvertime && "text-red-500")}>
                            {formattedDuration}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Allowed: {formatMinutes(employee.durationAllowed)}
                        </p>
                    </div>
                </div>
            </div>
        </Drawer>
    );
} 