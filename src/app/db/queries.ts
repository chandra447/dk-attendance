import { db } from './index';
import { eq, desc } from 'drizzle-orm';
import { registers, users } from './schema';

// Function to sync Stack Auth user with our users table
export async function syncUser(stackAuthUserId: string, email: string, name?: string) {
    // Check if user exists in our table
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!existingUser) {
        // Create new user if doesn't exist
        return await db.insert(users).values({
            email,
            name: name || email.split('@')[0],
            password: 'stack-auth-user', // Since auth is handled by Stack
        }).returning();
    }

    return existingUser;
}

// Get user registers with option to create if none exist
export async function getRegistersByUserId(userId: number) {
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

// Create a new register for user
export async function createRegister(userId: number, description?: string) {
    return await db.insert(registers).values({
        userId,
        date: new Date(),
        description: description || 'New Register',
    }).returning();
} 