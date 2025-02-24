'use server';

import { findUserByEmail, createUser, findRegistersByUserId, createNewRegister } from '@/app/db';
import { revalidatePath } from 'next/cache';
import { db } from '@/app/db/config';
import { employees, registerEmployees, registers, attendanceLogger, employeePresent, salaryAdvances } from "@/app/db/schema";
import { eq, and, desc, gte, lte, sql, or, inArray } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

interface SyncUserParams {
    stackAuthUserId: string;
    email: string;
    name: string;
}

export async function syncUser({ stackAuthUserId, email, name }: SyncUserParams) {
    try {
        // First try to find the user
        const existingUser = await findUserByEmail(email);

        if (!existingUser) {
            // Create new user if doesn't exist
            const newUser = await createUser({
                email,
                name,
                password: `stack-auth-${stackAuthUserId}`, // Use Stack Auth ID as part of the password
            });
            return newUser;
        }

        return existingUser;
    } catch (error) {
        console.error('Error syncing user:', error);
        throw error;
    }
}

export async function getRegistersByUserId(userId: number) {
    try {
        return await findRegistersByUserId(userId);
    } catch (error) {
        console.error('Error getting registers:', error);
        throw error;
    }
}

export async function createRegister(userId: number, description?: string) {
    try {
        const newRegister = await createNewRegister({ userId, description });
        revalidatePath('/dashboard');
        return newRegister;
    } catch (error) {
        console.error('Error creating register:', error);
        throw error;
    }
}

export async function getRegisterEmployees(registerId: number) {
    try {
        const result = await db
            .select({
                id: employees.id,
                name: employees.name,
                position: employees.position,
                department: employees.department,
                baseSalary: employees.baseSalary,
            })
            .from(registerEmployees)
            .innerJoin(employees, eq(registerEmployees.employeeId, employees.id))
            .where(eq(registerEmployees.registerId, registerId));

        return { data: result };
    } catch (error) {
        console.error("Error fetching register employees:", error);
        return { error: "Failed to fetch register employees" };
    }
}

export async function createEmployee(data: {
    name: string;
    position: string;
    department: string;
    baseSalary: number;
    registerId: number;
    passcode?: string;
    startTime: string;
    endTime: string;
}) {
    try {
        // First create the employee
        const [newEmployee] = await db.insert(employees).values({
            name: data.name,
            position: data.position,
            department: data.department,
            baseSalary: data.baseSalary.toString(), // Convert to string for database
            passcode: data.position === 'supervisor' ? data.passcode : null,
            startTime: data.startTime,
            endTime: data.endTime,
        }).returning();

        // Then create the register-employee association
        await db.insert(registerEmployees).values({
            registerId: data.registerId,
            employeeId: newEmployee.id,
        });

        revalidatePath('/dashboard');
        return { data: newEmployee };
    } catch (error) {
        console.error("Error creating employee:", error);
        return { error: "Failed to create employee" };
    }
}

export async function updateEmployee(data: {
    id: number;
    name: string;
    position: string;
    department: string;
    baseSalary: number;
    passcode?: string;
    startTime: string;
    endTime: string;
}) {
    try {
        const [updated] = await db
            .update(employees)
            .set({
                name: data.name,
                position: data.position,
                department: data.department,
                baseSalary: data.baseSalary.toString(),
                updatedAt: new Date(),
                passcode: data.position === 'supervisor' ? data.passcode : null,
                startTime: data.startTime,
                endTime: data.endTime,
            })
            .where(eq(employees.id, data.id))
            .returning();

        revalidatePath('/dashboard');
        return { data: updated };
    } catch (error) {
        console.error("Error updating employee:", error);
        return { error: "Failed to update employee" };
    }
}

export async function updateEmployeeStatus(employeeId: number, status: string) {
    try {
        const [updated] = await db
            .update(employees)
            .set({ status })
            .where(eq(employees.id, employeeId))
            .returning();

        revalidatePath('/dashboard');
        return { data: updated };
    } catch (error) {
        console.error("Error updating employee status:", error);
        return { error: "Failed to update employee status" };
    }
}

export async function getEmployeeAttendanceLogs(employeeId: number, date: Date) {
    try {
        const startTime = startOfDay(date);
        const endTime = endOfDay(date);


        const result = await db
            .select({
                id: attendanceLogger.id,
                employeeId: attendanceLogger.employeeId,
                employeePresentId: attendanceLogger.employeePresentId,
                clockIn: attendanceLogger.clockIn,
                clockOut: attendanceLogger.clockOut,
                status: attendanceLogger.status,
                notes: attendanceLogger.notes,
                createdAt: attendanceLogger.createdAt,
            })
            .from(attendanceLogger)
            .where(
                and(
                    eq(attendanceLogger.employeeId, employeeId),
                    or(
                        and(
                            gte(attendanceLogger.clockIn, sql`${startTime}`),
                            lte(attendanceLogger.clockIn, sql`${endTime}`)
                        ),
                        and(
                            gte(attendanceLogger.clockOut, sql`${startTime}`),
                            lte(attendanceLogger.clockOut, sql`${endTime}`)
                        )
                    )
                )
            )
            .orderBy(desc(attendanceLogger.createdAt));

        console.log('Fetched logs:', result);
        return { data: result };
    } catch (error) {
        console.error("Error fetching attendance logs:", error);
        return { error: "Failed to fetch attendance logs" };
    }
}

