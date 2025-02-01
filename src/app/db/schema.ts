import { pgTable, serial, varchar, timestamp, integer, decimal, date, text, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
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
    department: varchar("department", { length: 255 }).notNull(),
    baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
    registerEmployeeId: integer("register_employee_id").references(() => registerEmployees.id).notNull(),
    logTime: timestamp("log_time").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceLogger = pgTable("attendance_logger", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id).notNull(),
    clockIn: timestamp("clock_in").notNull(),
    clockOut: timestamp("clock_out"),
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
    registerEmployee: one(registerEmployees, {
        fields: [registerLogs.registerEmployeeId],
        references: [registerEmployees.id],
    }),
}));