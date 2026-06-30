"use server";

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
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        const data = await res.json();
        return data;
    } catch (error: any) {
        console.error("Create User Error:", error);
        return { success: false, error: error.message };
    }
}
