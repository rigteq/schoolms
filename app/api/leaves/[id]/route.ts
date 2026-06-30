import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// PATCH /api/leaves/[id] — update status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const row = await queryOne(
            `UPDATE leave_details
             SET status = $1, edited_time = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        return NextResponse.json(row);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
