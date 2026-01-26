-- SCHOOL MANAGEMENT SYSTEM (SchoolMS) - GOLDEN SCHEMA
-- Use this file to reset or set up the database structure in Supabase.

-- ==============================================================================
-- 1. CLEANUP (Removing legacy triggers and tables to ensure a fresh start)
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_on_signup();

DROP TABLE IF EXISTS students_data CASCADE;
DROP TABLE IF EXISTS teachers_data CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- Roles: Defines user hierarchy (Student, Teacher, Admin, Superadmin)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Schools: Multi-tenancy support
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Profiles: The central user identity, linked 1:1 with auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id),
    school_id UUID REFERENCES schools(id),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    dob DATE,
    phone TEXT,
    current_address TEXT,
    permanent_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Classes: Academic groups within a school
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    class_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Teachers Data: Extension table for Teacher-specific info
CREATE TABLE teachers_data (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    subject_name TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Students Data: Extension table for Student-specific info
CREATE TABLE students_data (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ==============================================================================
-- 3. INDICES & DATA SEEDING
-- ==============================================================================
CREATE INDEX idx_profiles_school ON profiles(school_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_classes_school ON classes(school_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_profiles_role ON profiles(role_id);

INSERT INTO roles (role_name) VALUES ('Student'), ('Teacher'), ('Admin'), ('Superadmin');

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for Initial Rollout)
CREATE POLICY "Public read roles" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read schools" ON schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read classes" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read teachers" ON teachers_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read students" ON students_data FOR SELECT TO authenticated USING (true);

-- User Update Policy
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ==============================================================================
-- 5. NEXT STEPS
-- ==============================================================================
-- 1. Run this entire script in Supabase SQL Editor.
-- 2. Run 'npx tsx scripts/seed.ts' in your terminal to create:
--    - School: Springfield High
--    - Users: student_demo@test.com, teacher_demo@test.com, etc.
