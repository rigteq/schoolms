import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/roles
export async function GET() {
    try {
        const rows = await query(`SELECT * FROM roles`, []);
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
