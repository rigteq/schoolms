"use server";

import { query } from "@/lib/db";

export async function createSchoolAction(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    
    const { rows } = await query(
        `INSERT INTO schools (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
    );
    return { data: rows[0], error: null };
}

export async function updateSchoolAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE schools SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function updateProfileAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE profiles SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function updateStudentAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE students_data SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function createClassAction(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    
    const { rows } = await query(
        `INSERT INTO classes (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
    );
    return { data: rows[0], error: null };
}

export async function updateClassAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE classes SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function deleteRecordAction(table: string, id: string) {
    // Soft delete
    const allowedTables = ['schools', 'profiles', 'students_data', 'classes', 'report_cards'];
    if (!allowedTables.includes(table)) throw new Error("Invalid table");
    
    await query(`UPDATE ${table} SET is_deleted = true WHERE id = $1`, [id]);
    return { success: true };
}

export async function updateTeacherSubjectsAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE teachers_data SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function fetchSchoolNameAction(id: string) {
    const { rows } = await query(`SELECT school_name FROM schools WHERE id = $1`, [id]);
    return { data: rows[0] || null };
}

export async function createReportCardAction(data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    
    const { rows } = await query(
        `INSERT INTO report_cards (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
    );
    return { data: rows[0], error: null };
}

export async function updateReportCardAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE report_cards SET ${setClause}, modified_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function saveReportCardSubjectAction(data: any) {
    if (data.id) {
        const id = data.id;
        delete data.id;
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
        await query(`UPDATE report_card_subjects SET ${setClause} WHERE id = $1`, [id, ...values]);
    } else {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
        await query(`INSERT INTO report_card_subjects (${keys.join(", ")}) VALUES (${placeholders})`, values);
    }
    return { success: true };
}

export async function deleteReportCardSubjectAction(id: string) {
    await query(`DELETE FROM report_card_subjects WHERE id = $1`, [id]);
    return { success: true };
}

export async function deleteReportCardSubjectsByCardIdAction(reportCardId: string) {
    await query(`DELETE FROM report_card_subjects WHERE report_card_id = $1`, [reportCardId]);
    return { success: true };
}

export async function checkActiveReportCardAction(studentId: string, academicYear: string, term: string) {
    const { rows } = await query(`SELECT id FROM report_cards WHERE student_id = $1 AND academic_year = $2 AND term = $3 AND is_deleted = false LIMIT 1`, [studentId, academicYear, term]);
    return { data: rows };
}

export async function checkDeletedReportCardAction(studentId: string, academicYear: string, term: string) {
    const { rows } = await query(`SELECT id FROM report_cards WHERE student_id = $1 AND academic_year = $2 AND term = $3 AND is_deleted = true LIMIT 1`, [studentId, academicYear, term]);
    return { data: rows };
}

export async function restoreReportCardAction(id: string, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    
    const { rows } = await query(
        `UPDATE report_cards SET is_deleted = false, ${setClause}, modified_at = NOW() WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return { data: rows[0], error: null };
}

export async function assignTeacherToClassAction(teacherId: string, classId: string, setAsClassTeacher: boolean) {
    const { rows } = await query(`SELECT class_ids FROM teachers_data WHERE id = $1`, [teacherId]);
    const current = rows[0];
    
    if (!current) {
        await query(`INSERT INTO teachers_data (id, class_ids) VALUES ($1, $2)`, [teacherId, [classId]]);
    } else {
        const existingIds = current.class_ids || [];
        if (!existingIds.includes(classId)) {
            await query(`UPDATE teachers_data SET class_ids = $1 WHERE id = $2`, [[...existingIds, classId], teacherId]);
        }
    }
    
    if (setAsClassTeacher) {
        await query(`UPDATE classes SET class_teacher_id = $1 WHERE id = $2`, [teacherId, classId]);
    }
    return { success: true };
}

export async function removeTeacherFromClassAction(teacherId: string, classId: string, clearClassTeacher: boolean) {
    const { rows } = await query(`SELECT class_ids FROM teachers_data WHERE id = $1`, [teacherId]);
    const current = rows[0];
    
    if (current) {
        const newIds = (current.class_ids || []).filter((id: string) => id !== classId);
        await query(`UPDATE teachers_data SET class_ids = $1 WHERE id = $2`, [newIds, teacherId]);
    }
    
    if (clearClassTeacher) {
        await query(`UPDATE classes SET class_teacher_id = NULL WHERE id = $1`, [classId]);
    }
    return { success: true };
}
