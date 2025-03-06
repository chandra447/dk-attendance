'use server';

import { db } from './config';
import { eq, desc } from 'drizzle-orm';
import { users, registers } from './schema';

export async function findUserByEmail(email: string) {
    return await db.query.users.findFirst({
        where: eq(users.email, email)
    });
}

export async function createUser(data: { email: string; name: string; password: string; }) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
}

export async function findRegistersByUserId(userId: number) {
    return await db.query.registers.findMany({
        where: eq(registers.userId, userId),
        orderBy: [desc(registers.date)],
        columns: {
            id: true,
            date: true,
            description: true,
        },
    });
}

export async function createNewRegister(data: { userId: number; description?: string; }) {
    const [register] = await db.insert(registers).values({
        userId: data.userId,
        date: new Date(),
        description: data.description || 'New Register',
    }).returning();
    return register;
} 