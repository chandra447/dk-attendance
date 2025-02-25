'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useReports } from "../context/reports-context";

export function ReportsHeader() {
    const {
        employees,
        isLoading,
        selectedEmployee,
        setSelectedEmployee,
        dateRange,
        setDateRange
    } = useReports();

    return (
        <div className="flex items-center gap-4">
            <Select
                value={selectedEmployee?.id.toString()}
                onValueChange={(value) => {
                    const employee = employees.find(emp => emp.id.toString() === value);
                    setSelectedEmployee(employee || null);
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select Employee"} />
                </SelectTrigger>
                <SelectContent>
                    {employees.map((employee) => (
                        <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                        >
                            {employee.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={`w-[300px] justify-start text-left font-normal
                            ${!dateRange && "text-muted-foreground"}`}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
} 