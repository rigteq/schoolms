import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/classes/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const cls = await queryOne(
            `SELECT c.*, s.school_name, p.id as teacher_id, p.full_name as teacher_full_name
             FROM classes c
             LEFT JOIN schools s ON s.id = c.school_id
             LEFT JOIN profiles p ON p.id = c.class_teacher_id
             WHERE c.id = $1`,
            [id]
        );

        if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const [studentsRows, teachersRows] = await Promise.all([
            query(
                `SELECT id, full_name, email FROM students_data WHERE class_id = $1 AND is_deleted = false`,
                [id]
            ),
            query(
                `SELECT td.id, td.subject_specialization, p.id as profile_id, p.full_name, p.email
                 FROM teachers_data td
                 JOIN profiles p ON p.id = td.id
                 WHERE $1 = ANY(td.class_ids)`,
                [id]
            ),
        ]);

        const c = cls as any;
        const shaped = {
            ...c,
            schools: c.school_name ? { school_name: c.school_name } : null,
            profiles: c.teacher_full_name ? { id: c.teacher_id, full_name: c.teacher_full_name } : null,
        };

        // Reshape teachers to match old structure
        const shapedTeachers = (teachersRows as any[]).map((t: any) => ({
            id: t.id,
            subject_specialization: t.subject_specialization,
            profiles: { id: t.profile_id, full_name: t.full_name, email: t.email },
        }));

        return NextResponse.json({ classData: shaped, students: studentsRows, teachers: shapedTeachers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/classes/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        const allowed = ['class_name', 'academic_year', 'class_teacher_id', 'is_deleted'];
        for (const key of allowed) {
            if (key in body) {
                fields.push(`${key} = $${idx}`);
                values.push(body[key]);
                idx++;
            }
        }

        if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });
        fields.push(`modified_at = NOW()`);

        values.push(id);
        const row = await queryOne(
            `UPDATE classes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/classes/[id] — soft delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await queryOne(`UPDATE classes SET is_deleted = true, modified_at = NOW() WHERE id = $1`, [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
