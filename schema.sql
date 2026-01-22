-- SCHOOL MANAGEMENT SYSTEM SCHEMA
-- Clean, optimized schema for Supabase

-- 1. PROFILES TABLE
-- Stores user details, linked to Supabase Auth via 'id'
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    address TEXT,
    phone TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'Student' CHECK (role IN ('Student', 'Teacher', 'Admin', 'Superadmin')),
    created_time TIMESTAMPTZ DEFAULT NOW(),
    last_edited_time TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 2. ROW LEVEL SECURITY (RLS)
-- Secure data access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. SEEDING SCRIPT (Manual Execution)
-- Steps to create a Superadmin:
-- 1. Go to Authentication > Users in Supabase Dashboard.
-- 2. Create a user (e.g., admin@schoolms.com).
-- 3. Copy the User ID (UUID).
-- 4. Run the SQL below, replacing 'PLACEHOLDER_UUID' with the copied ID.

-- INSERT INTO public.profiles (id, name, email, gender, role)
-- VALUES ('PLACEHOLDER_UUID', 'System Superadmin', 'admin@schoolms.com', 'Male', 'Superadmin');
