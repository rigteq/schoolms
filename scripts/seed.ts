import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("Missing DATABASE_URL environment variable.");
    process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
    console.log("🌱 Starting System Seed (Superadmin + 2 Schools + All Staff)...");

    // 1. Fetch Roles
    const { rows: roles } = await pool.query("SELECT * FROM roles");
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
    const passwordHash = await bcrypt.hash(password, 10);

    // Helper to create user (Superadmin/Admin/Teacher)
    const createAuthUser = async (email: string, name: string, roleName: 'Superadmin' | 'Admin' | 'Teacher', schoolId: string | null) => {
        // Check if user already exists
        const { rows: existingUsers } = await pool.query("SELECT id FROM profiles WHERE email = $1", [email]);
        
        let userId: string;

        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            // Update existing user
            await pool.query(
                `UPDATE profiles 
                 SET role_id = $1, school_id = $2, full_name = $3, password_hash = $4, is_deleted = false 
                 WHERE id = $5`,
                [(roleMap as any)[roleName], schoolId, name, passwordHash, userId]
            );
        } else {
            // Insert new user
            const { rows: newUsers } = await pool.query(
                `INSERT INTO profiles (role_id, school_id, full_name, email, password_hash, is_deleted) 
                 VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
                [(roleMap as any)[roleName], schoolId, name, email, passwordHash]
            );
            userId = newUsers[0].id;
        }

        // If Teacher, ensure teacher_data exists
        if (roleName === 'Teacher') {
            const { rows: existingTeacher } = await pool.query("SELECT id FROM teachers_data WHERE id = $1", [userId]);
            if (existingTeacher.length === 0) {
                await pool.query(
                    `INSERT INTO teachers_data (id, class_ids, subject_specialization) VALUES ($1, $2, $3)`,
                    [userId, [], "General"]
                );
            }
        }

        credentialsLog.push(`${roleName}: ${email} / ${password}`);
        return userId;
    };

    try {
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
            let schoolId: string;
            const { rows: existingSchools } = await pool.query("SELECT id FROM schools WHERE school_name = $1", [s.name]);
            
            if (existingSchools.length > 0) {
                schoolId = existingSchools[0].id;
            } else {
                const { rows: newSchools } = await pool.query(
                    `INSERT INTO schools (school_name, address, email, phone) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [s.name, `Address for ${s.name}`, `admin@${s.domain}`, `555-000${sIdx + 1}`]
                );
                schoolId = newSchools[0].id;
            }

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
                const email = `student${i}@${s.domain}`;
                
                const { rows: existingStudents } = await pool.query("SELECT id FROM students_data WHERE email = $1", [email]);
                if (existingStudents.length === 0) {
                    await pool.query(
                        `INSERT INTO students_data (school_id, full_name, email, parent_name, parent_phone) 
                         VALUES ($1, $2, $3, $4, $5)`,
                        [schoolId, sName, email, `Parent of ${sName}`, `555-1234-${i}`]
                    );
                }
            }
        }

        console.log("\n✨ Seed Completed Successfully!");
        console.log("-----------------------------------------");
        console.log("CREDENTIALS SUMMARY:");
        credentialsLog.forEach(line => console.log(line));
        console.log("-----------------------------------------");

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await pool.end();
    }
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
