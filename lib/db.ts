import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function query(text: string, params?: any[]) {
    return await pool.query(text, params);
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const { rows } = await pool.query(text, params);
    return rows.length > 0 ? (rows[0] as T) : null;
}
