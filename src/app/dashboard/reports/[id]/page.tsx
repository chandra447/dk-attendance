'use client';

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Grid2x2, Loader2, ChevronRight, BanknoteIcon } from "lucide-react";
import { format } from "date-fns";
import { getAllEmployees, getAllSalaryAdvances, getEmployeeAttendanceLogs } from "@/app/actions/register";
import { DateRange } from "react-day-picker";
import { useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { formatMinutes } from "@/components/dashboard/utils/attendance-utils";
import { startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ReportsHeader } from "./components/reports-header";
import { SalaryAdvancesSection } from "./components/salary-advances-section";
import { AttendanceLogsSection } from "./components/attendance-logs-section";
import { ReportsProvider } from "./context/reports-context";

interface Employee {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    durationAllowed: number;
}

interface SalaryAdvance {
    id: number;
    amount: string;
    requestDate: Date;
    description: string | null;
    status: string;
    createdAt: Date;
}

interface AttendanceLog {
    id: number;
    employeeId: number;
    employeePresentId: number;
    clockIn: Date | null;
    clockOut: Date | null;
    status: string;
    notes: string | null;
    createdAt: Date;
}

interface DailyAttendance {
    date: Date;
    totalDuration: number;
    logs: AttendanceLog[];
}

export default function ReportsPage() {
    return (
        <ReportsProvider>
            <div className="space-y-6">
                <ReportsHeader />

                <Suspense
                    fallback={
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Loading salary advances...</p>
                            </CardContent>
                        </Card>
                    }
                >
                    <SalaryAdvancesSection />
                </Suspense>

                <Suspense
                    fallback={
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Loading attendance logs...</p>
                            </CardContent>
                        </Card>
                    }
                >
                    <AttendanceLogsSection />
                </Suspense>
            </div>
        </ReportsProvider>
    );
} 