import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/schools?page=1&search=&limit=50
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE s.is_deleted = false';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND s.school_name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        const countRows = await query<{ count: string }>(
            `SELECT COUNT(*)::text as count FROM schools s ${whereClause}`,
            params
        );
        const totalCount = parseInt(countRows[0]?.count || '0');

        const rows = await query(
            `SELECT s.* FROM schools s ${whereClause}
             ORDER BY s.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        return NextResponse.json({ data: rows, count: totalCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/schools — create a school
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { school_name, address, email, phone } = body;

        const row = await queryOne(
            `INSERT INTO schools (school_name, address, email, phone)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [school_name, address || null, email || null, phone || null]
        );

        return NextResponse.json(row, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
