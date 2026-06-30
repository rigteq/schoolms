import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/report-cards?page=1&search=&class_id=&academic_year=&term=&school_id=&limit=50
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const classId = searchParams.get('class_id') || '';
        const academicYear = searchParams.get('academic_year') || '';
        const term = searchParams.get('term') || '';
        const schoolId = searchParams.get('school_id') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const params: unknown[] = [];
        let paramIndex = 1;
        const conditions: string[] = ['rc.is_deleted = false'];

        if (classId) { conditions.push(`rc.class_id = $${paramIndex}`); params.push(classId); paramIndex++; }
        if (academicYear) { conditions.push(`rc.academic_year = $${paramIndex}`); params.push(academicYear); paramIndex++; }
        if (term) { conditions.push(`rc.term = $${paramIndex}`); params.push(term); paramIndex++; }
        if (schoolId) { conditions.push(`rc.school_id = $${paramIndex}`); params.push(schoolId); paramIndex++; }
        if (search) { conditions.push(`sd.full_name ILIKE $${paramIndex}`); params.push(`%${search}%`); paramIndex++; }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const countRows = await query<{ count: string }>(
            `SELECT COUNT(*)::text as count
             FROM report_cards rc
             LEFT JOIN students_data sd ON sd.id = rc.student_id
             ${whereClause}`,
            params
        );
        const totalCount = parseInt(countRows[0]?.count || '0');

        const rows = await query(
            `SELECT rc.*, sd.full_name as student_name, sd.email as student_email,
                    c.class_name, s.school_name
             FROM report_cards rc
             LEFT JOIN students_data sd ON sd.id = rc.student_id
             LEFT JOIN classes c ON c.id = rc.class_id
             LEFT JOIN schools s ON s.id = rc.school_id
             ${whereClause}
             ORDER BY rc.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        const shaped = (rows as any[]).map((row: any) => ({
            ...row,
            students_data: row.student_name ? { full_name: row.student_name, email: row.student_email } : null,
            classes: row.class_name ? { class_name: row.class_name } : null,
            schools: row.school_name ? { school_name: row.school_name } : null,
        }));

        return NextResponse.json({ data: shaped, count: totalCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/report-cards — create a report card
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { student_id, school_id, class_id, academic_year, term, remarks, created_by, subjects } = body;

        const rc = await queryOne(
            `INSERT INTO report_cards (student_id, school_id, class_id, academic_year, term, remarks, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [student_id, school_id, class_id || null, academic_year, term, remarks || null, created_by || null]
        );

        if (subjects && subjects.length > 0 && rc) {
            for (const subj of subjects) {
                await queryOne(
                    `INSERT INTO report_card_subjects (report_card_id, subject_name, max_marks, obtained_marks, grade, remarks)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [(rc as any).id, subj.subject_name, subj.max_marks, subj.obtained_marks ?? null, subj.grade ?? null, subj.remarks ?? null]
                );
            }
        }

        return NextResponse.json(rc, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
