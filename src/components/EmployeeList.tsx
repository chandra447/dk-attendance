import { useState } from "react"
import type { Employee, Log } from "../mockData"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreVertical } from "lucide-react"
import { format, differenceInSeconds } from "date-fns"

interface EmployeeListProps {
  employees: Employee[]
  onPresent: (employeeId: number) => void
  onCheckIn: (employeeId: number) => void
  onCheckOut: (employeeId: number) => void
  onEdit: (employee: Employee) => void
  selectedDate: string
}

export function EmployeeList({ employees, onPresent, onCheckIn, onCheckOut, onEdit, selectedDate }: EmployeeListProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getTimeSinceCheckOut = (checkOutTime: string) => {
    const seconds = differenceInSeconds(new Date(), new Date(checkOutTime))
    return formatDuration(seconds)
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      {employees.map((employee) => (
        <Card key={employee.id} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{employee.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSelectedEmployee(employee)}>Log</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit(employee)}>Edit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{employee.position}</p>
            <p className="mt-2 text-sm font-semibold">
              Status: {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
            </p>
            {employee.status === "checked-out" && employee.checkOutTime && (
              <p className="mt-1 text-sm text-gray-600">
                Time since check-out: {getTimeSinceCheckOut(employee.checkOutTime)}
              </p>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              {employee.status === "absent" && (
                <Button onClick={() => onPresent(employee.id)} variant="outline">
                  Present
                </Button>
              )}
              {employee.status === "present" && (
                <Button onClick={() => onCheckOut(employee.id)} variant="outline">
                  Check Out
                </Button>
              )}
              {employee.status === "checked-out" && (
                <Button onClick={() => onCheckIn(employee.id)} variant="outline">
                  Check In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      <Drawer open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedEmployee?.name} - Attendance Log</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEmployee?.logs
                  .filter((log: Log) => log.date === selectedDate)
                  .map((log: Log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.date), "PP")}</TableCell>
                      <TableCell>{log.checkOutTime ? format(new Date(log.checkOutTime), "p") : "-"}</TableCell>
                      <TableCell>{log.checkInTime ? format(new Date(log.checkInTime), "p") : "-"}</TableCell>
                      <TableCell>{log.duration || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

