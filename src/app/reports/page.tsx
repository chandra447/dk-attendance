"use client"

import { useState, useMemo } from "react"
import { mockRegisters, type Register, type Log } from "../../mockData"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, isWithinInterval, parseISO, differenceInSeconds } from "date-fns"
import Link from "next/link"

export default function ReportsPage() {
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const handleRegisterChange = (registerId: string) => {
    const register = mockRegisters.find((r) => r.id === Number.parseInt(registerId))
    setSelectedRegister(register || null)
  }

  const aggregatedLogs = useMemo(() => {
    if (!selectedRegister || !dateRange) return []

    const logs = selectedRegister.employees.flatMap((employee) => employee.logs)
    const aggregated: { [date: string]: number } = {}

    logs.forEach((log) => {
      const logDate = parseISO(log.date)
      if (isWithinInterval(logDate, { start: dateRange.from, end: dateRange.to })) {
        const duration =
          log.checkInTime && log.checkOutTime
            ? differenceInSeconds(parseISO(log.checkOutTime), parseISO(log.checkInTime))
            : 0
        const dateKey = format(logDate, "yyyy-MM-dd")
        aggregated[dateKey] = (aggregated[dateKey] || 0) + duration
      }
    })

    return Object.entries(aggregated).map(([date, totalSeconds]) => ({
      date,
      totalHours: (totalSeconds / 3600).toFixed(2),
    }))
  }, [selectedRegister, dateRange])

  const selectedDateLogs = useMemo(() => {
    if (!selectedRegister || !selectedDate) return []

    return selectedRegister.employees.flatMap((employee) => employee.logs.filter((log) => log.date === selectedDate))
  }, [selectedRegister, selectedDate])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" passHref>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Back</span>
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Attendance Reports</h1>
              <ChevronRight className="h-5 w-5" />
              <Select onValueChange={handleRegisterChange}>
                <SelectTrigger className="w-[200px] bg-primary-foreground text-primary">
                  <SelectValue placeholder="Select a register" />
                </SelectTrigger>
                <SelectContent>
                  {mockRegisters.map((register) => (
                    <SelectItem key={register.id} value={register.id.toString()}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-[300px] justify-start text-left font-normal ${!dateRange && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
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

        {selectedRegister && dateRange && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedLogs.map(({ date, totalHours }) => (
                <TableRow key={date} onClick={() => setSelectedDate(date)} className="cursor-pointer hover:bg-muted">
                  <TableCell>{format(parseISO(date), "PP")}</TableCell>
                  <TableCell>{totalHours}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Drawer open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Logs for {selectedDate && format(parseISO(selectedDate), "PP")}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Check-out Time</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDateLogs.map((log: Log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.employeeName}</TableCell>
                      <TableCell>{log.checkInTime ? format(parseISO(log.checkInTime), "p") : "-"}</TableCell>
                      <TableCell>{log.checkOutTime ? format(parseISO(log.checkOutTime), "p") : "-"}</TableCell>
                      <TableCell>{log.duration || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  )
}

