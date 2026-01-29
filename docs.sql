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
    role_name TEXT UNIQUE NOT NULL, -- 'Superadmin', 'Admin', 'Teacher', 'Student'
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

-- Students Data: Extension table
CREATE TABLE students_data (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
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

INSERT INTO roles (role_name) VALUES ('Superadmin'), ('Admin'), ('Teacher'), ('Student');

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==============================================================================

-- Helper to safely get current user's role name
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT r.role_name INTO v_role
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to safely get current user's school_id
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM profiles
  WHERE id = auth.uid();
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = students_data.id AND p.school_id = public.get_my_school_id()
    ) 
    AND public.get_my_role() = 'Admin'
);

CREATE POLICY "Teacher manage school students_data" ON students_data FOR ALL TO authenticated
USING ( 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = students_data.id AND p.school_id = public.get_my_school_id()
    ) 
    AND public.get_my_role() = 'Teacher'
);

CREATE POLICY "Users view school students_data" ON students_data FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = students_data.id AND p.school_id = public.get_my_school_id()
    )
);
