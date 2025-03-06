export interface Log {
  id: number
  employeeName: string
  date: string
  checkInTime: string
  checkOutTime: string
  duration: string
}

export interface Employee {
  id: number
  name: string
  position: string
  email: string
  phone: string
  status: "absent" | "present" | "checked-out"
  checkOutTime?: string
  logs: Log[]
}

export interface Register {
  id: number
  name: string
  employees: Employee[]
}

export const mockRegisters: Register[] = [
  {
    id: 1,
    name: "IT Department",
    employees: [
      {
        id: 1,
        name: "John Doe",
        position: "Software Developer",
        email: "john.doe@example.com",
        phone: "123-456-7890",
        status: "absent",
        logs: [
          {
            id: 1,
            employeeName: "John Doe",
            date: "2023-05-09",
            checkInTime: "2023-05-09T09:00:00",
            checkOutTime: "2023-05-09T17:00:00",
            duration: "8h 0m",
          },
          {
            id: 2,
            employeeName: "John Doe",
            date: "2023-05-10",
            checkInTime: "2023-05-10T08:30:00",
            checkOutTime: "2023-05-10T16:30:00",
            duration: "8h 0m",
          },
        ],
      },
      {
        id: 2,
        name: "Jane Smith",
        position: "UX Designer",
        email: "jane.smith@example.com",
        phone: "098-765-4321",
        status: "present",
        logs: [
          {
            id: 3,
            employeeName: "Jane Smith",
            date: "2023-05-09",
            checkInTime: "2023-05-09T08:45:00",
            checkOutTime: "2023-05-09T17:15:00",
            duration: "8h 30m",
          },
          {
            id: 4,
            employeeName: "Jane Smith",
            date: "2023-05-10",
            checkInTime: "2023-05-10T09:00:00",
            checkOutTime: "",
            duration: "",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Marketing Department",
    employees: [
      {
        id: 4,
        name: "Emily Brown",
        position: "Marketing Specialist",
        email: "emily.brown@example.com",
        phone: "555-123-4567",
        status: "absent",
        logs: [],
      },
      {
        id: 5,
        name: "David Wilson",
        position: "Content Writer",
        email: "david.wilson@example.com",
        phone: "555-987-6543",
        status: "checked-out",
        checkOutTime: "2023-05-10T17:00:00",
        logs: [
          {
            id: 5,
            employeeName: "David Wilson",
            date: "2023-05-10",
            checkInTime: "2023-05-10T09:00:00",
            checkOutTime: "2023-05-10T17:00:00",
            duration: "8h 0m",
          },
        ],
      },
      {
        id: 6,
        name: "Sarah Davis",
        position: "Social Media Manager",
        email: "sarah.davis@example.com",
        phone: "555-555-5555",
        status: "present",
        logs: [],
      },
    ],
  },
]

