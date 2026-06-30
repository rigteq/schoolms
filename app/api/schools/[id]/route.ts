import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/schools/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const school = await queryOne(
            `SELECT * FROM schools WHERE id = $1 AND is_deleted = false`,
            [id]
        );

        if (!school) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Fetch related data: classes, roles, then teachers/students/admins
        const [classesRows, rolesRows] = await Promise.all([
            query(`SELECT * FROM classes WHERE school_id = $1 AND is_deleted = false`, [id]),
            query(`SELECT id, role_name FROM roles`, []),
        ]);

        const teacherRoleId = (rolesRows as any[]).find((r: any) => r.role_name === 'Teacher')?.id;
        const adminRoleId = (rolesRows as any[]).find((r: any) => r.role_name === 'Admin')?.id;

        const [teachersRows, studentsRows, adminsRows] = await Promise.all([
            query(`SELECT * FROM profiles WHERE school_id = $1 AND role_id = $2 AND is_deleted = false`, [id, teacherRoleId || '']),
            query(`SELECT * FROM students_data WHERE school_id = $1 AND is_deleted = false`, [id]),
            query(`SELECT * FROM profiles WHERE school_id = $1 AND role_id = $2 AND is_deleted = false`, [id, adminRoleId || '']),
        ]);

        return NextResponse.json({
            school,
            classes: classesRows,
            teachers: teachersRows,
            students: studentsRows,
            admins: adminsRows,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/schools/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { school_name, address, email, phone } = body;

        const row = await queryOne(
            `UPDATE schools
             SET school_name = COALESCE($1, school_name),
                 address = COALESCE($2, address),
                 email = COALESCE($3, email),
                 phone = COALESCE($4, phone),
                 modified_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [school_name || null, address || null, email || null, phone || null, id]
        );

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/schools/[id] — soft delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await queryOne(
            `UPDATE schools SET is_deleted = true, modified_at = NOW() WHERE id = $1`,
            [id]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
