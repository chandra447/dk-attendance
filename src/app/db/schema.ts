import { pgTable, serial, varchar, timestamp, integer, decimal, date, text, primaryKey, uniqueIndex, time } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const registers = pgTable("registers", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    date: timestamp("date").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    position: varchar("position", { length: 255 }).notNull(),
    department: varchar("department", { length: 255 }),
    baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    durationAllowed: integer("duration_allowed").notNull().default(120), // 2 hours in minutes
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    passcode: varchar("passcode", { length: 5 })
});

export const registerEmployees = pgTable("register_employees", {
    id: serial("id").primaryKey(),
    registerId: integer("register_id").references(() => registers.id).notNull(),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    uniqueRegisterEmployee: uniqueIndex('unique_register_employee').on(table.registerId, table.employeeId),
}));

export const registerLogs = pgTable("register_logs", {
    id: serial("id").primaryKey(),
    registerId: integer("register_id").references(() => registers.id).notNull(),
    date: date("date").notNull(),
    startTime: timestamp("start_time").notNull(),
    status: varchar("status", { length: 50 }).notNull().default('active'),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceLogger = pgTable("attendance_logger", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    employeePresentId: integer("employee_present_id").references(() => employeePresent.id).notNull(),
    clockIn: timestamp("clock_in"),
    clockOut: timestamp("clock_out").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salaryAdvances = pgTable("salary_advances", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    requestDate: date("request_date").notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeePresent = pgTable("employee_present", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    date: date("date").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    absentTimestamp: timestamp("absent_timestamp"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    registers: many(registers),
}));

export const registersRelations = relations(registers, ({ one, many }) => ({
    user: one(users, {
        fields: [registers.userId],
        references: [users.id],
    }),
    registerEmployees: many(registerEmployees),
    registerLogs: many(registerLogs),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
    registerEmployees: many(registerEmployees),
    registerLogs: many(registerLogs),
    attendanceLogs: many(attendanceLogger),
    salaryAdvances: many(salaryAdvances),
    employeePresents: many(employeePresent),
}));

export const registerEmployeesRelations = relations(registerEmployees, ({ one }) => ({
    register: one(registers, {
        fields: [registerEmployees.registerId],
        references: [registers.id],
    }),
    employee: one(employees, {
        fields: [registerEmployees.employeeId],
        references: [employees.id],
    }),
}));

export const registerLogsRelations = relations(registerLogs, ({ one }) => ({
    register: one(registers, {
        fields: [registerLogs.registerId],
        references: [registers.id],
    }),
}));

export const employeePresentRelations = relations(employeePresent, ({ one, many }) => ({
    employee: one(employees, {
        fields: [employeePresent.employeeId],
        references: [employees.id],
    }),
    attendanceLogs: many(attendanceLogger),
}));