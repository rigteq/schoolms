import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/teachers/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const profile = await queryOne(
            `SELECT p.*, s.school_name, td.subject_specialization, td.class_ids
             FROM profiles p
             LEFT JOIN schools s ON s.id = p.school_id
             LEFT JOIN teachers_data td ON td.id = p.id
             WHERE p.id = $1 AND p.is_deleted = false`,
            [id]
        );

        if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const t = profile as any;
        let classes: any[] = [];

        if (t.class_ids && t.class_ids.length > 0) {
            const classRows = await query(
                `SELECT id, class_name, academic_year FROM classes WHERE id = ANY($1)`,
                [t.class_ids]
            );
            classes = (classRows as any[]).map((c: any) => ({
                ...c,
                subject_name: t.subject_specialization,
            }));
        }

        const shaped = {
            ...t,
            schools: t.school_name ? { school_name: t.school_name } : null,
        };

        return NextResponse.json({ teacher: shaped, classes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
