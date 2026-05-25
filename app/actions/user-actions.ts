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
    // Extended student fields
    form_submitted_date?: string;
    aadhar_number?: string;
    mother_name?: string;
    father_name?: string;
    last_institution?: string;
    last_institution_class?: string;
    last_institution_section?: string;
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
            form_submitted_date,
            aadhar_number,
            mother_name,
            father_name,
            last_institution,
            last_institution_class,
            last_institution_section,
        } = params;

        // Special handling for Student role (no auth login / profiles table)
        if (role_name === "Student") {
            const { data: studentData, error: studentError } = await supabaseAdmin
                .from("students_data")
                .insert({
                    school_id,
                    class_id: class_id || null,
                    full_name,
                    email: email || null,
                    phone: phone || null,
                    current_address: address || null,
                    dob: dob || null,
                    form_submitted_date: form_submitted_date || null,
                    aadhar_number: aadhar_number || null,
                    mother_name: mother_name || null,
                    father_name: father_name || null,
                    last_institution: last_institution || null,
                    last_institution_class: last_institution_class || null,
                    last_institution_section: last_institution_section || null,
                })
                .select("id")
                .single();

            if (studentError) throw new Error(`Student creation failed: ${studentError.message}`);
            return { success: true, user_id: studentData.id };
        }

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
            phone: phone || null,
            current_address: address || null,
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

        return { success: true, user_id };

    } catch (error: any) {
        console.error("Create User Error:", error);
        return { success: false, error: error.message };
    }
}
