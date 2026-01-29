
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

    // 1. Ensure Roles Exist (from docs.sql, but just in case)
    const { data: roles, error: rolesError } = await supabase.from("roles").select("*");
    if (rolesError || !roles.length) {
        console.error("❌ Roles not found using Service Key. Run docs.sql first.");
        process.exit(1);
    }

    const roleMap = {
        Student: roles.find((r) => r.role_name === "Student")?.id,
        Teacher: roles.find((r) => r.role_name === "Teacher")?.id,
        Admin: roles.find((r) => r.role_name === "Admin")?.id,
        Superadmin: roles.find((r) => r.role_name === "Superadmin")?.id,
    };

    if (!roleMap.Superadmin) {
        console.error("❌ Superadmin role missing.");
        process.exit(1);
    }

    // 2. Create Main School
    const schoolName = "Springfield High";
    let schoolId: string;

    const { data: existingSchool } = await supabase.from("schools").select("id").eq("school_name", schoolName).single();

    if (existingSchool) {
        console.log(`🏫 Found existing school: ${schoolName}`);
        schoolId = existingSchool.id;
    } else {
        const { data: newSchool, error: createSchoolError } = await supabase
            .from("schools")
            .insert({
                school_name: schoolName,
                address: "742 Evergreen Terrace",
                phone: "555-0100",
                email: "admin@springfield.edu",
            })
            .select()
            .single();

        if (createSchoolError) {
            console.error("❌ Failed to create school:", createSchoolError);
            process.exit(1);
        }
        console.log(`✅ Created school: ${schoolName}`);
        schoolId = newSchool.id;
    }

    // 3. Create Users
    const users = [
        {
            email: "superadmin@schoolms.com",
            password: "password123",
            name: "System Superadmin",
            roleName: "Superadmin",
            roleId: roleMap.Superadmin
        },
        {
            email: "admin@springfield.edu",
            password: "password123",
            name: "Springfield Admin",
            roleName: "Admin",
            roleId: roleMap.Admin
        },
        {
            email: "teacher@springfield.edu",
            password: "password123",
            name: "Edna Krabappel",
            roleName: "Teacher",
            roleId: roleMap.Teacher
        },
        {
            email: "student@springfield.edu",
            password: "password123",
            name: "Bart Simpson",
            roleName: "Student",
            roleId: roleMap.Student
        }
    ];

    // Clean up existing auth users with these emails to prevent conflicts
    // Note: We can't easily filter delete by email without ID, so we loop fetch.
    // Given the small number, we just iterate.
    for (const u of users) {
        // Find user by email manually implies listUsers, but let's just try create and handle error?
        // No, cleaner to recreate.
        // We'll search for them in the list.
    }

    // Fetch all users to map emails
    const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailToId = new Map(allAuthUsers?.map(u => [u.email, u.id]));

    for (const u of users) {
        if (emailToId.has(u.email)) {
            const oldId = emailToId.get(u.email);
            await supabase.auth.admin.deleteUser(oldId!);
            console.log(`🗑️  Deleted existing user: ${u.email}`);
        }

        // Create
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.name, role: u.roleName },
            app_metadata: { role: u.roleName }
        });

        if (createError) {
            console.error(`❌ Failed to create ${u.email}:`, createError.message);
            continue;
        }

        const userId = authData.user!.id;

        // Profile
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: userId,
            role_id: u.roleId,
            school_id: schoolId, // Even superadmin gets a "home" school for now
            full_name: u.name,
            email: u.email,
        });

        if (profileError) {
            console.error(`❌ Failed to create profile for ${u.email}:`, profileError);
        } else {
            console.log(`👤 Created user: ${u.email} (${u.roleName})`);
        }

        // Role Data
        if (u.roleName === "Teacher") {
            await supabase.from("teachers_data").upsert({ id: userId, class_ids: [] });
        }
        if (u.roleName === "Student") {
            await supabase.from("students_data").upsert({ id: userId });
        }
    }

    console.log("\n✨ Initialization Complete!");
    console.log("----------------------------------------");
    console.log("Superadmin: superadmin@schoolms.com / password123");
    console.log("Admin:      admin@springfield.edu   / password123");
    console.log("Teacher:    teacher@springfield.edu / password123");
    console.log("Student:    student@springfield.edu / password123");
    console.log("----------------------------------------");
}

main();
