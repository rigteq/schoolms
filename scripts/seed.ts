
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

// Basic format check for Service Role Key (should be a JWT starting with 'ey')
if (!supabaseServiceKey.startsWith("ey")) {
    console.warn("⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY does not start with 'ey'.");
    console.warn("   It looks like you might be using a 'sb_secret_...' or 'sb_publishable_...' token.");
    console.warn("   The Service Role Key MUST be the JWT Secret found in Supabase Dashboard > Project Settings > API > Service Role Key.");
    console.warn("   Using an invalid key will cause 'Database error' or network failures.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    console.log("🌱 Starting database seed...");

    // Test Admin Access
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("❌ Critical Error: Unable to list users. Check your Service Role Key.");
        console.error("Error Detail:", JSON.stringify(listError, null, 2));
        process.exit(1);
    } else {
        console.log(`✅ Admin Access Verified. Found ${userList.users.length} existing users.`);
    }

    // 1. Create School
    const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
            school_name: "Springfield High",
            address: "742 Evergreen Terrace",
            phone: "555-0100",
            email: "info@springfield.edu",
        })
        .select()
        .single();

    // ... (rest of the script)

    if (schoolError) {
        console.error("Error creating school:", schoolError);
        // Don't exit, maybe it already exists
    }

    let schoolId = school?.id;
    if (!schoolId) {
        console.log("Could not get school ID, trying to fetch existing...");
        const { data: existingSchool } = await supabase.from("schools").select("id").eq("school_name", "Springfield High").single();
        if (existingSchool) {
            console.log("Found existing school.");
            schoolId = existingSchool.id;
        } else {
            console.error("Failed to get school.");
            process.exit(1);
        }
    }

    // 2. Fetch Roles
    const { data: roles } = await supabase.from("roles").select("*");
    const studentRoleId = roles?.find((r) => r.role_name === "Student")?.id;
    const teacherRoleId = roles?.find((r) => r.role_name === "Teacher")?.id;
    const adminRoleId = roles?.find((r) => r.role_name === "Admin")?.id;
    const superadminRoleId = roles?.find((r) => r.role_name === "Superadmin")?.id;

    if (!studentRoleId || !teacherRoleId || !adminRoleId || !superadminRoleId) {
        console.error("Roles not found. Please run SQL migration first.");
        process.exit(1);
    }

    const users = [
        { email: "student_demo@test.com", password: "password123", roleId: studentRoleId, name: "Student User", roleName: "Student" },
        { email: "teacher_demo@test.com", password: "password123", roleId: teacherRoleId, name: "Teacher User", roleName: "Teacher" },
        { email: "admin_demo@test.com", password: "password123", roleId: adminRoleId, name: "Admin User", roleName: "Admin" },
        { email: "superadmin_demo@test.com", password: "password123", roleId: superadminRoleId, name: "Super Admin", roleName: "Superadmin" },
    ];

    // 3. Fetch ALL users to clean up
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users: pageUsers }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error || !pageUsers || pageUsers.length === 0) {
            hasMore = false;
        } else {
            allUsers = [...allUsers, ...pageUsers];
            page++;
        }
    }

    for (const u of users) {
        // Try to find and delete existing
        const existingUser = allUsers.find(user => user.email === u.email);
        if (existingUser) {
            console.log(`User ${u.email} exists (ID: ${existingUser.id}), deleting...`);
            await supabase.auth.admin.deleteUser(existingUser.id);
        }

        // Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.name, role: u.roleName },
            app_metadata: { role: u.roleName }
        });

        if (authError) {
            console.error(`❌ Failed to create auth user ${u.email}`);
            console.error("Error Details:", JSON.stringify(authError, null, 2));
            continue;
        }

        const userId = authData.user?.id;

        if (userId && schoolId) {
            // Create Profile
            const { error: profileError } = await supabase.from("profiles").upsert({
                id: userId,
                role_id: u.roleId,
                school_id: schoolId,
                full_name: u.name,
                email: u.email,
            });

            if (profileError) {
                console.error(`Error creating profile for ${u.email}:`, profileError);
            } else {
                console.log(`✅ Created ${u.roleName}: ${u.email}`);
            }

            // Link Role Specific Data
            if (u.roleName === "Teacher") {
                await supabase.from("teachers_data").upsert({
                    id: userId,
                    class_ids: []
                });
            }
            if (u.roleName === "Student") {
                await supabase.from("students_data").upsert({ id: userId });
            }
        }
    }

    console.log("Seed complete.");
}

main();
