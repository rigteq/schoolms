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

-- Note: Row Level Security (RLS) has been removed because authorization is now fully managed by the Next.js API route layer using NextAuth sessions.