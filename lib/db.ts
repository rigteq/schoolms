import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Generic query helper - returns rows as typed array
export async function query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const { rows } = await pool.query(text, params);
    return rows as T[];
}

// Query returning first row or null
export async function queryOne<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T | null> {
    const rows = await query<T>(text, params);
    return rows[0] ?? null;
}
