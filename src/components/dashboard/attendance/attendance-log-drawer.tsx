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
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Attendance Logs - {employee.name}</DrawerTitle>
                    <DrawerDescription>
                        {format(date, 'EEEE, MMMM d, yyyy')}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4">
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center justify-between border-b pb-2"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {log.status === 'clock-in' ? 'Clocked In' : 'Clocked Out'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {log.status === 'clock-in' && log.clockIn
                                            ? format(new Date(log.clockIn), 'h:mm a')
                                            : log.status === 'clock-out' && log.clockOut
                                                ? format(new Date(log.clockOut), 'h:mm a')
                                                : '-'}
                                    </p>
                                </div>
                                <div className={`px-2 py-1 text-xs rounded ${log.status === 'clock-in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {log.status === 'clock-in' ? 'IN' : 'OUT'}
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <p className="text-center text-sm text-gray-500">
                                No attendance logs for today
                            </p>
                        )}
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