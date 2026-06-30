import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/report-cards/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const rc = await queryOne(
            `SELECT rc.*,
                    sd.full_name as student_name, sd.email as student_email,
                    sd.phone as student_phone, sd.dob as student_dob,
                    sd.parent_name, sd.parent_phone,
                    c.class_name, c.academic_year as class_academic_year,
                    s.school_name, s.email as school_email, s.phone as school_phone, s.address as school_address
             FROM report_cards rc
             LEFT JOIN students_data sd ON sd.id = rc.student_id
             LEFT JOIN classes c ON c.id = rc.class_id
             LEFT JOIN schools s ON s.id = rc.school_id
             WHERE rc.id = $1`,
            [id]
        );

        if (!rc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const subjects = await query(
            `SELECT * FROM report_card_subjects WHERE report_card_id = $1`,
            [id]
        );

        const r = rc as any;
        const shaped = {
            ...r,
            students_data: r.student_name ? {
                full_name: r.student_name, email: r.student_email,
                phone: r.student_phone, dob: r.student_dob,
                parent_name: r.parent_name, parent_phone: r.parent_phone,
            } : null,
            classes: r.class_name ? { class_name: r.class_name, academic_year: r.class_academic_year } : null,
            schools: r.school_name ? { school_name: r.school_name, email: r.school_email, phone: r.school_phone, address: r.school_address } : null,
            report_card_subjects: subjects,
        };

        return NextResponse.json(shaped);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/report-cards/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        const allowed = ['student_id', 'class_id', 'academic_year', 'term', 'remarks', 'is_published', 'is_deleted'];
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
            `UPDATE report_cards SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        // If subjects provided, replace them
        if (body.subjects) {
            await query(`DELETE FROM report_card_subjects WHERE report_card_id = $1`, [id]);
            for (const subj of body.subjects) {
                await queryOne(
                    `INSERT INTO report_card_subjects (report_card_id, subject_name, max_marks, obtained_marks, grade, remarks)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [id, subj.subject_name, subj.max_marks, subj.obtained_marks ?? null, subj.grade ?? null, subj.remarks ?? null]
                );
            }
        }

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
