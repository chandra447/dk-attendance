import type { Config } from "drizzle-kit";

export default {
    schema: "./src/app/db/schema.ts",
    out: "./src/app/db/migrations",
    driver: "neon-http",
    dbCredentials: {
        connectionString: process.env.DATABASE_URL!,
    },
    tablesFilter: ["!libsql_wasm_func_table"],
    dialect: "postgresql",
} satisfies Config; 