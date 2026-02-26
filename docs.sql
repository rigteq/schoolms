-- SCHOOL MANAGEMENT SYSTEM (SchoolMS) - REVISED GOLDEN SCHEMA
-- Use this file to completely reset the database structure.
-- RUN THIS IN SUPABASE SQL EDITOR

-- ==============================================================================
-- 1. CLEANUP (Strict Tear Down)
-- ==============================================================================
-- WARNING: This deletes ALL users authentication data.
DELETE FROM auth.users;

-- Disable RLS momentarily to ensure clean drops if needed, though CASCADE handles it.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_school_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP TABLE IF EXISTS leave_details CASCADE;
DROP TABLE IF EXISTS students_data CASCADE;
DROP TABLE IF EXISTS teachers_data CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- Roles: Defines user hierarchy
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL, -- 'Superadmin', 'Admin', 'Teacher'
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

-- Profiles: Central user identity
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
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
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    class_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Using profiles(id) as teachers_data is 1:1 with profiles basically
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Teachers Data: Extension table (Modified for multiple classes)
CREATE TABLE teachers_data (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    class_ids UUID[], -- Array of Class IDs
    subject_specialization TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Students Data: Standalone table (No auth login)
CREATE TABLE students_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    dob DATE,
    phone TEXT,
    current_address TEXT,
    permanent_address TEXT,
    parent_name TEXT,
    parent_phone TEXT,
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
CREATE INDEX idx_profiles_email ON profiles(email);

INSERT INTO roles (role_name) VALUES ('Superadmin'), ('Admin'), ('Teacher');

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==============================================================================

-- Helper to safely get current user's role name from JWT metadata
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$ LANGUAGE sql STABLE;

-- Helper to safely get current user's school_id from JWT metadata
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'school_id')::UUID;
$$ LANGUAGE sql STABLE;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_data ENABLE ROW LEVEL SECURITY;

-- Polices

-- ROLES: Everyone can read roles
CREATE POLICY "Public read roles" ON roles FOR SELECT TO authenticated USING (true);

-- SCHOOLS:
-- Superadmin: Full access
-- Others: Read-only for their own school
CREATE POLICY "Superadmin manage schools" ON schools FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Users view own school" ON schools FOR SELECT TO authenticated
USING ( id = public.get_my_school_id() );

-- PROFILES:
-- Superadmin: Full access
-- Admin: View/Edit profiles in their school
-- Teacher: View profiles in their school (Students/Teachers) - limited edit?
-- Student: View profiles in their school (limited?)
-- Self: Update own profile
-- For Simplicity & Scope: Admin sees all in school. Teacher/Student see all in school (Directory).
CREATE POLICY "Superadmin manage profiles" ON profiles FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Admin manage school profiles" ON profiles FOR ALL TO authenticated
USING ( 
    public.get_my_role() = 'Admin' 
    AND school_id = public.get_my_school_id() 
);

CREATE POLICY "Users view school profiles" ON profiles FOR SELECT TO authenticated
USING ( school_id = public.get_my_school_id() );

-- CLASSES:
-- Superadmin: All
-- Admin: Manage own school
-- Teacher/Student: View own school
CREATE POLICY "Superadmin manage classes" ON classes FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Admin manage school classes" ON classes FOR ALL TO authenticated
USING ( 
    public.get_my_role() = 'Admin' 
    AND school_id = public.get_my_school_id() 
);

CREATE POLICY "Users view school classes" ON classes FOR SELECT TO authenticated
USING ( school_id = public.get_my_school_id() );

-- TEACHERS DATA:
-- Superadmin: All
-- Admin: Manage own school
-- Teacher: View own school (or just self?) -> Let's say View all teachers in school
CREATE POLICY "Superadmin manage teachers_data" ON teachers_data FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Admin manage school teachers_data" ON teachers_data FOR ALL TO authenticated
USING ( 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = teachers_data.id AND p.school_id = public.get_my_school_id()
    ) 
    AND public.get_my_role() = 'Admin'
);

