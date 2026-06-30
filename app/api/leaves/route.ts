import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/leaves?school_id=&profile_id=&role=&type=&limit=50
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const schoolId = searchParams.get('school_id') || '';
        const profileId = searchParams.get('profile_id') || '';
        const role = searchParams.get('role') || '';
        const leaveType = searchParams.get('type') || '';
        const excludeType = searchParams.get('exclude_type') || '';

        const params: unknown[] = [];
        let paramIndex = 1;
        const conditions: string[] = [];

        if (leaveType) {
            conditions.push(`ld.leave_type = $${paramIndex}`);
            params.push(leaveType);
            paramIndex++;
        }

        if (excludeType) {
            conditions.push(`ld.leave_type != $${paramIndex}`);
            params.push(excludeType);
            paramIndex++;
        }

        if (role === 'Admin' || role === 'Superadmin') {
            if (schoolId) {
                conditions.push(`ld.school_id = $${paramIndex}`);
                params.push(schoolId);
                paramIndex++;
            }
        } else if (profileId) {
            conditions.push(`ld.profile_id = $${paramIndex}`);
            params.push(profileId);
            paramIndex++;
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const rows = await query(
            `SELECT ld.*, p.full_name
             FROM leave_details ld
             LEFT JOIN profiles p ON p.id = ld.profile_id
             ${whereClause}
             ORDER BY ld.created_time DESC`,
            params
        );

        const shaped = (rows as any[]).map((row: any) => ({
            ...row,
            profiles: row.full_name ? { full_name: row.full_name } : null,
        }));

        return NextResponse.json(shaped);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/leaves — apply leave
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { profile_id, school_id, leave_type, leave_date_from, leave_date_to, leave_comment, status } = body;

        const row = await queryOne(
            `INSERT INTO leave_details (profile_id, school_id, leave_type, leave_date_from, leave_date_to, leave_comment, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [profile_id, school_id, leave_type, leave_date_from, leave_date_to, leave_comment || null, status || 'pending']
        );

        return NextResponse.json(row, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
