"use server";

import { query, queryOne } from "@/lib/db";

export async function fetchSchoolsAction(page: number, search: string, itemsPerPage: number) {
    const offset = (page - 1) * itemsPerPage;
    let sql = `SELECT * FROM schools WHERE is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM schools WHERE is_deleted = false`;
    const params: any[] = [];
    
    if (search) {
        params.push(`%${search}%`);
        sql += ` AND school_name ILIKE $1`;
        countSql += ` AND school_name ILIKE $1`;
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchAdminsAction(page: number, search: string, itemsPerPage: number) {
    const role = await queryOne(`SELECT id FROM roles WHERE role_name = 'Admin'`);
    if (!role) return { data: [], count: 0 };

    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT p.*, json_build_object('school_name', s.school_name) as schools 
        FROM profiles p 
        LEFT JOIN schools s ON p.school_id = s.id 
        WHERE p.role_id = $1 AND p.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM profiles p WHERE p.role_id = $1 AND p.is_deleted = false`;
    const params: any[] = [role.id];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND p.full_name ILIKE $2`;
        countSql += ` AND p.full_name ILIKE $2`;
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchTeachersAction(page: number, search: string, itemsPerPage: number) {
    const role = await queryOne(`SELECT id FROM roles WHERE role_name = 'Teacher'`);
    if (!role) return { data: [], count: 0 };

    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT p.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('subject_specialization', td.subject_specialization) as teachers_data
        FROM profiles p 
        LEFT JOIN schools s ON p.school_id = s.id 
        LEFT JOIN teachers_data td ON p.id = td.id
        WHERE p.role_id = $1 AND p.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM profiles p WHERE p.role_id = $1 AND p.is_deleted = false`;
    const params: any[] = [role.id];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND p.full_name ILIKE $2`;
        countSql += ` AND p.full_name ILIKE $2`;
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchStudentsAction(page: number, search: string, itemsPerPage: number) {
    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT sd.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('class_name', c.class_name) as classes
        FROM students_data sd 
        LEFT JOIN schools s ON sd.school_id = s.id 
        LEFT JOIN classes c ON sd.class_id = c.id
        WHERE sd.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM students_data sd WHERE sd.is_deleted = false`;
    const params: any[] = [];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND sd.full_name ILIKE $1`;
        countSql += ` AND sd.full_name ILIKE $1`;
    }
    
    sql += ` ORDER BY sd.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchClassesAction(page: number, search: string, itemsPerPage: number) {
    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT c.*, 
        json_build_object('school_name', s.school_name, 'address', s.address, 'phone', s.phone, 'email', s.email) as schools,
        json_build_object('full_name', p.full_name) as profiles,
        (SELECT count(*) FROM students_data sd WHERE sd.class_id = c.id AND sd.is_deleted = false) as student_count
        FROM classes c 
        LEFT JOIN schools s ON c.school_id = s.id 
        LEFT JOIN profiles p ON c.class_teacher_id = p.id
        WHERE c.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM classes c WHERE c.is_deleted = false`;
    const params: any[] = [];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND c.class_name ILIKE $1`;
        countSql += ` AND c.class_name ILIKE $1`;
    }
    
    sql += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    
    const mappedRows = rows.map(r => ({
        ...r,
        students_data: [{ count: parseInt(r.student_count) }]
    }));
    
    const { rows: countRows } = await query(countSql, params);
    
    return { data: mappedRows, count: parseInt(countRows[0].total) };
}

export async function fetchStatsAction() {
    const schoolsCount = await queryOne(`SELECT count(*) as count FROM schools WHERE is_deleted = false`);
    const studentsCount = await queryOne(`SELECT count(*) as count FROM students_data WHERE is_deleted = false`);
    const classesCount = await queryOne(`SELECT count(*) as count FROM classes WHERE is_deleted = false`);
    const teachersCount = await queryOne(`
        SELECT count(*) as count FROM profiles p 
        JOIN roles r ON p.role_id = r.id 
        WHERE r.role_name = 'Teacher' AND p.is_deleted = false`);

    return {
        schools: parseInt(schoolsCount?.count || 0),
        students: parseInt(studentsCount?.count || 0),
        teachers: parseInt(teachersCount?.count || 0),
        classes: parseInt(classesCount?.count || 0),
    };
}

export async function fetchSchoolStatsAction(schoolId: string | undefined) {
    if (!schoolId) return { teachers: 0, students: 0, classes: 0 };
    
    const studentsCount = await queryOne(`SELECT count(*) as count FROM students_data WHERE school_id = $1 AND is_deleted = false`, [schoolId]);
    const classesCount = await queryOne(`SELECT count(*) as count FROM classes WHERE school_id = $1 AND is_deleted = false`, [schoolId]);
    const teachersCount = await queryOne(`
        SELECT count(*) as count FROM profiles p 
        JOIN roles r ON p.role_id = r.id 
        WHERE r.role_name = 'Teacher' AND p.school_id = $1 AND p.is_deleted = false`, [schoolId]);

    return {
        teachers: parseInt(teachersCount?.count || 0),
        students: parseInt(studentsCount?.count || 0),
        classes: parseInt(classesCount?.count || 0),
    };
}

export async function fetchAdminTeachersAction(page: number, search: string, schoolId: string, itemsPerPage: number) {
    const role = await queryOne(`SELECT id FROM roles WHERE role_name = 'Teacher'`);
    if (!role) return { data: [], count: 0 };

    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT p.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('subject_specialization', td.subject_specialization) as teachers_data
        FROM profiles p 
        LEFT JOIN schools s ON p.school_id = s.id 
        LEFT JOIN teachers_data td ON p.id = td.id
        WHERE p.role_id = $1 AND p.school_id = $2 AND p.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM profiles p WHERE p.role_id = $1 AND p.school_id = $2 AND p.is_deleted = false`;
    const params: any[] = [role.id, schoolId];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND p.full_name ILIKE $3`;
        countSql += ` AND p.full_name ILIKE $3`;
    }
    
    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchAdminStudentsAction(page: number, search: string, schoolId: string, itemsPerPage: number) {
    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT sd.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('class_name', c.class_name) as classes
        FROM students_data sd 
        LEFT JOIN schools s ON sd.school_id = s.id 
        LEFT JOIN classes c ON sd.class_id = c.id
        WHERE sd.school_id = $1 AND sd.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM students_data sd WHERE sd.school_id = $1 AND sd.is_deleted = false`;
    const params: any[] = [schoolId];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND sd.full_name ILIKE $2`;
        countSql += ` AND sd.full_name ILIKE $2`;
    }
    
    sql += ` ORDER BY sd.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    const { rows: countRows } = await query(countSql, params);
    
    return { data: rows, count: parseInt(countRows[0].total) };
}

export async function fetchAdminClassesAction(page: number, search: string, schoolId: string, itemsPerPage: number) {
    const offset = (page - 1) * itemsPerPage;
    let sql = `
        SELECT c.*, 
        json_build_object('school_name', s.school_name, 'address', s.address, 'phone', s.phone, 'email', s.email) as schools,
        json_build_object('full_name', p.full_name) as profiles,
        (SELECT count(*) FROM students_data sd WHERE sd.class_id = c.id AND sd.is_deleted = false) as student_count
        FROM classes c 
        LEFT JOIN schools s ON c.school_id = s.id 
        LEFT JOIN profiles p ON c.class_teacher_id = p.id
        WHERE c.school_id = $1 AND c.is_deleted = false`;
    let countSql = `SELECT count(*) as total FROM classes c WHERE c.school_id = $1 AND c.is_deleted = false`;
    const params: any[] = [schoolId];

    if (search) {
        params.push(`%${search}%`);
        sql += ` AND c.class_name ILIKE $2`;
        countSql += ` AND c.class_name ILIKE $2`;
    }
    
    sql += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await query(sql, [...params, itemsPerPage, offset]);
    
    const mappedRows = rows.map(r => ({
        ...r,
        students_data: [{ count: parseInt(r.student_count) }]
    }));
    
    const { rows: countRows } = await query(countSql, params);
    
    return { data: mappedRows, count: parseInt(countRows[0].total) };
}

export async function fetchTeacherClassesAction(teacherId: string | undefined) {
    if (!teacherId) return { data: [], count: 0 };

    const teacher = await queryOne(`SELECT class_ids FROM teachers_data WHERE id = $1`, [teacherId]);
    if (!teacher || !teacher.class_ids || teacher.class_ids.length === 0) return { data: [], count: 0 };

    let sql = `
        SELECT c.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('full_name', p.full_name) as profiles,
        (SELECT count(*) FROM students_data sd WHERE sd.class_id = c.id AND sd.is_deleted = false) as student_count
        FROM classes c 
        LEFT JOIN schools s ON c.school_id = s.id 
        LEFT JOIN profiles p ON c.class_teacher_id = p.id
        WHERE c.id = ANY($1) AND c.is_deleted = false
        ORDER BY c.created_at DESC`;
        
    const { rows } = await query(sql, [teacher.class_ids]);
    
    const mappedRows = rows.map(r => ({
        ...r,
        students_data: [{ count: parseInt(r.student_count) }]
    }));
    
    return { data: mappedRows, count: mappedRows.length };
}

export async function fetchProfileByIdAction(id: string) {
    const { rows } = await query(`
        SELECT p.*, json_build_object('school_name', s.school_name) as schools 
        FROM profiles p 
        LEFT JOIN schools s ON p.school_id = s.id 
        WHERE p.id = $1 AND p.is_deleted = false
    `, [id]);
    return { data: rows[0] || null };
}

export async function fetchReportCardByIdAction(id: string) {
    const sql = `
        SELECT r.*,
        json_build_object('full_name', s.full_name, 'email', s.email, 'phone', s.phone, 'dob', s.dob, 'parent_name', s.parent_name, 'parent_phone', s.parent_phone) as students_data,
        json_build_object('class_name', c.class_name, 'academic_year', c.academic_year) as classes,
        json_build_object('school_name', sch.school_name, 'email', sch.email, 'phone', sch.phone, 'address', sch.address) as schools,
        (SELECT json_agg(row_to_json(rcs)) FROM report_card_subjects rcs WHERE rcs.report_card_id = r.id) as report_card_subjects
        FROM report_cards r
        LEFT JOIN students_data s ON r.student_id = s.id
        LEFT JOIN classes c ON r.class_id = c.id
        LEFT JOIN schools sch ON r.school_id = sch.id
        WHERE r.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return { data: rows[0] || null };
}

export async function fetchSchoolDetailWithRelationsAction(schoolId: string) {
    const school = await queryOne(`SELECT * FROM schools WHERE id = $1 AND is_deleted = false`, [schoolId]);
    if (!school) return null;
    
    const { rows: classes } = await query(`SELECT * FROM classes WHERE school_id = $1 AND is_deleted = false`, [schoolId]);
    
    const { rows: roles } = await query(`SELECT id, role_name FROM roles`);
    const teacherRoleId = roles.find(r => r.role_name === 'Teacher')?.id;
    const adminRoleId = roles.find(r => r.role_name === 'Admin')?.id;
    
    let teachers = [];
    if (teacherRoleId) {
        const res = await query(`SELECT * FROM profiles WHERE school_id = $1 AND role_id = $2 AND is_deleted = false`, [schoolId, teacherRoleId]);
        teachers = res.rows;
    }
    
    const { rows: students } = await query(`SELECT * FROM students_data WHERE school_id = $1 AND is_deleted = false`, [schoolId]);
    
    let admins = [];
    if (adminRoleId) {
        const res = await query(`SELECT * FROM profiles WHERE school_id = $1 AND role_id = $2 AND is_deleted = false`, [schoolId, adminRoleId]);
        admins = res.rows;
    }
    
    return {
        school,
        classes,
        teachers,
        students,
        admins
    };
}

export async function fetchStudentDetailsAction(id: string) {
    const { rows: students } = await query(`
        SELECT sd.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('id', c.id, 'class_name', c.class_name, 'academic_year', c.academic_year) as classes
        FROM students_data sd
        LEFT JOIN schools s ON sd.school_id = s.id
        LEFT JOIN classes c ON sd.class_id = c.id
        WHERE sd.id = $1 AND sd.is_deleted = false
    `, [id]);
    
    if (students.length === 0) return null;
    const student = students[0];
    
    let teachers = [];
    if (student.classes && student.classes.id) {
        // Find teachers who have this class_id in their class_ids array
        const res = await query(`
            SELECT td.id, td.subject_specialization as subject, p.full_name, p.email
            FROM teachers_data td
            JOIN profiles p ON td.id = p.id
            WHERE $1 = ANY(td.class_ids) AND p.is_deleted = false
        `, [student.classes.id]);
        teachers = res.rows;
    }
    
    return { student, teachers };
}

export async function fetchTeacherDetailsAction(id: string) {
    const { rows: profiles } = await query(`
        SELECT p.*, json_build_object('school_name', s.school_name) as schools 
        FROM profiles p 
        LEFT JOIN schools s ON p.school_id = s.id 
        WHERE p.id = $1 AND p.is_deleted = false
    `, [id]);
    
    if (profiles.length === 0) return null;
    const teacherProfile = profiles[0];
    
    const { rows: teacherData } = await query(`
        SELECT subject_specialization, class_ids 
        FROM teachers_data 
        WHERE id = $1
    `, [id]);
    
    const subject_specialization = teacherData[0]?.subject_specialization || null;
    const class_ids = teacherData[0]?.class_ids || [];
    
    let classes = [];
    if (class_ids.length > 0) {
        const { rows } = await query(`
            SELECT id, class_name, academic_year 
            FROM classes 
            WHERE id = ANY($1) AND is_deleted = false
        `, [class_ids]);
        
        classes = rows.map(c => ({
            ...c,
            subject_name: subject_specialization
        }));
    }
    
    return {
        teacher: { ...teacherProfile, subject_specialization },
        classes
    };
}
export async function fetchClassDetailsAction(classId: string) {
    const { rows: classes } = await query(`
        SELECT c.*, 
        json_build_object('school_name', s.school_name) as schools,
        json_build_object('id', p.id, 'full_name', p.full_name) as profiles
        FROM classes c
        LEFT JOIN schools s ON c.school_id = s.id
        LEFT JOIN profiles p ON c.class_teacher_id = p.id
        WHERE c.id = $1 AND c.is_deleted = false
    `, [classId]);
    
    if (classes.length === 0) return null;
    const cls = classes[0];
    
    const { rows: students } = await query(`
        SELECT id, full_name, email 
        FROM students_data 
        WHERE class_id = $1 AND is_deleted = false
    `, [classId]);
    
    const { rows: teachers } = await query(`
        SELECT td.*, json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) as profiles
        FROM teachers_data td
        JOIN profiles p ON td.id = p.id
        WHERE $1 = ANY(td.class_ids) AND p.is_deleted = false
    `, [classId]);
    
    return { cls, students, teachers };
}

export async function fetchAvailableStudentsAction(schoolId: string) {
    const { rows } = await query(`
        SELECT id, full_name 
        FROM students_data 
        WHERE school_id = $1 AND is_deleted = false
    `, [schoolId]);
    return rows;
}

export async function fetchAvailableTeachersAction(schoolId: string) {
    const role = await queryOne(`SELECT id FROM roles WHERE role_name = 'Teacher'`);
    if (!role) return [];
    
    const { rows } = await query(`
        SELECT id, full_name 
        FROM profiles 
        WHERE school_id = $1 AND role_id = $2 AND is_deleted = false
    `, [schoolId, role.id]);
    return rows;
}
