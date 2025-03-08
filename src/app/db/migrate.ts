import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { config } from 'dotenv'

config({
    path: '.env.local',
});

const sql = neon(process.env.DATABASE_URL!);

const db = drizzle(sql);

const main = async () => {
    try {
        await migrate(db, {
            migrationsFolder: 'src/app/db/migrations',
        });
    } catch (error) {
        console.error(error);
    }
};

main();