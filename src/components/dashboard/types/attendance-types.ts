export interface Employee {
    id: number;
    name: string;
    position: string;
    department: string;
    baseSalary: string;
    passcode?: string | null;
    startTime: string;
    endTime: string;
}

export interface EmployeeListProps {
    registerId: string;
    registerName: string;
}

export interface EmployeePresent {
    id: number;
    employeeId: number;
    date: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AttendanceLog {
    id: number;
    employeeId: number;
    employeePresentId: number;
    clockIn: Date | null;
    clockOut: Date | null;
    status: string;
    notes: string | null;
} 