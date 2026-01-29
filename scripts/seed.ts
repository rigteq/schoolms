
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
        Student: roles.find((r) => r.role_name === "Student")?.id,
        Teacher: roles.find((r) => r.role_name === "Teacher")?.id,
        Admin: roles.find((r) => r.role_name === "Admin")?.id,
        Superadmin: roles.find((r) => r.role_name === "Superadmin")?.id,
    };

    // Helper to create user
    const createUser = async (email: string, name: string, roleName: 'Superadmin' | 'Admin' | 'Teacher' | 'Student', schoolId: string | null, extraData: any = {}) => {
        // Check if user exists (by email) and delete if so to ensure fresh seed
        // Note: In production, never do this. This is for dev seeding.
        // Optimization: List users is slow. We'll try to delete by ID if we mapped them, 
        // but for reliability here we'll search by email first.

        // This part is tricky without exact ID. 
        // We will just try to create. If email taken, we skip or we logic-delete?
        // Let's assume the user might exist.
        // Ideally we should have deleted all users before running this script via SQL, but let's try to handle it.

        // Find user by email
        // We can't use 'eq' on auth.users via client directly easily without admin api list.
        // We will skip delete logic per-user and rely on unique constraints failing or previous cleanup.
        // Actually, let's just use upsert logic for profiles, but auth users need to be created.

        // Clean way: Try create. If error "User already registered", fetch ID.
        let userId: string | null = null;

        const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: "password123",
            email_confirm: true,
            user_metadata: { full_name: name, role: roleName },
            app_metadata: { role: roleName }
        });

        if (createError) {
            // If user exists, try to find their ID from profiles?? No profiles might be gone.
            // We need to list users filters by email?
            // supabase.auth.admin.listUsers() doesn't support filter by email directly in JS lib v2 usually easily?
            // Actually `listUsers` has generic support.
            // Let's just try to delete ALL users at start of script? No, that's dangerous if run in wrong env.
            // Let's just log and continue if exists, assuming we update profile.
            // But we need the ID.

            // Getting ID for existing user:
            // This is slow but works for seed.
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === email);
            if (existing) {
                userId = existing.id;
                // Update password to be sure?
                await supabase.auth.admin.updateUserById(userId, { password: "password123", user_metadata: { full_name: name, role: roleName } });
            } else {
                console.error(`❌ Could not create or find user ${email}`, createError);
                return null;
            }
        } else {
            userId = createdData.user.id;
        }

        if (!userId) return null;

        // Upsert Profile
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: userId,
            role_id: roleMap[roleName],
            school_id: schoolId,
            full_name: name,
            email: email,
            created_at: new Date().toISOString(),
            is_deleted: false,
            ...extraData.profile // e.g. address
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
            name: "Springfield High",
            domain: "springfield.edu",
            address: "742 Evergreen Terrace",
            adminName: "Springfield Admin",
        },
        {
            name: "Riverside High",
            domain: "riverside.edu",
            address: "123 River Road",
            adminName: "Riverside Admin",
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

        // Create Admin
        await createUser(`admin@${s.domain}`, s.adminName, "Admin", schoolId);

        // Create Teachers (2)
        const teachers: { id: string, name: string }[] = [];
        for (let i = 1; i <= 2; i++) {
            const tEmail = `teacher${i}@${s.domain}`;
            const tName = `${s.name.split(' ')[0]} Teacher ${i}`;
            const uid = await createUser(tEmail, tName, "Teacher", schoolId, { profile: { current_address: `${i} Teacher Lane` } });

            if (uid) {
                teachers.push({ id: uid, name: tName });
                // Upsert Teachers Data (initially empty class_ids)
                await supabase.from("teachers_data").upsert({
                    id: uid,
                    class_ids: [],
                    subject_specialization: i === 1 ? "Mathematics" : "Science"
                });
            }
        }

        // Create Classes (2)
        const classes: { id: string, name: string }[] = [];
        const classNames = ["Grade 10-A", "Grade 10-B"];

        for (let i = 0; i < classNames.length; i++) {
            const cName = classNames[i];
            const teacher = teachers[i]; // Assign teacher 0 to class 0, teacher 1 to class 1

            // Create Class
            const { data: clsData, error: clsError } = await supabase.from("classes").insert({
                school_id: schoolId,
                class_name: cName,
                academic_year: "2025-2026",
                class_teacher_id: teacher?.id || null, // FK to profiles
            }).select().single();

            if (clsError) {
                console.error(`❌ Failed to create class ${cName}`, clsError);
                continue;
            }
            classes.push({ id: clsData.id, name: cName });

            // Update Teacher's Data with this class ID
            if (teacher) {
                // Get current
                const { data: tData } = await supabase.from("teachers_data").select("class_ids").eq("id", teacher.id).single();
                const currentIds = tData?.class_ids || [];
                await supabase.from("teachers_data").update({
                    class_ids: [...currentIds, clsData.id]
                }).eq("id", teacher.id);
            }
        }

        // Create Students (10)
        // 5 in each class
        for (let i = 1; i <= 10; i++) {
            const sEmail = `student${i}@${s.domain}`;
            const sName = `${s.name.split(' ')[0]} Student ${i}`;
            const uid = await createUser(sEmail, sName, "Student", schoolId, { profile: { current_address: `${i} Student St` } });

            if (uid) {
                // Determine Class (1-5 -> Class 0, 6-10 -> Class 1)
                const classIndex = i <= 5 ? 0 : 1;
                const assignedClass = classes[classIndex];

                await supabase.from("students_data").upsert({
                    id: uid,
                    class_id: assignedClass?.id || null,
                    parent_name: `Parent of ${sName}`,
                    parent_phone: "555-9999"
                });
            }
        }
    }

    console.log("\n✨ Seed Completed Successfully!");
    console.log("Superadmin: superadmin@schoolms.com");
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
