import { Pool } from "pg";
import dotenv from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
        Teacher: roles.find((r: any) => r.role_name === "Teacher")?.id,
        Admin: roles.find((r: any) => r.role_name === "Admin")?.id,
        Superadmin: roles.find((r: any) => r.role_name === "Superadmin")?.id,
    };

    const credentialsLog: string[] = [];
    const password = "password2026";
    const password_hash = await bcrypt.hash(password, 10);

    // Helper to create user
    const createAuthUser = async (email: string, name: string, roleName: 'Superadmin' | 'Admin' | 'Teacher', schoolId: string | null) => {
        try {
            // Check if exists
            const { rows: existing } = await pool.query("SELECT id FROM profiles WHERE email = $1", [email]);
            let userId: string;
            
            if (existing.length > 0) {
                userId = existing[0].id;
                // Update password and profile
                await pool.query(
                    "UPDATE profiles SET password_hash = $1, full_name = $2, role_id = $3, school_id = $4 WHERE id = $5",
                    [password_hash, name, (roleMap as any)[roleName], schoolId, userId]
                );
            } else {
                userId = crypto.randomUUID();
                await pool.query(
                    `INSERT INTO profiles (id, role_id, school_id, full_name, email, password_hash, created_at, is_deleted)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
                    [userId, (roleMap as any)[roleName], schoolId, name, email, password_hash]
                );

                if (roleName === 'Teacher') {
                    await pool.query(
                        `INSERT INTO teachers_data (id, class_ids, subject_specialization) VALUES ($1, $2, $3)`,
                        [userId, [], "General"]
                    );
                }
            }

            credentialsLog.push(`${roleName}: ${email} / ${password}`);
            return userId;
        } catch (error: any) {
            console.error(`❌ Error creating user ${email}:`, error.message);
            return null;
        }
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

        let schoolId: string;
        try {
            const { rows: existingSchool } = await pool.query("SELECT id FROM schools WHERE school_name = $1", [s.name]);
            if (existingSchool.length > 0) {
                schoolId = existingSchool[0].id;
            } else {
                const { rows: newSchool } = await pool.query(
                    `INSERT INTO schools (school_name, address, email, phone) VALUES ($1, $2, $3, $4) RETURNING id`,
                    [s.name, `Address for ${s.name}`, `admin@${s.domain}`, `555-000${sIdx + 1}`]
                );
                schoolId = newSchool[0].id;
            }
        } catch (err: any) {
             console.error(`❌ Failed to create/get school ${s.name}:`, err.message);
             continue;
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
            try {
                const { rows: existingStudent } = await pool.query("SELECT id FROM students_data WHERE email = $1", [`student${i}@${s.domain}`]);
                if (existingStudent.length === 0) {
                     await pool.query(
                        `INSERT INTO students_data (school_id, full_name, email, parent_name, parent_phone) VALUES ($1, $2, $3, $4, $5)`,
                        [schoolId, sName, `student${i}@${s.domain}`, `Parent of ${sName}`, `555-1234-${i}`]
                    );
                }
            } catch (err: any) {
                console.error(`❌ Failed to create student ${sName}:`, err.message);
            }
        }
    }

    console.log("\n✨ Seed Completed Successfully!");
    console.log("-----------------------------------------");
    console.log("CREDENTIALS SUMMARY:");
    credentialsLog.forEach(line => console.log(line));
    console.log("-----------------------------------------");
    
    await pool.end();
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
