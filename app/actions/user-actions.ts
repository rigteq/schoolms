"use server";

import { query, queryOne } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface CreateUserParams {
    email: string;
    password?: string;
    full_name: string;
    role_name: "Student" | "Teacher" | "Admin" | "Superadmin";
    school_id: string;
    phone?: string;
    address?: string;
    dob?: string;
    class_id?: string;
    subject_name?: string;
}

export async function createUserWithRole(params: CreateUserParams) {
    try {
        const {
            email,
            password,
            full_name,
            role_name,
            school_id,
            phone,
            address,
            dob,
            class_id,
            subject_name,
        } = params;

        // Special handling for Student role (no login/profiles)
        if (role_name === "Student") {
            const result = await query(
                `INSERT INTO students_data (school_id, class_id, full_name, email, phone, current_address, dob)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [school_id, class_id || null, full_name, email, phone || null, address || null, dob || null]
            );
            return { success: true, user_id: result.rows[0].id };
        }

        const role = await queryOne<{id: string}>(`SELECT id FROM roles WHERE role_name = $1`, [role_name]);

        if (!role) {
            throw new Error(`Invalid Role: ${role_name}`);
        }
        const role_id = role.id;

        const tempPassword = password || "tempPassword123";
        const password_hash = await bcrypt.hash(tempPassword, 10);
        const user_id = crypto.randomUUID();

        await query(
            `INSERT INTO profiles (id, role_id, school_id, full_name, email, password_hash, phone, current_address, dob)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [user_id, role_id, school_id, full_name, email, password_hash, phone || null, address || null, dob || null]
        );

        if (role_name === "Teacher") {
            await query(
                `INSERT INTO teachers_data (id, class_ids, subject_specialization)
                 VALUES ($1, $2, $3)`,
                [user_id, [], subject_name || null]
            );
        }

        return { success: true, user_id };

    } catch (error: any) {
        console.error("Create User Error:", error);
        return { success: false, error: error.message };
    }
}
