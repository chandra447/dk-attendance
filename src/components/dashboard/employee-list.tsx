import { useEffect, useState } from "react";
import { UserPlus, Calendar as CalendarIcon, Search, UserCheck, UserX, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRegisterEmployees, getEmployeeAttendanceLogs, checkEmployeePresent, getRegisterStartTime, getEmployeeAttendanceLogsInBulk, checkEmployeePresentInBulk } from "@/app/actions/register";
import { CreateEmployeeDialog } from "@/components/dashboard/create-employee-dialog";
import { EmployeeCard } from "./attendance/employee-card";
import { Employee, EmployeeListProps, AttendanceLog, EmployeePresent } from "./types/attendance-types";
import { RegisterStartTime } from "./register-start-time";

type TabType = 'all' | 'present' | 'absent' | 'clockedOut';

export function EmployeeList({ registerId, registerName }: EmployeeListProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [employeeLogs, setEmployeeLogs] = useState<Record<number, AttendanceLog[]>>({});
    const [employeePresentRecords, setEmployeePresentRecords] = useState<Record<number, EmployeePresent | null>>({});
    const [loadingEmployeeIds, setLoadingEmployeeIds] = useState<Set<number>>(new Set());
    const [date, setDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [registerStartTime, setRegisterStartTime] = useState<Date | null>(null);

    const fetchRegisterStartTime = async () => {
        console.log('Fetching register start time...');
        const result = await getRegisterStartTime(parseInt(registerId), date);
        console.log('Register start time result:', result);
        if ('data' in result && result.data) {
            setRegisterStartTime(new Date(result.data.startTime));
        } else {
            setRegisterStartTime(null);
        }
    };

    const handleStartTimeSet = () => {
        fetchRegisterStartTime();
    };

    const fetchEmployeesAndLogs = async () => {
        console.log('Fetching employees and logs...');
        console.log('Register ID:', registerId);

        try {
            setIsLoading(true);
            //get the list of all the employees belong to the register
            const employeeResult = await getRegisterEmployees(parseInt(registerId));
            console.log('Employee result:', employeeResult);

            if ('data' in employeeResult) {
                const fetchedEmployees = employeeResult.data as Employee[];
                setEmployees(fetchedEmployees);

                if (fetchedEmployees.length > 0) {
                    const employeeIds = fetchedEmployees.map(emp => emp.id);

                    // Fetch logs and present records in bulk
                    const [logsResult, presentResult] = await Promise.all([
                        getEmployeeAttendanceLogsInBulk(employeeIds, date),
                        checkEmployeePresentInBulk(employeeIds, date)
                    ]);

                    if ('data' in logsResult && 'data' in presentResult) {
                        const newLogs: Record<number, AttendanceLog[]> = {};
                        const newPresentRecords: Record<number, EmployeePresent | null> = {};

                        // Process logs
                        if (logsResult.data) {
                            Object.entries(logsResult.data).forEach(([employeeId, logs]) => {
                                newLogs[parseInt(employeeId)] = logs.map(log => ({
                                    ...log,
                                    clockIn: log.clockIn ? new Date(log.clockIn) : null,
                                    clockOut: log.clockOut ? new Date(log.clockOut) : null
                                }));
                            });
                        }

                        // Process present records
                        if (presentResult.data) {
                            Object.entries(presentResult.data).forEach(([employeeId, record]) => {
                                if (record) {
                                    newPresentRecords[parseInt(employeeId)] = {
                                        ...record,
                                        date: new Date(record.date),
                                        createdAt: new Date(record.createdAt),
                                        updatedAt: new Date(record.updatedAt)
                                    };
                                } else {
                                    newPresentRecords[parseInt(employeeId)] = null;
                                }
                            });
                        }

                        // Initialize empty arrays for employees with no logs
                        fetchedEmployees.forEach(emp => {
                            if (!newLogs[emp.id]) {
                                newLogs[emp.id] = [];
                            }
                            if (!newPresentRecords.hasOwnProperty(emp.id)) {
                                newPresentRecords[emp.id] = null;
                            }
                        });

                        setEmployeeLogs(newLogs);
                        setEmployeePresentRecords(newPresentRecords);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching employees or logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmployeeUpdate = async (employeeId?: number) => {
        if (!employeeId) {
            // If no employeeId provided, fetch all employees (used for initial load and create/delete)
            fetchEmployeesAndLogs();
            return;
        }

        try {
            // Fetch logs and present records only for this employee
            const [logsResult, presentResult] = await Promise.all([
                getEmployeeAttendanceLogsInBulk([employeeId], date),
                checkEmployeePresentInBulk([employeeId], date)
            ]);

            if ('data' in logsResult && 'data' in presentResult) {
                // Update logs for this employee
                if (logsResult.data && logsResult.data[employeeId]) {
                    setEmployeeLogs(prev => ({
                        ...prev,
                        [employeeId]: logsResult.data[employeeId].map(log => ({
                            ...log,
                            clockIn: log.clockIn ? new Date(log.clockIn) : null,
                            clockOut: log.clockOut ? new Date(log.clockOut) : null
                        }))
                    }));
                }

                // Update present record for this employee
                if (presentResult.data) {
                    const record = presentResult.data[employeeId];
                    setEmployeePresentRecords(prev => ({
                        ...prev,
                        [employeeId]: record ? {
                            ...record,
                            date: new Date(record.date),
                            createdAt: new Date(record.createdAt),
                            updatedAt: new Date(record.updatedAt)
                        } : null
                    }));
                }
            }
        } catch (error) {
            console.error('Error updating employee data:', error);
        }
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
        console.log('Effect triggered. Register ID:', registerId);
        if (registerId) {
            fetchEmployeesAndLogs();
            fetchRegisterStartTime();
        }
    }, [registerId, date]);

    useEffect(() => {
        console.log('Register start time updated:', registerStartTime);
    }, [registerStartTime]);

    // Calculate counts for each status
    const getCounts = () => {
        const presentCount = Object.values(employeePresentRecords).filter(record => record !== null && record.status === 'present').length;
        const absentCount = Object.values(employeePresentRecords).filter(record => record === null || (record !== null && record.status !== 'present')).length;

        const clockedOutCount = Object.values(employeeLogs).filter(logs =>
            logs.length > 0 && logs[0].status === 'clock-out'
        ).length;

        return {
            present: presentCount,
            absent: absentCount,
            clockedOut: clockedOutCount
        };
    };

    // Filter employees based on active tab and search query
    const filterEmployees = () => {
        let filtered = employees;

        // First apply status filter
        if (activeTab !== 'all') {
            filtered = employees.filter(employee => {
                const presentRecord = employeePresentRecords[employee.id];
                const logs = employeeLogs[employee.id] || [];
                const lastLog = logs[0];

                switch (activeTab) {
                    case 'present':
                        return presentRecord !== null && presentRecord.status === 'present';
                    case 'absent':
                        return presentRecord !== null && presentRecord.status === 'absent';
                    case 'clockedOut':
                        return lastLog && lastLog.status === 'clock-out';
                    default:
                        return true;
                }
            });
        }

        // Then apply search filter
        if (searchQuery) {
            filtered = filtered.filter(employee =>
                employee.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredEmployees(filtered);
    };

    // Update filtered employees whenever relevant state changes
    useEffect(() => {
        filterEmployees();
    }, [employees, searchQuery, activeTab, employeeLogs, employeePresentRecords]);

    const handlePresent = async () => {
        if (!registerStartTime) {
            alert("Please set the register start time first");
            return;
        }
        // ... rest of the function ...
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-muted-foreground">Loading employees and attendance data...</span>
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

    const counts = getCounts();

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold truncate">{registerName}</h2>
                    <p className="text-muted-foreground">
                        {filteredEmployees.length} of {employees.length} employees
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    {/* Status Tabs */}
                    <div className="flex gap-2 border-b">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                                activeTab === 'all' ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('present')}
                            className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                                activeTab === 'present' ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                            )}
                        >
                            Present {counts.present > 0 && `(${counts.present})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('absent')}
                            className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                                activeTab === 'absent' ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                            )}
                        >
                            Absent {counts.absent > 0 && `(${counts.absent})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('clockedOut')}
                            className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                                activeTab === 'clockedOut' ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                            )}
                        >
                            Clocked Out {counts.clockedOut > 0 && `(${counts.clockedOut})`}
                        </button>
                    </div>

                    {/* Search and Calendar Controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                            <div className="relative w-full sm:w-[300px]">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search employees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="w-full sm:w-[250px]">
                                <RegisterStartTime
                                    registerId={registerId}
                                    date={date}
                                    onStartTimeSet={handleStartTimeSet}
                                />
                            </div>
                        </div>
                        <div className="flex flex-row items-center gap-4 sm:ml-auto">
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
                </div>
            </div>

            {!registerStartTime ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-24rem)] gap-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Set Register Start Time</h3>
                        <p className="text-sm text-muted-foreground">
                            Please set the register start time to begin marking attendance
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee) => (
                            <div key={employee.id} className="w-full">
                                <EmployeeCard
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
                                    registerStartTime={registerStartTime}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-24rem)] gap-4">
                            <div className="flex flex-col items-center gap-2 text-center">
                                {activeTab === 'present' && (
                                    <>
                                        <UserCheck className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold">No Present Employees</h3>
                                        <p className="text-sm text-muted-foreground">
                                            No employees have been marked as present today
                                        </p>
                                    </>
                                )}
                                {activeTab === 'absent' && (
                                    <>
                                        <UserX className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold">No Absent Employees</h3>
                                        <p className="text-sm text-muted-foreground">
                                            All employees have been marked as present
                                        </p>
                                    </>
                                )}
                                {activeTab === 'clockedOut' && (
                                    <>
                                        <LogOut className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold">No Clocked Out Employees</h3>
                                        <p className="text-sm text-muted-foreground">
                                            No employees are currently clocked out
                                        </p>
                                    </>
                                )}
                                {activeTab === 'all' && searchQuery && (
                                    <>
                                        <Search className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold">No Results Found</h3>
                                        <p className="text-sm text-muted-foreground">
                                            No employees match your search criteria
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}