
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    console.log("🌱 Starting detailed dummy data seed...");

    // 0. Verify connection
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (listError) {
        console.error("❌ Critical Error: Unable to connect/list users. Check keys.");
        process.exit(1);
    }
    console.log("✅ Connection verified.");

    // 1. Fetch Roles
    const { data: roles } = await supabase.from("roles").select("*");
    if (!roles || roles.length === 0) {
        console.error("❌ No roles found in DB. Run migration first.");
        process.exit(1);
    }

    const roleMap = {
        Student: roles.find((r) => r.role_name === "Student")?.id,
        Teacher: roles.find((r) => r.role_name === "Teacher")?.id,
        Admin: roles.find((r) => r.role_name === "Admin")?.id,
    };

    if (!roleMap.Student || !roleMap.Teacher || !roleMap.Admin) {
        console.error("❌ Missing required roles (Student, Teacher, Admin).");
        process.exit(1);
    }

    const schoolsData = [
        { name: "Greenwood High", suffix: "greenwood" },
        { name: "Riverside Academy", suffix: "riverside" },
        { name: "Oak Valley School", suffix: "oakvalley" },
        { name: "Northstar Institute", suffix: "northstar" },
        { name: "Sunnydale Elementary", suffix: "sunnydale" },
    ];

    // Helper to process a user creation
    const createUser = async (email: string, password: string, name: string, roleName: "Student" | "Teacher" | "Admin", schoolId: string) => {
        // Check if user exists (to delete and recreate, or skip)
        // For efficiency in this large seed, we might just try create and catch error, 
        // but 'delete if exists' is cleaner for reset. 
        // However, fetching one-by-one is slow.
        // We'll try to find by email first.

        // Note: listUsers is simpler but rate limited. 
        // We will try to create. If it fails due to existing, we delete and recreate.

        let userId: string | undefined;

        // Try to get user by email directly (not officially supported by admin api easily without listing, but we can list with filter)
        // But supabase-js admin doesn't support filter by email well in all versions. 
        // We'll use the "create -> fail -> delete -> create" flow or "list -> find".
        // Let's rely on listUsers searching (slow) or just assume clean slate? 
        // Let's try to delete blindly first? No, we need ID to delete.
        // Let's try creating.

        // Check if exists
        // Iterate through all users is too slow for 135 users if we do it every time.
        // We'll trust the "catch error" approach or just try to delete using a known ID approach if we could, but we can't key off email for delete.

        // BETTER APPROACH:
        // We'll build a list of emails we intend to create, fetch all current users, identify which ones to delete.

        return { email, password, name, roleName, schoolId };
    };

    const targetUsers: any[] = [];

    // Prepare data structures
    for (const s of schoolsData) {
        // Admin
        for (let i = 1; i <= 2; i++) {
            targetUsers.push({
                email: `admin${i}@${s.suffix}.edu`,
                password: "password123",
                name: `Admin ${i} ${s.name}`,
                role: "Admin",
                roleId: roleMap.Admin,
                schoolName: s.name,
                schoolSuffix: s.suffix
            });
        }
        // Teachers
        for (let i = 1; i <= 5; i++) {
            targetUsers.push({
                email: `teacher${i}@${s.suffix}.edu`,
                password: "password123",
                name: `Teacher ${i} ${s.name}`,
                role: "Teacher",
                roleId: roleMap.Teacher,
                schoolName: s.name,
                schoolSuffix: s.suffix
            });
        }
        // Students
        for (let i = 1; i <= 20; i++) {
            targetUsers.push({
                email: `student${i}@${s.suffix}.edu`,
                password: "password123",
                name: `Student ${i} ${s.name}`,
                role: "Student",
                roleId: roleMap.Student,
                schoolName: s.name,
                schoolSuffix: s.suffix
            });
        }
    }

    console.log(`📋 Prepared ${targetUsers.length} users to seed across ${schoolsData.length} schools.`);

    // 2. Pre-fetch existing users to minimize API calls
    console.log("Fetching existing users cleanup...");
    let allExistingUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error || !users || users.length === 0) {
            hasMore = false;
        } else {
            allExistingUsers = [...allExistingUsers, ...users];
            page++;
        }
    }

    // Map existing emails to IDs
    const emailToIdMap = new Map(allExistingUsers.map(u => [u.email, u.id]));

    // 3. Process each School
    for (const s of schoolsData) {
        console.log(`\n🏫 Processing School: ${s.name}...`);

        // Create or Get School
        let schoolId: string | null = null;

        // Try to find existing school to avoid duplicates if re-run
        const { data: existingSchool } = await supabase
            .from("schools")
            .select("id")
            .eq("school_name", s.name)
            .single();

        if (existingSchool) {
            schoolId = existingSchool.id;
        } else {
            const { data: newSchool, error: schoolError } = await supabase
                .from("schools")
                .insert({
                    school_name: s.name,
                    address: "123 Seed Street",
                    phone: "555-0000",
                    email: `info@${s.suffix}.edu`
                })
                .select()
                .single();

            if (schoolError) {
                console.error(`Error creating school ${s.name}:`, schoolError);
                continue;
            }
            schoolId = newSchool.id;
        }

        if (!schoolId) {
            console.error(`Could not resolve ID for school ${s.name}`);
            continue;
        }

        // Filter users for this school
        const schoolUsers = targetUsers.filter(u => u.schoolName === s.name);

        for (const u of schoolUsers) {
            // Delete if exists
            if (emailToIdMap.has(u.email)) {
                const oldId = emailToIdMap.get(u.email);
                await supabase.auth.admin.deleteUser(oldId!);
                emailToIdMap.delete(u.email); // remove from map so we don't try again
            }

            // Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true,
                user_metadata: { full_name: u.name, role: u.role },
                app_metadata: { role: u.role }
            });

            if (authError) {
                console.error(`  ❌ Failed auth: ${u.email} - ${authError.message}`);
                continue;
            }

            const userId = authData.user?.id;
            if (!userId) continue;

            // Create Profile
            const { error: profileError } = await supabase.from("profiles").upsert({
                id: userId,
                role_id: u.roleId,
                school_id: schoolId,
                full_name: u.name,
                email: u.email,
            });

            if (profileError) {
                console.error(`  ❌ Failed profile: ${u.email}`, profileError);
            } else {
                // process.stdout.write("."); // Simplified progress
            }

            // Role specific data
            if (u.role === "Teacher") {
                await supabase.from("teachers_data").upsert({
                    id: userId,
                    class_ids: [] // Initialize with empty array
                });
            }
            if (u.role === "Student") {
                await supabase.from("students_data").upsert({ id: userId });
            }
        }
        console.log(`  ✅ Done with ${s.name} (${schoolUsers.length} users)`);
    }

    console.log("\n✨ Seed dummy data complete!");
}

main();
