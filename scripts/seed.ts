import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    console.log("🌱 Starting System Seed (Superadmin + 2 Schools + All Staff)...");

    // 1. Fetch Roles
    const { data: roles, error: rolesError } = await supabase.from("roles").select("*");
    if (rolesError) {
        console.error("❌ Roles query error:", rolesError.message);
        process.exit(1);
    }
    if (!roles || !roles.length) {
        console.error("❌ Roles table is empty. Please run docs.sql first.");
        process.exit(1);
    }

    const roleMap = {
        Teacher: roles.find((r) => r.role_name === "Teacher")?.id,
        Admin: roles.find((r) => r.role_name === "Admin")?.id,
        Superadmin: roles.find((r) => r.role_name === "Superadmin")?.id,
    };

    const credentialsLog: string[] = [];
    const password = "password2026";

    // Helper to create user (Superadmin/Admin/Teacher)
    const createAuthUser = async (email: string, name: string, roleName: 'Superadmin' | 'Admin' | 'Teacher', schoolId: string | null) => {
        const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, school_id: schoolId, role: roleName },
            app_metadata: { role: roleName }
        });

        let userId: string;
        if (createError) {
            if (createError.message.includes("already registered") || createError.message.includes("already exists")) {
                const { data: { users } } = await supabase.auth.admin.listUsers();
                const existing = users.find(u => u.email === email);
                if (existing) {
                    userId = existing.id;
                    await supabase.auth.admin.updateUserById(userId, {
                        password,
                        user_metadata: { full_name: name, school_id: schoolId, role: roleName },
                        app_metadata: { role: roleName }
                    });
                } else {
                    console.error(`❌ Could not find existing user ${email}`);
                    return null;
                }
            } else {
                console.error(`❌ Error creating user ${email}:`, createError.message);
                return null;
            }
        } else {
            userId = createdData.user.id;
        }

        // Upsert Profile
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: userId,
            role_id: (roleMap as any)[roleName],
            school_id: schoolId,
            full_name: name,
            email: email,
            created_at: new Date().toISOString(),
            is_deleted: false,
        });

        if (profileError) {
            console.error(`❌ Profile Error for ${name}:`, profileError.message);
            return null;
        }

        if (roleName === 'Teacher') {
            await supabase.from("teachers_data").upsert({
                id: userId,
                class_ids: [],
                subject_specialization: "General"
            });
        }

        credentialsLog.push(`${roleName}: ${email} / ${password}`);
        return userId;
    };

    // 2. Create Superadmin
    console.log("👑 Creating Superadmin...");
    await createAuthUser("superadmin@schoolms.com", "System Superadmin", "Superadmin", null);

    // 3. Create Schools and Staff
    const schools = [
        { name: "Global International School", domain: "global.edu" },
        { name: "Heritage Public School", domain: "heritage.org" }
    ];

    for (let sIdx = 0; sIdx < schools.length; sIdx++) {
        const s = schools[sIdx];
        console.log(`\n🏫 Creating School: ${s.name}`);

        // Create/Get School
        const { data: newSchool, error: schoolError } = await supabase.from("schools").upsert({
            school_name: s.name,
            address: `Address for ${s.name}`,
            email: `admin@${s.domain}`,
            phone: `555-000${sIdx + 1}`
        }, { onConflict: 'school_name' }).select().single();

        if (schoolError || !newSchool) {
            console.error(`❌ Failed to create/get school ${s.name}:`, schoolError?.message);
            continue;
        }
        const schoolId = newSchool.id;

        // Create 2 Admins
        for (let i = 1; i <= 2; i++) {
            await createAuthUser(`admin${i}@${s.domain}`, `${s.name} Admin ${i}`, "Admin", schoolId);
        }

        // Create 2 Teachers
        for (let i = 1; i <= 2; i++) {
            await createAuthUser(`teacher${i}@${s.domain}`, `${s.name} Teacher ${i}`, "Teacher", schoolId);
        }

        // Create 4 Students (No Auth)
        for (let i = 1; i <= 4; i++) {
            const sName = `${s.name} Student ${i}`;
            const { error: studentError } = await supabase.from("students_data").insert({
                school_id: schoolId,
                full_name: sName,
                email: `student${i}@${s.domain}`,
                parent_name: `Parent of ${sName}`,
                parent_phone: `555-1234-${i}`
            });
            if (studentError) {
                console.error(`❌ Failed to create student ${sName}:`, studentError.message);
            }
        }
    }

    console.log("\n✨ Seed Completed Successfully!");
    console.log("-----------------------------------------");
    console.log("CREDENTIALS SUMMARY:");
    credentialsLog.forEach(line => console.log(line));
    console.log("-----------------------------------------");
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
