import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/profiles?page=1&search=&role=Admin&school_id=&limit=50
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const roleName = searchParams.get('role') || '';
        const schoolId = searchParams.get('school_id') || '';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const params: unknown[] = [];
        let paramIndex = 1;
        const conditions: string[] = ['p.is_deleted = false'];

        if (roleName) {
            conditions.push(`r.role_name = $${paramIndex}`);
            params.push(roleName);
            paramIndex++;
        }

        if (schoolId) {
            conditions.push(`p.school_id = $${paramIndex}`);
            params.push(schoolId);
            paramIndex++;
        }

        if (search) {
            conditions.push(`p.full_name ILIKE $${paramIndex}`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countRows = await query<{ count: string }>(
            `SELECT COUNT(*)::text as count FROM profiles p JOIN roles r ON r.id = p.role_id ${whereClause}`,
            params
        );
        const totalCount = parseInt(countRows[0]?.count || '0');

        const rows = await query(
            `SELECT p.*, r.role_name, s.school_name
             FROM profiles p
             JOIN roles r ON r.id = p.role_id
             LEFT JOIN schools s ON s.id = p.school_id
             ${whereClause}
             ORDER BY p.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        // Reshape to match nested structure for frontend compatibility
        const shaped = (rows as any[]).map((row: any) => ({
            ...row,
            roles: row.role_name ? { role_name: row.role_name } : null,
            schools: row.school_name ? { school_name: row.school_name } : null,
        }));

        return NextResponse.json({ data: shaped, count: totalCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
