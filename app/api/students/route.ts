import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/students?page=1&search=&school_id=&limit=50
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const schoolId = searchParams.get('school_id') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const params: unknown[] = [];
        let paramIndex = 1;
        const conditions: string[] = ['sd.is_deleted = false'];

        if (schoolId) {
            conditions.push(`sd.school_id = $${paramIndex}`);
            params.push(schoolId);
            paramIndex++;
        }

        if (search) {
            conditions.push(`sd.full_name ILIKE $${paramIndex}`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const countRows = await query<{ count: string }>(
            `SELECT COUNT(*)::text as count FROM students_data sd ${whereClause}`,
            params
        );
        const totalCount = parseInt(countRows[0]?.count || '0');

        const rows = await query(
            `SELECT sd.*, s.school_name, c.class_name
             FROM students_data sd
             LEFT JOIN schools s ON s.id = sd.school_id
             LEFT JOIN classes c ON c.id = sd.class_id
             ${whereClause}
             ORDER BY sd.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        const shaped = (rows as any[]).map((row: any) => ({
            ...row,
            schools: row.school_name ? { school_name: row.school_name } : null,
            classes: row.class_name ? { class_name: row.class_name } : null,
        }));

        return NextResponse.json({ data: shaped, count: totalCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
