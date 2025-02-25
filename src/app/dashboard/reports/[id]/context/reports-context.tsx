'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { getAllEmployees } from '@/app/actions/register';
import { useParams } from 'next/navigation';

interface Employee {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    durationAllowed: number;
}

interface ReportsContextType {
    employees: Employee[];
    isLoading: boolean;
    selectedEmployee: Employee | null;
    setSelectedEmployee: (employee: Employee | null) => void;
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
    const params = useParams();
    const registerId = params.id as string;
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    useEffect(() => {
        if (registerId) {
            loadEmployees();
        }
    }, [registerId]);

    const loadEmployees = async () => {
        if (!registerId) return;
        setIsLoading(true);
        try {
            const result = await getAllEmployees(parseInt(registerId));
            if ('data' in result && result.data) {
                const validEmployees = result.data.filter(
                    (employee): employee is Employee =>
                        employee.name !== null && typeof employee.name === 'string'
                );
                setEmployees(validEmployees);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ReportsContext.Provider value={{
            employees,
            isLoading,
            selectedEmployee,
            setSelectedEmployee,
            dateRange,
            setDateRange,
        }}>
            {children}
        </ReportsContext.Provider>
    );
}

export function useReports() {
    const context = useContext(ReportsContext);
    if (context === undefined) {
        throw new Error('useReports must be used within a ReportsProvider');
    }
    return context;
} 