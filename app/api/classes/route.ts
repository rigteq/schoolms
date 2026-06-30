import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/classes?page=1&search=&school_id=&limit=50
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
        const conditions: string[] = ['c.is_deleted = false'];

        if (schoolId) {
            conditions.push(`c.school_id = $${paramIndex}`);
            params.push(schoolId);
            paramIndex++;
        }

        if (search) {
            conditions.push(`c.class_name ILIKE $${paramIndex}`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const countRows = await query<{ count: string }>(
            `SELECT COUNT(*)::text as count FROM classes c ${whereClause}`,
            params
        );
        const totalCount = parseInt(countRows[0]?.count || '0');

        const rows = await query(
            `SELECT c.*,
                s.school_name, s.address as school_address, s.phone as school_phone, s.email as school_email,
                p.full_name as teacher_full_name,
                (SELECT COUNT(*) FROM students_data sd WHERE sd.class_id = c.id AND sd.is_deleted = false)::int as student_count
             FROM classes c
             LEFT JOIN schools s ON s.id = c.school_id
             LEFT JOIN profiles p ON p.id = c.class_teacher_id
             ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        const shaped = (rows as any[]).map((row: any) => ({
            ...row,
            schools: row.school_name ? { school_name: row.school_name, address: row.school_address, phone: row.school_phone, email: row.school_email } : null,
            profiles: row.teacher_full_name ? { full_name: row.teacher_full_name } : null,
            students_data: [{ count: row.student_count || 0 }],
        }));

        return NextResponse.json({ data: shaped, count: totalCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/classes — create a class
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { class_name, school_id, academic_year, class_teacher_id } = body;

        const row = await queryOne(
            `INSERT INTO classes (class_name, school_id, academic_year, class_teacher_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [class_name, school_id, academic_year || null, class_teacher_id || null]
        );

        return NextResponse.json(row, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
