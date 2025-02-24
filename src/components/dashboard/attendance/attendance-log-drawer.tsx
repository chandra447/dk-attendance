import { format } from "date-fns";
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
import { Employee, EmployeePresent, AttendanceLog } from "../types/attendance-types";
import { formatDuration } from "../utils/attendance-utils";
import { Button } from "@/components/ui/button";

interface AttendanceLogDrawerProps {
    employee: Employee;
    date: Date;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    presentRecord: EmployeePresent | null;
    logs: AttendanceLog[];
}

export function AttendanceLogDrawer({
    employee,
    date,
    open,
    onOpenChange,
    presentRecord,
    logs
}: AttendanceLogDrawerProps) {
    const calculateTotalDuration = (logs: AttendanceLog[]) => {
        let totalMinutes = 0;

        logs.forEach(log => {
            if (log.clockIn && log.clockOut) {
                const clockInTime = new Date(log.clockIn);
                const clockOutTime = new Date(log.clockOut);
                const diffInMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
                totalMinutes += diffInMinutes;
            }
        });

        const hours = Math.floor(Math.abs(totalMinutes) / 60);
        const minutes = Math.abs(totalMinutes) % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[80vh]">
                <DrawerHeader className="pb-2">
                    <DrawerTitle>Attendance Logs - {employee.name}</DrawerTitle>
                    <DrawerDescription>
                        {format(date, 'EEEE, MMMM d, yyyy')}
                    </DrawerDescription>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        {presentRecord ? (
                            <span>Present since {format(presentRecord.createdAt, "h:mm a")}</span>
                        ) : (
                            <span>Not marked present</span>
                        )}
                        <div className="font-mono">
                            Total Duration: {calculateTotalDuration(logs)}
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
                                            <TableCell>
                                                {log.clockOut ? format(new Date(log.clockOut), "h:mm a") : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {log.clockIn ? format(new Date(log.clockIn), "h:mm a") : "-"}
                                            </TableCell>
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
                    </div>
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
} 