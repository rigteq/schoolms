"use server";

import { query } from "@/lib/db";

export async function createLeaveRequestAction(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    
    const { rows } = await query(
        `INSERT INTO leave_details (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
    );
    return { data: rows[0], error: null };
}

export async function fetchMyLeavesAction(userId: string) {
    const { rows } = await query(`
        SELECT * FROM leave_details 
        WHERE profile_id = $1 
        ORDER BY created_at DESC
    `, [userId]);
    return { data: rows };
}

export async function fetchAllLeavesAction(schoolId: string | undefined) {
    if (!schoolId) return { data: [] };
    
    const { rows } = await query(`
        SELECT l.*, p.full_name as profile_name
        FROM leave_details l
        JOIN profiles p ON l.profile_id = p.id
        WHERE p.school_id = $1
        ORDER BY l.created_at DESC
    `, [schoolId]);
    
    // map to structure expected by UI: profiles(full_name)
    const mapped = rows.map(r => ({
        ...r,
        profiles: { full_name: r.profile_name }
    }));
    
    return { data: mapped };
}

export async function updateLeaveStatusAction(id: string, status: string, reviewerId: string, comments: string | null) {
    const { rows } = await query(`
        UPDATE leave_details 
        SET status = $1, reviewed_by = $2, reviewer_comments = $3, modified_at = NOW()
        WHERE id = $4
        RETURNING *
    `, [status, reviewerId, comments, id]);
    return { data: rows[0], error: null };
}

export async function fetchHolidaysAction(schoolId: string | undefined) {
    if (!schoolId) return { data: [] };
    
    const { rows } = await query(`
        SELECT * FROM leave_details
        WHERE leave_type = 'global' AND school_id = $1
        ORDER BY leave_date_from ASC
    `, [schoolId]);
    
    return { data: rows };
}
