-- ==============================================================================
-- 6. REPORT CARDS
-- ==============================================================================

CREATE TABLE report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students_data(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    academic_year TEXT NOT NULL,          -- e.g. '2025-26'
    term TEXT NOT NULL,                   -- e.g. 'Term 1', 'Mid-Term', 'Final'
    remarks TEXT,                         -- Overall teacher remarks
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    is_published BOOLEAN DEFAULT FALSE,   -- Admin publishes before download is allowed
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, academic_year, term)
);

CREATE TABLE report_card_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_card_id UUID REFERENCES report_cards(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100,
    obtained_marks NUMERIC(5,2),
    grade TEXT,                           -- A+, A, B, C, D, F (auto or manual)
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_report_cards_student ON report_cards(student_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_report_cards_school ON report_cards(school_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_report_card_subjects_card ON report_card_subjects(report_card_id);

-- RLS Policies
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_card_subjects ENABLE ROW LEVEL SECURITY;

-- Superadmin: Full access
CREATE POLICY "Superadmin manage report_cards" ON report_cards FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

-- Admin: Full access within their school
CREATE POLICY "Admin manage school report_cards" ON report_cards FOR ALL TO authenticated
USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() = 'Admin'
);

-- Teacher: Read + Write within their school (cannot publish)
CREATE POLICY "Teacher manage school report_cards" ON report_cards FOR ALL TO authenticated
USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() = 'Teacher'
);

-- Subjects: Anyone with school access can manage subjects via report_card join
CREATE POLICY "Superadmin manage report_card_subjects" ON report_card_subjects FOR ALL TO authenticated
USING ( public.get_my_role() = 'Superadmin' );

CREATE POLICY "Users manage report_card_subjects" ON report_card_subjects FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM report_cards rc
        WHERE rc.id = report_card_subjects.report_card_id
          AND rc.school_id = public.get_my_school_id()
    )
);