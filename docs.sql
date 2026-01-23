-- NEVER CHANGE THIS FILE CONTENT. Only add SQL at the end of this file.

-- 1. Roles Table (Pre-seeded with Student, Teacher, Admin, Superadmin)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 2. Schools Table (Multi-tenant support)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 3. Classes Table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    class_name TEXT NOT NULL, -- e.g., 'Grade 10-A'
    academic_year TEXT NOT NULL, -- e.g., '2025-2026'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 4. Profiles Table (Core User Data)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 5. Class Teachers (Links Teachers to Classes)
CREATE TABLE teachers_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    teacher_id UUID REFERENCES profiles(id),
    subject_name TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 6. Class Enrollments (Links Students to Classes)
CREATE TABLE students_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    student_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indices for Scalability
CREATE INDEX idx_profiles_school ON profiles(school_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_classes_school ON classes(school_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_profiles_role ON profiles(role_id);

-- Seeding Initial Data
INSERT INTO roles (role_name) VALUES ('Student'), ('Teacher'), ('Admin'), ('Superadmin');