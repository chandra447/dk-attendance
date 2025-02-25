'use server';

import { findUserByEmail, createUser, findRegistersByUserId, createNewRegister } from '@/app/db';
import { revalidatePath } from 'next/cache';
import { db } from '@/app/db/config';
import { employees, registerEmployees, registers, attendanceLogger, employeePresent, salaryAdvances, registerLogs } from "@/app/db/schema";
import { eq, and, desc, gte, lte, sql, or, inArray, isNull } from "drizzle-orm";
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
                startTime: employees.startTime,
                endTime: employees.endTime,
                durationAllowed: sql`CAST(${employees.durationAllowed} AS INTEGER)`,
                passcode: employees.passcode,
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

        revalidatePath(`/dashboard/registers/${data.registerId}`);
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
    registerId: string;
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

        revalidatePath(`/dashboard/registers/${data.registerId}`);
        return { data: updated };
    } catch (error) {
        console.error("Error updating employee:", error);
        return { error: "Failed to update employee" };
    }
}

export async function getEmployeeAttendanceLogs(employeeId: number, startDate: Date, endDate: Date) {
    try {
        const startTime = startOfDay(startDate);
        const endTime = endOfDay(endDate);

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

export async function updateAttendanceLog(data: {
    id: number;
    clockIn: Date | null;
    clockOut: Date | null;
}) {
    try {
        const [updated] = await db
            .update(attendanceLogger)
            .set({
                clockIn: data.clockIn,
                clockOut: data.clockOut,
                updatedAt: new Date()
            })
            .where(eq(attendanceLogger.id, data.id))
            .returning();

        return { data: updated };
    } catch (error) {
        console.error("Error updating attendance log:", error);
        return { error: "Failed to update attendance log" };
    }
}

export async function deleteAttendanceLog(logId: number) {
    try {
        const [deleted] = await db
            .delete(attendanceLogger)
            .where(eq(attendanceLogger.id, logId))
            .returning();

        return { data: deleted };
    } catch (error) {
        console.error("Error deleting attendance log:", error);
        return { error: "Failed to delete attendance log" };
    }
}

export async function setRegisterStartTime(registerId: number, startTime: Date) {
    try {
        const date = startOfDay(startTime);

        // First update any open attendance logs
        // Set clock-in time to 10 PM UTC of the previous day for any logs that have clock-out but no clock-in
        const previousDay = new Date(date);
        previousDay.setDate(previousDay.getDate() - 1);
        previousDay.setUTCHours(22, 0, 0, 0); // 10 PM UTC

        await db
            .update(attendanceLogger)
            .set({
                status: 'clock-in',
                clockIn: sql`${previousDay}`,
                updatedAt: new Date()
            })
            .where(
                and(
                    sql`${attendanceLogger.clockOut} < CURRENT_TIMESTAMP`,
                    eq(attendanceLogger.status, 'clock-out'),
                    isNull(attendanceLogger.clockIn)
                )
            );

        // Check if there's already a log for this date
        const existingLog = await db
            .select()
            .from(registerLogs)
            .where(
                and(
                    eq(registerLogs.registerId, registerId),
                    eq(registerLogs.date, sql`${date}`)
                )
            )
            .limit(1);

        if (existingLog.length > 0) {
            // Update existing log
            const [updated] = await db
                .update(registerLogs)
                .set({
                    startTime,
                    updatedAt: new Date()
                })
                .where(eq(registerLogs.id, existingLog[0].id))
                .returning();
            return { data: updated };
        }

        // Create new log
        const [newLog] = await db
            .insert(registerLogs)
            .values({
                registerId,
                date,
                startTime,
                status: 'active',
            })
            .returning();

        return { data: newLog };
    } catch (error) {
        console.error("Error setting register start time:", error);
        return { error: "Failed to set register start time" };
    }
}

export async function getRegisterStartTime(registerId: number, date: Date) {
    try {
        const dayStart = startOfDay(date);

        const log = await db
            .select()
            .from(registerLogs)
            .where(
                and(
                    eq(registerLogs.registerId, registerId),
                    eq(registerLogs.date, sql`${dayStart}`)
                )
            )
            .limit(1);

        return { data: log[0] || null };
    } catch (error) {
        console.error("Error getting register start time:", error);
        return { error: "Failed to get register start time" };
    }
}

export async function getEmployeeAttendanceLogsInBulk(employeeIds: number[], date: Date) {
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
                    inArray(attendanceLogger.employeeId, employeeIds),
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

        // Group logs by employeeId
        const logsByEmployee = result.reduce((acc, log) => {
            if (!acc[log.employeeId]) {
                acc[log.employeeId] = [];
            }
            acc[log.employeeId].push(log);
            return acc;
        }, {} as Record<number, typeof result>);

        return { data: logsByEmployee };
    } catch (error) {
        console.error("Error fetching attendance logs in bulk:", error);
        return { error: "Failed to fetch attendance logs" };
    }
}

export async function checkEmployeePresentInBulk(employeeIds: number[], date: Date) {
    try {
        const result = await db
            .select()
            .from(employeePresent)
            .where(
                and(
                    inArray(employeePresent.employeeId, employeeIds),
                    eq(employeePresent.date, sql`${startOfDay(date)}`)
                )
            );

        // Convert array to record by employeeId
        const presentByEmployee = result.reduce((acc, record) => {
            acc[record.employeeId] = record;
            return acc;
        }, {} as Record<number, typeof result[0]>);

        return { data: presentByEmployee };
    } catch (error) {
        console.error("Error checking employee present status in bulk:", error);
        return { error: "Failed to check employee present status" };
    }
}

export async function markEmployeeAbsent(employeeId: number, employeePresentId: number, date: Date) {
    try {
        // Update the present record to mark as absent
        const [updatedPresent] = await db
            .update(employeePresent)
            .set({
                status: 'absent',
                absentTimestamp: date,
                updatedAt: new Date()
            })
            .where(eq(employeePresent.id, employeePresentId))
            .returning();

        return { data: { presentRecord: updatedPresent } };
    } catch (error) {
        console.error("Error marking employee absent:", error);
        return { error: "Failed to mark employee absent" };
    }
}

export async function markEmployeeReturnFromAbsent(employeeId: number, employeePresentId: number) {
    try {
        // Get the present record to get the absent timestamp
        const presentRecord = await db
            .select()
            .from(employeePresent)
            .where(eq(employeePresent.id, employeePresentId))
            .limit(1);

        if (presentRecord.length === 0 || !presentRecord[0].absentTimestamp) {
            throw new Error("No absent record found");
        }

        // Update the present record back to present status
        const [updatedPresent] = await db
            .update(employeePresent)
            .set({
                status: 'present',
                updatedAt: new Date()
            })
            .where(eq(employeePresent.id, employeePresentId))
            .returning();

        // Create a new log entry with clock_in as now and clock_out as the absent time
        const [newLog] = await db.insert(attendanceLogger).values({
            employeeId,
            employeePresentId,
            clockIn: new Date(),
            clockOut: presentRecord[0].absentTimestamp,
            status: 'clock-in',
            notes: 'Returned from absence',
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        return { data: { presentRecord: updatedPresent, log: newLog } };
    } catch (error) {
        console.error("Error marking employee return:", error);
        return { error: "Failed to mark employee return" };
    }
}

export async function getTotalSalaryAdvances(employeeId: number) {
    try {
        const result = await db
            .select({
                total: sql<string>`COALESCE(SUM(${salaryAdvances.amount}), 0)::text`,
            })
            .from(salaryAdvances)
            .where(eq(salaryAdvances.employeeId, employeeId));

        return { data: result[0].total };
    } catch (error) {
        console.error("Error fetching total salary advances:", error);
        return { error: "Failed to fetch total salary advances" };
    }
}

export async function getAllSalaryAdvances(employeeId: number) {
    try {
        const result = await db
            .select({
                id: salaryAdvances.id,
                amount: salaryAdvances.amount,
                requestDate: salaryAdvances.requestDate,
                description: salaryAdvances.description,
                status: salaryAdvances.status,
                createdAt: salaryAdvances.createdAt,
            })
            .from(salaryAdvances)
            .where(eq(salaryAdvances.employeeId, employeeId))
            .orderBy(desc(salaryAdvances.createdAt));

        return { data: result };
    } catch (error) {
        console.error("Error fetching salary advances:", error);
        return { error: "Failed to fetch salary advances" };
    }
}

export async function createSalaryAdvance(data: {
    employeeId: number;
    amount: number;
    description?: string;
    registerId: string;
}) {
    try {
        const [newAdvance] = await db
            .insert(salaryAdvances)
            .values({
                employeeId: data.employeeId,
                amount: data.amount.toFixed(2),
                requestDate: sql`CURRENT_DATE`,
                description: data.description || null,
                status: 'approved'
            })
            .returning();

        revalidatePath(`/dashboard/registers/${data.registerId}`);
        return { data: newAdvance };
    } catch (error) {
        console.error("Error creating salary advance:", error);
        return { error: "Failed to create salary advance" };
    }
}

export async function getAllRegisters() {
    try {
        const result = await db
            .select({
                id: registers.id,
                name: registers.description,
            })
            .from(registers)
            .orderBy(registers.date);

        return { data: result };
    } catch (error) {
        console.error("Error fetching registers:", error);
        return { error: "Failed to fetch registers" };
    }
}

export async function getAllEmployees(registerId: number) {
    try {
        const result = await db
            .select({
                id: employees.id,
                name: employees.name,
                startTime: employees.startTime,
                endTime: employees.endTime,
                durationAllowed: sql`CAST(${employees.durationAllowed} AS INTEGER)`,
            })
            .from(registerEmployees)
            .innerJoin(employees, eq(registerEmployees.employeeId, employees.id))
            .where(eq(registerEmployees.registerId, registerId))
            .orderBy(employees.name);

        return { data: result };
    } catch (error) {
        console.error("Error fetching employees:", error);
        return { error: "Failed to fetch employees" };
    }
} 