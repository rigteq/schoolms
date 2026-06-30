import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/stats?school_id=
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const schoolId = searchParams.get('school_id') || '';

        if (schoolId) {
            // School-specific stats
            const [teacherRow, studentRow, classRow] = await Promise.all([
                queryOne<{ count: string }>(
                    `SELECT COUNT(*)::text as count
                     FROM profiles p
                     JOIN roles r ON r.id = p.role_id
                     WHERE p.school_id = $1 AND r.role_name = 'Teacher' AND p.is_deleted = false`,
                    [schoolId]
                ),
                queryOne<{ count: string }>(
                    `SELECT COUNT(*)::text as count FROM students_data WHERE school_id = $1 AND is_deleted = false`,
                    [schoolId]
                ),
                queryOne<{ count: string }>(
                    `SELECT COUNT(*)::text as count FROM classes WHERE school_id = $1 AND is_deleted = false`,
                    [schoolId]
                ),
            ]);

            return NextResponse.json({
                teachers: parseInt(teacherRow?.count || '0'),
                students: parseInt(studentRow?.count || '0'),
                classes: parseInt(classRow?.count || '0'),
            });
        }

        // Global stats
        const [schoolRow, teacherRow, studentRow, classRow] = await Promise.all([
            queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM schools WHERE is_deleted = false`, []),
            queryOne<{ count: string }>(
                `SELECT COUNT(*)::text as count FROM profiles p JOIN roles r ON r.id = p.role_id WHERE r.role_name = 'Teacher' AND p.is_deleted = false`,
                []
            ),
            queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM students_data WHERE is_deleted = false`, []),
            queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM classes WHERE is_deleted = false`, []),
        ]);

        return NextResponse.json({
            schools: parseInt(schoolRow?.count || '0'),
            teachers: parseInt(teacherRow?.count || '0'),
            students: parseInt(studentRow?.count || '0'),
            classes: parseInt(classRow?.count || '0'),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
