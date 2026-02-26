
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
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
    console.log("🌱 Starting system initialization seed...");

    // 0. Verify Connection
    const { error: healthError } = await supabase.from('roles').select('count', { count: 'exact', head: true });
    if (healthError) {
        console.error("❌ Database connection failed:", healthError.message);
        process.exit(1);
    }

    // 1. Fetch Roles
    const { data: roles, error: rolesError } = await supabase.from("roles").select("*");
    if (rolesError || !roles.length) {
        console.error("❌ Roles not found. Run docs.sql first.");
        process.exit(1);
    }

    const roleMap = {
        Teacher: roles.find((r) => r.role_name === "Teacher")?.id,
        Admin: roles.find((r) => r.role_name === "Admin")?.id,
        Superadmin: roles.find((r) => r.role_name === "Superadmin")?.id,
    };

    // Helper to create user (Admin/Teacher/Superadmin)
    const createUser = async (email: string, name: string, roleName: 'Superadmin' | 'Admin' | 'Teacher', schoolId: string | null, extraData: any = {}) => {
        let userId: string | null = null;
        const password = "password2026"; // User's requested password

        const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, school_id: schoolId, role: roleName },
            app_metadata: { role: roleName }
        });

        if (createError) {
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === email);
            if (existing) {
                userId = existing.id;
                await supabase.auth.admin.updateUserById(userId, { password, user_metadata: { full_name: name, school_id: schoolId, role: roleName } });
            } else {
                console.error(`❌ Could not create or find user ${email}:`, createError.message);
                return null;
            }
        } else {
            userId = createdData.user.id;
        }

        if (!userId) return null;

        // Upsert Profile
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: userId,
            role_id: (roleMap as any)[roleName],
            school_id: schoolId,
            full_name: name,
            email: email,
            created_at: new Date().toISOString(),
            is_deleted: false,
            ...extraData.profile
        });

        if (profileError) {
            console.error(`❌ Profile Error for ${name}:`, profileError.message);
            return null;
        }

        return userId;
    };

    // 2. Superadmin
    console.log("👑 Creating Superadmin...");
    await createUser("superadmin@schoolms.com", "System Superadmin", "Superadmin", null);

    // 3. Schools Data
    const schoolsData = [
        {
            name: "Mothers Touch Public School",
            domain: "school.com",
            address: "Main Street, City",
        },
        {
            name: "Springfield High",
            domain: "springfield.edu",
            address: "742 Evergreen Terrace",
        }
    ];

    for (const s of schoolsData) {
        console.log(`\n🏫 Processing School: ${s.name}`);

        // Create/Get School
        let schoolId: string;
        const { data: existingSchool } = await supabase.from("schools").select("id").eq("school_name", s.name).single();
        if (existingSchool) {
            schoolId = existingSchool.id;
        } else {
            const { data: newSchool } = await supabase.from("schools").insert({
                school_name: s.name,
                address: s.address,
                email: `contact@${s.domain}`,
                phone: "555-0100"
            }).select().single();
            schoolId = newSchool!.id;
        }

        // Create 2 Admins
        for (let i = 1; i <= 2; i++) {
            await createUser(`admin${i}@${s.domain}`, `${s.name.split(' ')[0]} Admin ${i}`, "Admin", schoolId);
        }

        // Create 5 Teachers
        const teachers: { id: string, name: string }[] = [];
        const subjects = ["Mathematics", "Science", "History", "English", "Physics"];
        for (let i = 1; i <= 5; i++) {
            const tEmail = `teacher${i}@${s.domain}`;
            const tName = `${s.name.split(' ')[0]} Teacher ${i}`;
            const uid = await createUser(tEmail, tName, "Teacher", schoolId, { profile: { current_address: `${i} Teacher Lane` } });

            if (uid) {
                teachers.push({ id: uid, name: tName });
                await supabase.from("teachers_data").upsert({
                    id: uid,
                    class_ids: [],
                    subject_specialization: subjects[i - 1] || "General"
                });
            }
        }

        // Create Classes (2)
        const classes: { id: string, name: string }[] = [];
        const classNames = ["Grade 10-A", "Grade 10-B"];

        for (let i = 0; i < classNames.length; i++) {
            const cName = classNames[i];
            const teacher = teachers[i];

            const { data: clsData, error: clsError } = await supabase.from("classes").insert({
                school_id: schoolId,
                class_name: cName,
                academic_year: "2025-2026",
                class_teacher_id: teacher?.id || null,
            }).select().single();

            if (clsError) {
                console.error(`❌ Failed to create class ${cName}`, clsError);
                continue;
            }
            classes.push({ id: clsData.id, name: cName });

            if (teacher) {
                const { data: tData } = await supabase.from("teachers_data").select("class_ids").eq("id", teacher.id).single();
                const currentIds = tData?.class_ids || [];
                await supabase.from("teachers_data").update({
                    class_ids: [...currentIds, clsData.id]
                }).eq("id", teacher.id);
            }
        }

        // Create Students (10)
        for (let i = 1; i <= 10; i++) {
            const sName = `${s.name.split(' ')[0]} Student ${i}`;
            const classIndex = i <= 5 ? 0 : 1;
            const assignedClass = classes[classIndex];

            await supabase.from("students_data").insert({
                school_id: schoolId,
                class_id: assignedClass?.id || null,
                full_name: sName,
                email: `student${i}@${s.domain}`,
                current_address: `${i} Student St`,
                parent_name: `Parent of ${sName}`,
                parent_phone: "555-9999"
            });
        }
    }

    console.log("\n✨ Seed Completed Successfully!");
    console.log("Superadmin: superadmin@schoolms.com");
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
