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
import { getRegisterEmployees, getEmployeeAttendanceLogs, checkEmployeePresent } from "@/app/actions/register";
import { CreateEmployeeDialog } from "@/components/dashboard/create-employee-dialog";
import { EmployeeCard } from "./attendance/employee-card";
import { Employee, EmployeeListProps, AttendanceLog, EmployeePresent } from "./types/attendance-types";

export function EmployeeList({ registerId, registerName }: EmployeeListProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeLogs, setEmployeeLogs] = useState<Record<number, AttendanceLog[]>>({});
    const [employeePresentRecords, setEmployeePresentRecords] = useState<Record<number, EmployeePresent | null>>({});
    const [loadingEmployeeIds, setLoadingEmployeeIds] = useState<Set<number>>(new Set());
    const [date, setDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmployeesAndLogs = async () => {
        if (!registerId) return;

        try {
            setIsLoading(true);
            //get the list of all the employees belong to the register
            const employeeResult = await getRegisterEmployees(parseInt(registerId));

            if ('data' in employeeResult) {
                const fetchedEmployees = employeeResult.data as Employee[];
                setEmployees(fetchedEmployees);

                // Fetch logs and present records for each employee
                const logsPromises = fetchedEmployees.map(async (employee) => {


                    const [presentResult, logsResult] = await Promise.all([
                        checkEmployeePresent(employee.id, date),
                        getEmployeeAttendanceLogs(employee.id, date)
                    ]);


                    return {
                        employeeId: employee.id,
                        presentRecord: 'data' in presentResult ? presentResult.data : null,
                        logs: 'data' in logsResult ? logsResult.data : []
                    };
                });

                const results = await Promise.all(logsPromises);
                console.log('All results from Promise.all:', results);

                const newLogs: Record<number, AttendanceLog[]> = {};
                const newPresentRecords: Record<number, EmployeePresent | null> = {};

                results.forEach(({ employeeId, presentRecord, logs = [] }) => {
                    console.log(`Processing logs for employee ${employeeId}:`, logs);

                    newLogs[employeeId] = logs.map(log => {
                        console.log('Processing log:', log);
                        return {
                            ...log,
                            clockIn: log.clockIn ? new Date(log.clockIn) : null,
                            clockOut: log.clockOut ? new Date(log.clockOut) : null
                        };
                    });

                    if (presentRecord) {
                        console.log(`Processing present record for employee ${employeeId}:`, presentRecord);
                        newPresentRecords[employeeId] = {
                            ...presentRecord,
                            date: new Date(presentRecord.date),
                            createdAt: new Date(presentRecord.createdAt),
                            updatedAt: new Date(presentRecord.updatedAt)
                        };
                    } else {
                        newPresentRecords[employeeId] = null;
                    }
                });

                console.log('Final processed logs:', newLogs);
                console.log('Final processed present records:', newPresentRecords);

                setEmployeeLogs(newLogs);
                setEmployeePresentRecords(newPresentRecords);
            }
        } catch (error) {
            console.error('Error fetching employees or logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmployeeUpdate = () => {
        fetchEmployeesAndLogs();
    };

    const updateEmployeeStatus = (employeeId: number, presentRecord: EmployeePresent | null, logs: AttendanceLog[]) => {
        console.log(`Updating status for employee ${employeeId}:`);
        console.log('Present Record:', presentRecord);
        console.log('Updated Logs:', logs);

        setEmployeePresentRecords(prev => ({
            ...prev,
            [employeeId]: presentRecord && {
                ...presentRecord,
                date: new Date(presentRecord.date),
                createdAt: new Date(presentRecord.createdAt),
                updatedAt: new Date(presentRecord.updatedAt)
            }
        }));
        setEmployeeLogs(prev => ({
            ...prev,
            [employeeId]: logs.map(log => ({
                ...log,
                clockIn: log.clockIn ? new Date(log.clockIn) : null,
                clockOut: log.clockOut ? new Date(log.clockOut) : null
            }))
        }));
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
                <CreateEmployeeDialog
                    registerId={registerId}
                    registerName={registerName}
                    onEmployeeUpdate={handleEmployeeUpdate}
                />
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
                    <CreateEmployeeDialog
                        registerId={registerId}
                        registerName={registerName}
                        onEmployeeUpdate={handleEmployeeUpdate}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                    <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        date={date}
                        isLoading={loadingEmployeeIds.has(employee.id)}
                        presentRecord={employeePresentRecords[employee.id]}
                        logs={employeeLogs[employee.id] || []}
                        onStatusChange={handleEmployeeUpdate}
                        onLoadingChange={(isLoading) => {
                            setLoadingEmployeeIds(prev => {
                                const newSet = new Set(prev);
                                if (isLoading) {
                                    newSet.add(employee.id);
                                } else {
                                    newSet.delete(employee.id);
                                }
                                return newSet;
                            });
                        }}
                        onUpdateStatus={(presentRecord, logs) => {
                            updateEmployeeStatus(employee.id, presentRecord, logs);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}