import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/students/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const student = await queryOne(
            `SELECT sd.*, s.school_name, c.id as class_id_val, c.class_name, c.academic_year
             FROM students_data sd
             LEFT JOIN schools s ON s.id = sd.school_id
             LEFT JOIN classes c ON c.id = sd.class_id
             WHERE sd.id = $1 AND sd.is_deleted = false`,
            [id]
        );

        if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const s = student as any;

        // If student has a class, fetch their teachers
        let teachers: any[] = [];
        if (s.class_id) {
            const teacherRows = await query(
                `SELECT td.id, td.subject_specialization, p.full_name, p.email
                 FROM teachers_data td
                 JOIN profiles p ON p.id = td.id
                 WHERE $1 = ANY(td.class_ids)`,
                [s.class_id]
            );
            teachers = (teacherRows as any[]).map((t: any) => ({
                id: t.id,
                full_name: t.full_name,
                email: t.email,
                subject: t.subject_specialization,
            }));
        }

        const shaped = {
            ...s,
            schools: s.school_name ? { school_name: s.school_name } : null,
            classes: s.class_id ? { id: s.class_id, class_name: s.class_name, academic_year: s.academic_year } : null,
        };

        return NextResponse.json({ student: shaped, teachers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/students/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        const allowed = ['full_name', 'email', 'phone', 'current_address', 'dob', 'parent_name', 'parent_phone', 'class_id', 'is_deleted'];
        for (const key of allowed) {
            if (key in body) {
                fields.push(`${key} = $${idx}`);
                values.push(body[key]);
                idx++;
            }
        }

        if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

        values.push(id);
        const row = await queryOne(
            `UPDATE students_data SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
