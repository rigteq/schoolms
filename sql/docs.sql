-- SCHOOL MANAGEMENT SYSTEM (SchoolMS) - REVISED GOLDEN SCHEMA
-- Use this file to completely reset the database structure for standard PostgreSQL (e.g. Neon).

-- ==============================================================================
-- 1. CLEANUP (Strict Tear Down)
-- ==============================================================================

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

-- Profiles: Central user identity (Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Storing encrypted passwords for NextAuth Credentials provider
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
-- 4. LEAVE MANAGEMENT
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

-- Note: Row Level Security (RLS) has been removed because authorization is now fully managed by the Next.js API route layer using NextAuth sessions.
