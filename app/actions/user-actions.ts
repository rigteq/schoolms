"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

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

        const { data: roleData, error: roleError } = await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("role_name", role_name)
            .single();

        if (roleError || !roleData) {
            throw new Error(`Invalid Role: ${role_name}`);
        }
        const role_id = roleData.id;

        const tempPassword = password || "tempPassword123";

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name, school_id, role: role_name },
            app_metadata: { role: role_name },
        });

        if (authError) throw authError;
        const user_id = authData.user.id;

        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: user_id,
            role_id,
            school_id,
            full_name,
            email,
            phone,
            current_address: address,
            dob: dob || null,
        });

        if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        if (role_name === "Teacher") {
            const { error: teacherError } = await supabaseAdmin.from("teachers_data").insert({
                id: user_id,
                class_ids: [],
                subject_specialization: subject_name || null,
            });
            if (teacherError) throw new Error(`Teacher data creation failed: ${teacherError.message}`);
        }

        if (role_name === "Student") {
            const { error: studentError } = await supabaseAdmin.from("students_data").insert({
                id: user_id,
                class_id: class_id || null,
            });
            if (studentError) throw new Error(`Student data creation failed: ${studentError.message}`);
        }

        return { success: true, user_id };

    } catch (error: any) {
        console.error("Create User Error:", error);
        return { success: false, error: error.message };
    }
}
