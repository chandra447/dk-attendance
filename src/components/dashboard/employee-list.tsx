import { useEffect, useState } from "react";
import { UserPlus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRegisterEmployees, getEmployeeAttendanceLogs } from "@/app/actions/register";
import { CreateEmployeeDialog } from "@/components/dashboard/create-employee-dialog";
import { EmployeeCard } from "./attendance/employee-card";
import { Employee, EmployeeListProps, AttendanceLog } from "./types/attendance-types";

export function EmployeeList({ registerId, registerName }: EmployeeListProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<Date>(new Date());

    const fetchEmployeesAndLogs = async () => {
        if (!registerId) return;

        try {
            setIsLoading(true);
            const employeeResult = await getRegisterEmployees(parseInt(registerId));
            if ('data' in employeeResult) {
                setEmployees(employeeResult.data as Employee[]);
            }

            const logResult = await getEmployeeAttendanceLogs(parseInt(registerId), date);
            if ('data' in logResult && logResult.data) {
                setLogs(logResult.data.map(log => ({
                    ...log,
                    clockIn: log.clockIn ? new Date(log.clockIn) : null,
                    clockOut: log.clockOut ? new Date(log.clockOut) : null
                })));
            }
        } catch (error) {
            console.error('Error fetching employees or logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeesAndLogs();
    }, [registerId, date]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <span className="text-muted-foreground">Loading employees...</span>
            </div>
        );
    }

    if (!employees.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-4">
                <div className="flex flex-col items-center gap-2 text-center">
                    <UserPlus className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No Employees</h3>
                    <p className="text-sm text-muted-foreground">
                        Get started by adding employees to {registerName}
                    </p>
                </div>
                <CreateEmployeeDialog registerId={registerId} registerName={registerName} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold truncate">{registerName}</h2>
                    <p className="text-muted-foreground">
                        {employees.length} employees in this register
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 justify-end">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-auto justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(date) => date && setDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <CreateEmployeeDialog registerId={registerId} registerName={registerName} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                    <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        date={date}
                        onStatusChange={() => {
                            fetchEmployeesAndLogs();
                        }}
                    />
                ))}
            </div>
        </div>
    );
}