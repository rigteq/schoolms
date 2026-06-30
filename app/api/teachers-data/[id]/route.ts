import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/teachers-data/[id]  (fetch+update teachers_data table)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const row = await queryOne(`SELECT * FROM teachers_data WHERE id = $1`, [id]);
        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/teachers-data/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { class_ids, subject_specialization } = body;

        const existing = await queryOne(`SELECT * FROM teachers_data WHERE id = $1`, [id]);

        if (!existing) {
            // Insert
            const row = await queryOne(
                `INSERT INTO teachers_data (id, class_ids, subject_specialization)
                 VALUES ($1, $2, $3) RETURNING *`,
                [id, class_ids || [], subject_specialization || null]
            );
            return NextResponse.json(row);
        }

        const row = await queryOne(
            `UPDATE teachers_data
             SET class_ids = COALESCE($1, class_ids),
                 subject_specialization = COALESCE($2, subject_specialization)
             WHERE id = $3 RETURNING *`,
            [class_ids ?? null, subject_specialization ?? null, id]
        );

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
