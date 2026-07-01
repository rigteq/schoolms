"use server";

import { query, queryOne } from "@/lib/db";

export async function fetchReportCardsAction(page: number, search: string, classId: string | undefined, academicYear: string | undefined, term: string | undefined, itemsPerPage: number) {
    const offset = (page - 1) * itemsPerPage;
    
    let sql = `
        SELECT rc.*,
        json_build_object('full_name', sd.full_name, 'email', sd.email) as students_data,
        json_build_object('class_name', c.class_name) as classes,
        json_build_object('school_name', s.school_name) as schools
        FROM report_cards rc
        LEFT JOIN students_data sd ON rc.student_id = sd.id
        LEFT JOIN classes c ON rc.class_id = c.id
        LEFT JOIN schools s ON rc.school_id = s.id
        WHERE rc.is_deleted = false
    `;
    let countSql = `
        SELECT count(*) as total 
        FROM report_cards rc
        LEFT JOIN students_data sd ON rc.student_id = sd.id
        WHERE rc.is_deleted = false
    `;
    const params: any[] = [];
    
    if (search) {
        params.push(`%${search}%`);
        sql += ` AND sd.full_name ILIKE $${params.length}`;
        countSql += ` AND sd.full_name ILIKE $${params.length}`;
    }
    
    if (classId) {
        params.push(classId);
        sql += ` AND rc.class_id = $${params.length}`;
        countSql += ` AND rc.class_id = $${params.length}`;
    }
    
    if (academicYear) {
        params.push(academicYear);
        sql += ` AND rc.academic_year = $${params.length}`;
        countSql += ` AND rc.academic_year = $${params.length}`;
    }
    
    if (term) {
        params.push(term);
        sql += ` AND rc.term = $${params.length}`;
        countSql += ` AND rc.term = $${params.length}`;
    }
    
    sql += ` ORDER BY rc.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchReportCardByIdAction(id: string | undefined) {
    if (!id) return null;
    
    const rc = await queryOne(`
        SELECT rc.*,
        json_build_object('full_name', sd.full_name, 'email', sd.email, 'phone', sd.phone, 'dob', sd.dob, 'parent_name', sd.parent_name, 'parent_phone', sd.parent_phone) as students_data,
        json_build_object('class_name', c.class_name, 'academic_year', c.academic_year) as classes,
        json_build_object('school_name', s.school_name, 'email', s.email, 'phone', s.phone, 'address', s.address) as schools
        FROM report_cards rc
        LEFT JOIN students_data sd ON rc.student_id = sd.id
        LEFT JOIN classes c ON rc.class_id = c.id
        LEFT JOIN schools s ON rc.school_id = s.id
        WHERE rc.id = $1
    `, [id]);
    
    if (!rc) return null;
    
    const { rows: subjects } = await query(`SELECT * FROM report_card_subjects WHERE report_card_id = $1`, [id]);
    
    return {
        ...rc,
        report_card_subjects: subjects
    };
}

export async function fetchStudentsForReportCardAction(schoolId: string | undefined) {
    if (!schoolId) return [];
    const { rows } = await query(`
        SELECT sd.id, sd.full_name, sd.class_id, json_build_object('class_name', c.class_name) as classes 
        FROM students_data sd 
        LEFT JOIN classes c ON sd.class_id = c.id
        WHERE sd.school_id = $1 AND sd.is_deleted = false
        ORDER BY sd.full_name
    `, [schoolId]);
    return rows;
}

export async function fetchClassesForReportCardAction(schoolId: string | undefined) {
    if (!schoolId) return [];
    const { rows } = await query(`
        SELECT id, class_name, academic_year 
        FROM classes 
        WHERE school_id = $1 AND is_deleted = false
        ORDER BY class_name
    `, [schoolId]);
    return rows;
}

export async function saveFullReportCardAction(form: any, subjects: any[], profileId: string | undefined, isEdit: boolean, cardId?: string) {
    if (isEdit && cardId) {
        await query(`
            UPDATE report_cards SET
                class_id = $1, academic_year = $2, term = $3, remarks = $4, is_published = $5, modified_at = NOW()
            WHERE id = $6
        `, [form.class_id || null, form.academic_year, form.term, form.remarks, form.is_published, cardId]);
        
        await query(`DELETE FROM report_card_subjects WHERE report_card_id = $1`, [cardId]);
    } else {
        const { rows: active } = await query(`
            SELECT id FROM report_cards 
            WHERE student_id = $1 AND academic_year = $2 AND term = $3 AND is_deleted = false LIMIT 1
        `, [form.student_id, form.academic_year, form.term]);
        
        if (active.length > 0) throw new Error("A report card already exists for this student in this term.");
        
        const { rows: deleted } = await query(`
            SELECT id FROM report_cards 
            WHERE student_id = $1 AND academic_year = $2 AND term = $3 AND is_deleted = true LIMIT 1
        `, [form.student_id, form.academic_year, form.term]);
        
        if (deleted.length > 0) {
            cardId = deleted[0].id;
            await query(`
                UPDATE report_cards SET
                    is_deleted = false, school_id = $1, class_id = $2, academic_year = $3, term = $4,
                    remarks = $5, created_by = $6, is_published = $7, modified_at = NOW()
                WHERE id = $8
            `, [form.school_id, form.class_id || null, form.academic_year, form.term, form.remarks, profileId, form.is_published, cardId]);
            await query(`DELETE FROM report_card_subjects WHERE report_card_id = $1`, [cardId]);
        } else {
            const { rows: inserted } = await query(`
                INSERT INTO report_cards (student_id, school_id, class_id, academic_year, term, remarks, created_by, is_published)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
            `, [form.student_id, form.school_id, form.class_id || null, form.academic_year, form.term, form.remarks, profileId, form.is_published]);
            cardId = inserted[0].id;
        }
    }
    
    if (subjects.length > 0) {
        const values = subjects.map((s, i) => `($1, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5}, $${i*5+6})`).join(", ");
        const params = [cardId];
        subjects.forEach(s => params.push(s.subject_name, s.max_marks, s.obtained_marks, s.grade, s.remarks));
        
        await query(`
            INSERT INTO report_card_subjects (report_card_id, subject_name, max_marks, obtained_marks, grade, remarks)
            VALUES ${values}
        `, params);
    }
    
    return { success: true, cardId };
}