CREATE POLICY "Users view school teachers_data" ON teachers_data FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = teachers_data.id AND p.school_id = public.get_my_school_id()
    )
);

-- STUDENTS DATA:
-- Superadmin: All
-- Admin: Manage own school
-- Teacher: Manage own school (Teachers often assign classes/grades, so they might need edit rights?)
-- For logic: Teachers can Edit Students in their school? Or just View?
-- Let's give Teachers EDIT rights on students_data for now (e.g. updating parent info).
CREATE POLICY "Superadmin manage students_data" ON students_data FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Admin manage school students_data" ON students_data FOR ALL TO authenticated
USING ( 
    school_id = public.get_my_school_id() 
    AND public.get_my_role() = 'Admin'
);

CREATE POLICY "Teacher manage school students_data" ON students_data FOR ALL TO authenticated
USING ( 
    school_id = public.get_my_school_id() 
    AND public.get_my_role() = 'Teacher'
);

CREATE POLICY "Users view school students_data" ON students_data FOR SELECT TO authenticated
USING (
    school_id = public.get_my_school_id()
);

-- ==============================================================================
-- 5. LEAVE MANAGEMENT
-- ==============================================================================

CREATE TABLE leave_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_type TEXT CHECK (leave_type IN ('global', 'lwp', 'sl', 'cl', 'el')),
    leave_date_from DATE NOT NULL,
    leave_date_to DATE NOT NULL,
    leave_comment TEXT,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_time TIMESTAMPTZ DEFAULT NOW(),
    edited_time TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_leave_details_school ON leave_details(school_id);
CREATE INDEX idx_leave_details_profile ON leave_details(profile_id);
CREATE INDEX idx_leave_details_dates ON leave_details(leave_date_from, leave_date_to);

-- RLS Policies
ALTER TABLE leave_details ENABLE ROW LEVEL SECURITY;

-- 1. Superadmin: Full Access
CREATE POLICY "Superadmin manage leaves" ON leave_details FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

-- 2. Admin: 
--    - View all leaves in their school
--    - Create Global holidays (leave_type = 'global')
--    - Approve/Reject leaves (Update status)
--    - Create their own leaves? (prompt says "Apply leave" in Admin dashboard too)
CREATE POLICY "Admin manage school leaves" ON leave_details FOR ALL TO authenticated
USING ( 
    school_id = public.get_my_school_id() 
    AND public.get_my_role() = 'Admin'
);

-- 3. Teacher/Student:
--    - View their own leaves
--    - View Global holidays (leave_type = 'global' AND school_id = my_school)
--    - Create their own leaves
CREATE POLICY "Users view own leaves and globals" ON leave_details FOR SELECT TO authenticated
USING (
    (profile_id = auth.uid()) OR 
    (leave_type = 'global' AND school_id = public.get_my_school_id())
);

CREATE POLICY "Users create own leaves" ON leave_details FOR INSERT TO authenticated
WITH CHECK (
    profile_id = auth.uid() AND
    school_id = public.get_my_school_id() AND
    leave_type != 'global' -- Regular users can't create global holidays
);

-- Allow users to update their own PENDING leaves? Or only Admin updates status?
-- Usually users can cancel/edit pending leaves. 
-- For now, let's restrict update to Admin (for status) and maybe owner if pending?
-- Prompt implies Admin approves/rejects. 
-- Let's allow users to edit their own leaves if pending, but maybe keep it simple for now as per prompt "Admin... show approve,reject button".
-- I will stick to Admin managing it. If user needs to edit, they might need to delete and re-apply or we add logic later. 
-- Wait, if an Admin applies for leave, who approves? Self-approval? The prompt defaults Admin leaves to 'approved'.
-- So Admins can INSERT with status='approved'.
-- Regular users INSERT with status='pending'.

-- We need a policy for Update.
CREATE POLICY "Users update own pending leaves" ON leave_details FOR UPDATE TO authenticated
USING (
    profile_id = auth.uid() AND status = 'pending'
);
