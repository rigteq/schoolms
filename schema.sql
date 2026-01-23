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

-- 4. SERVER-SIDE PROFILE CREATION/UPDATE FUNCTION
-- Used by server-side admin flows to create or update a user's profile after creating an auth user.
CREATE OR REPLACE FUNCTION public.create_or_update_profile(
    p_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT 'Male',
    p_role TEXT DEFAULT 'Student'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, gender, role, created_time, last_edited_time, is_deleted)
    VALUES (p_id, p_name, p_email, p_phone, p_gender, p_role, COALESCE((SELECT created_time FROM public.profiles WHERE id = p_id), NOW()), NOW(), FALSE)
    ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                gender = EXCLUDED.gender,
                role = EXCLUDED.role,
                last_edited_time = NOW(),
                is_deleted = EXCLUDED.is_deleted;

    RETURN p_id;
END;
$$;

-- 5. PROFILE LAST_EDITED TRIGGER
CREATE OR REPLACE FUNCTION public.set_profile_last_edited_time()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.last_edited_time := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_set_last_edited ON public.profiles;
CREATE TRIGGER trg_profiles_set_last_edited
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_last_edited_time();

-- 6. VIEW FOR ADMIN DASHBOARDS
CREATE OR REPLACE VIEW public.v_admin_profiles AS
SELECT id, name, email, phone, gender, role, created_time, last_edited_time
FROM public.profiles
WHERE is_deleted = FALSE;

