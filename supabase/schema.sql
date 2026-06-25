-- ============================================================
-- CV Screening App — Full Database Setup (Clean Schema)
-- Run this in Supabase SQL Editor for a fresh installation
-- Last updated: 2026-06-25
-- ============================================================

-- 1. job_positions table
CREATE TABLE IF NOT EXISTS job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    must_have TEXT,
    nice_to_have TEXT,
    focus_points TEXT,
    red_flags TEXT,
    auto_reject_below INTEGER DEFAULT 50,
    auto_approve_above INTEGER DEFAULT 86,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. applicants table
CREATE TABLE IF NOT EXISTS applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_no SERIAL,
    job_position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    cv_url TEXT,
    extracted_cv TEXT,
    score_total INTEGER DEFAULT 0,
    ai_reason_accept TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'extracted', 'scoring',
        'auto_rejected', 'manual_review', 'auto_approved',
        'rejected', 'approved', 'failed'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. projects_keep_alive table
CREATE TABLE IF NOT EXISTS projects_keep_alive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    note TEXT DEFAULT 'Heartbeat to prevent pausing'
);

-- 4. ai_config table
CREATE TABLE IF NOT EXISTS ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_prompt TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Public can read active positions (for the public apply form)
CREATE POLICY "Public read active positions"
    ON job_positions FOR SELECT
    USING (is_active = true);

-- 6. Seed default AI config (run once)
INSERT INTO ai_config (persona_prompt)
VALUES (
    'You are a high-level Technical Recruiter and HR Analyst.
Your goal is to screen candidates for technical and non-technical roles with high precision.
You are objective, professional, and focus on extracting facts from resumes while ignoring fluff.
You prioritize evidence of impact and relevant skill application over simple keyword matching.

Important:
- ALWAYS provide the analysis and "reason" in English.
- Use double newlines between paragraphs.
- Use professional yet concise language.'
)
ON CONFLICT DO NOTHING;
