import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/profiles/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const profile = await queryOne(
            `SELECT p.*, r.role_name, s.school_name
             FROM profiles p
             JOIN roles r ON r.id = p.role_id
             LEFT JOIN schools s ON s.id = p.school_id
             WHERE p.id = $1 AND p.is_deleted = false`,
            [id]
        );

        if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const shaped = {
            ...(profile as any),
            schools: (profile as any).school_name ? { school_name: (profile as any).school_name } : null,
            roles: { role_name: (profile as any).role_name },
        };

        return NextResponse.json(shaped);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/profiles/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { full_name, phone, current_address, permanent_address, is_deleted } = body;

        const row = await queryOne(
            `UPDATE profiles SET
                full_name = COALESCE($1, full_name),
                phone = COALESCE($2, phone),
                current_address = COALESCE($3, current_address),
                permanent_address = COALESCE($4, permanent_address),
                is_deleted = COALESCE($5, is_deleted)
             WHERE id = $6
             RETURNING *`,
            [
                full_name ?? null,
                phone ?? null,
                current_address ?? null,
                permanent_address ?? null,
                is_deleted ?? null,
                id,
            ]
        );

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
