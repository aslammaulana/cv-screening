-- 1. Enable pg_net extension for Edge Function triggers
-- Run this in the SQL Editor in Supabase
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create job_positions table
CREATE TABLE IF NOT EXISTS job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    must_have TEXT,
    nice_to_have TEXT,
    auto_reject_below INTEGER DEFAULT 50,
    manual_review_min INTEGER DEFAULT 51,
    manual_review_max INTEGER DEFAULT 85,
    auto_approve_above INTEGER DEFAULT 86,
    weight_skill INTEGER DEFAULT 30,
    weight_experience INTEGER DEFAULT 35,
    weight_project INTEGER DEFAULT 20,
    weight_education INTEGER DEFAULT 15,
    focus_points TEXT,
    red_flags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create applicants table
CREATE TABLE IF NOT EXISTS applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    cv_url TEXT, -- Google Drive webViewLink
    cv_json JSONB, -- Extracted structured data
    score_total INTEGER,
    score_skill INTEGER,
    score_experience INTEGER,
    score_project INTEGER,
    score_education INTEGER,
    ai_reason_accept TEXT,
    ai_reason_reject TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'extracted', 'scoring', 'auto_rejected', 
        'manual_review', 'auto_approved', 'rejected', 'approved', 'failed'
    )),
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create ai_config table
CREATE TABLE IF NOT EXISTS ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_prompt TEXT NOT NULL,
    extraction_prompt TEXT NOT NULL,
    scoring_prompt TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create ai_config_history table
CREATE TABLE IF NOT EXISTS ai_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_type TEXT CHECK (prompt_type IN ('persona', 'extraction', 'scoring')),
    previous_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trigger Function for Edge Function A (cv-extract)
-- Replace <project-ref> and <service-role-key> manually later
CREATE OR REPLACE FUNCTION trigger_cv_extract()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tmaqkrpgkkptzgddpdnk.supabase.co/functions/v1/cv-extract',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims')::json->>'role'
    ),
    body := json_build_object('applicant_id', NEW.id)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger on applicants insert
CREATE TRIGGER on_applicant_insert
  AFTER INSERT ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cv_extract();

-- 8. RLS Policies
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config_history ENABLE ROW LEVEL SECURITY;

-- Public can read active positions
CREATE POLICY "Public read active positions" ON job_positions
    FOR SELECT USING (is_active = true);

-- Applicants table: Only service role can read/write directly (Server-side API handles this)
-- Admin can be added via specific policies if needed for authenticated users
