-- ==============================================================================
-- MIGRATION: 19-05-2026
-- 1. Extend students_data with new fields
-- 2. Update classes RLS to grant Teachers full CRUD
-- 3. Create transfer_certificates + tc_academic_records tables
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND students_data
-- ------------------------------------------------------------------------------

ALTER TABLE students_data
    ADD COLUMN IF NOT EXISTS form_submitted_date    DATE,
    ADD COLUMN IF NOT EXISTS aadhar_number          TEXT,
    ADD COLUMN IF NOT EXISTS mother_name            TEXT,
    ADD COLUMN IF NOT EXISTS father_name            TEXT,
    ADD COLUMN IF NOT EXISTS last_institution       TEXT,
    ADD COLUMN IF NOT EXISTS last_institution_class TEXT,
    ADD COLUMN IF NOT EXISTS last_institution_section TEXT;

-- Rename existing `parent_name` / `parent_phone` columns if still present
-- (they were in the original schema; we keep parent_phone as guardian_mobile alias via the existing `phone` column)
-- parent_name is superseded by father_name + mother_name, kept for backward compat.

-- ------------------------------------------------------------------------------
-- 2. UPDATE classes RLS — grant Teachers full CRUD within their school
-- ------------------------------------------------------------------------------

-- Drop the old read-only policy that covered Teachers under "Users view school classes"
DROP POLICY IF EXISTS "Teacher manage school classes" ON classes;

-- Add a new full-management policy for Teachers scoped to their school
CREATE POLICY "Teacher manage school classes" ON classes FOR ALL TO authenticated
USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() = 'Teacher'
);

-- ------------------------------------------------------------------------------
-- 3. TRANSFER CERTIFICATES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transfer_certificates (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  UUID NOT NULL REFERENCES students_data(id) ON DELETE CASCADE,
    school_id                   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- File numbers
    admission_file_no           TEXT,
    withdrawal_file_no          TEXT,
    tc_file_no                  TEXT,
    scholar_register_no         TEXT,

    -- Aadhar (can differ from student record snapshot at TC time)
    aadhar_number               TEXT,
    apar_number                 TEXT,
    pan_number                  TEXT,

    -- Student snapshot at TC time
    scholar_name                TEXT NOT NULL,
    father_guardian_name        TEXT,
    father_guardian_address     TEXT,
    mother_name                 TEXT,
    caste_or_religion           TEXT,
    last_institution_before     TEXT,
    length_of_residence         TEXT,

    -- DOB
    dob                         DATE,
    dob_in_words                TEXT,

    -- Certification
    certification_remarks       TEXT,
    dated                       DATE,

    -- Meta
    created_by                  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    modified_at                 TIMESTAMPTZ DEFAULT NOW(),
    is_deleted                  BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tc_academic_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tc_id               UUID NOT NULL REFERENCES transfer_certificates(id) ON DELETE CASCADE,
    class_label         TEXT NOT NULL,  -- e.g. 'P.G', 'Nur.', 'JKG', 'I', 'II', ...
    date_of_admission   DATE,
    date_of_promotion   DATE,
    date_of_removal     DATE,
    cause_of_removal    TEXT,
    year_session        TEXT,
    conduct             TEXT,
    concession          TEXT,
    work                TEXT,
    signature           TEXT,
    sort_order          INTEGER DEFAULT 0
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tc_student   ON transfer_certificates(student_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tc_school    ON transfer_certificates(school_id)  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tc_records   ON tc_academic_records(tc_id);

-- Add missing TC identification fields if table already exists
ALTER TABLE transfer_certificates
    ADD COLUMN IF NOT EXISTS apar_number TEXT,
    ADD COLUMN IF NOT EXISTS pan_number TEXT;

-- RLS
ALTER TABLE transfer_certificates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tc_academic_records    ENABLE ROW LEVEL SECURITY;

-- Superadmin: full access
CREATE POLICY "Superadmin manage tc" ON transfer_certificates FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

-- Admin: full access within their school
CREATE POLICY "Admin manage school tc" ON transfer_certificates FOR ALL TO authenticated
USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() = 'Admin'
);

-- Teachers: NO access (no policy = denied)

-- Academic records: accessible if parent TC is accessible
CREATE POLICY "Superadmin manage tc_records" ON tc_academic_records FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Admin manage school tc_records" ON tc_academic_records FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM transfer_certificates tc
        WHERE tc.id = tc_academic_records.tc_id
          AND tc.school_id = public.get_my_school_id()
    )
    AND public.get_my_role() = 'Admin'
);