export async function checkEmployeePresent(employeeId: number, date: Date) {
    try {
        // Check if there's a present record for this date
        const existingRecord = await db
            .select()
            .from(employeePresent)
            .where(
                and(
                    eq(employeePresent.employeeId, employeeId),
                    eq(employeePresent.date, sql`${startOfDay(date)}`)
                )
            )
            .limit(1);

        return { data: existingRecord[0] || null };
    } catch (error) {
        console.error("Error checking employee present status:", error);
        return { error: "Failed to check employee present status" };
    }
}

export async function markEmployeePresent(employeeId: number, date: Date) {
    try {
        // First check if there's already a present record for this date
        const existingRecord = await db
            .select()
            .from(employeePresent)
            .where(
                and(
                    eq(employeePresent.employeeId, employeeId),
                    eq(employeePresent.date, sql`${startOfDay(date)}`)
                )
            )
            .limit(1);

        if (existingRecord.length > 0) {
            return { data: existingRecord[0] };
        }

        // Create new present record
        const [record] = await db.insert(employeePresent).values({
            employeeId,
            date: startOfDay(date),
            status: 'present',
        }).returning();

        return { data: record };
    } catch (error) {
        console.error("Error marking employee present:", error);
        return { error: "Failed to mark employee present" };
    }
}

export async function clockOutEmployee(employeeId: number, employeePresentId: number) {
    try {
        console.log('Creating clock-out log for:', { employeeId, employeePresentId });

        // Create a new attendance log entry for clock-out
        const [log] = await db.insert(attendanceLogger).values({
            employeeId,
            employeePresentId,
            clockOut: new Date(),
            clockIn: null,
            status: 'clock-out',
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        console.log('Created clock-out log:', log);
        return { data: log };
    } catch (error) {
        console.error("Error clocking out employee:", error);
        return { error: "Failed to clock out employee" };
    }
}

export async function clockInEmployee(employeeId: number, employeePresentId: number) {
    try {
        // First find the latest attendance log for this present record
        const latestLog = await db
            .select()
            .from(attendanceLogger)
            .where(
                and(
                    eq(attendanceLogger.employeeId, employeeId),
                    eq(attendanceLogger.employeePresentId, employeePresentId),
                    eq(attendanceLogger.status, 'clock-out')
                )
            )
            .orderBy(desc(attendanceLogger.clockOut))
            .limit(1);

        if (latestLog.length === 0) {
            throw new Error("No clock-out record found to update");
        }

        // Update the found record with clock-in time
        const [updated] = await db
            .update(attendanceLogger)
            .set({
                clockIn: new Date(),
                status: 'clock-in',
                updatedAt: new Date()
            })
            .where(eq(attendanceLogger.id, latestLog[0].id))
            .returning();

        return { data: updated };
    } catch (error) {
        console.error("Error clocking in employee:", error);
        return { error: "Failed to clock in employee" };
    }
}

export async function deleteRegister(registerId: number) {
    try {
        // First get all employees associated with this register
        const registerEmployeesList = await db
            .select({ employeeId: registerEmployees.employeeId })
            .from(registerEmployees)
            .where(eq(registerEmployees.registerId, registerId));

        const employeeIds = registerEmployeesList.map(re => re.employeeId);

        if (employeeIds.length > 0) {
            // Delete all salary advances for these employees
            await db
                .delete(salaryAdvances)
                .where(inArray(salaryAdvances.employeeId, employeeIds));

            // Delete all attendance logs for these employees
            await db
                .delete(attendanceLogger)
                .where(inArray(attendanceLogger.employeeId, employeeIds));

            // Delete all employee present records for these employees
            await db
                .delete(employeePresent)
                .where(inArray(employeePresent.employeeId, employeeIds));

            // Delete the register-employee associations
            await db
                .delete(registerEmployees)
                .where(eq(registerEmployees.registerId, registerId));

            // Delete the employees
            await db
                .delete(employees)
                .where(inArray(employees.id, employeeIds));
        }

        // Finally delete the register itself
        const [deletedRegister] = await db
            .delete(registers)
            .where(eq(registers.id, registerId))
            .returning();

        revalidatePath('/dashboard');
        return { data: deletedRegister };
    } catch (error) {
        console.error("Error deleting register:", error);
        return { error: "Failed to delete register" };
    }
} 