-- Supabase RLS (Row Level Security) Policies for JobAZ
-- Run these SQL commands in your Supabase SQL Editor to enable data isolation

-- ============================================================================
-- 1. CVs Table
-- ============================================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_info JSONB,
  summary TEXT,
  experience JSONB,
  education JSONB,
  skills JSONB,
  layout TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON cvs;

-- Create policies
CREATE POLICY "Users can view their own CVs"
  ON cvs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CVs"
  ON cvs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CVs"
  ON cvs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CVs"
  ON cvs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Cover Letters Table
-- ============================================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT,
  company TEXT,
  city_state TEXT,
  role TEXT,
  keywords TEXT,
  letter_body TEXT,
  applicant_name TEXT,
  layout TEXT,
  ats_mode BOOLEAN DEFAULT false,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can insert their own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can update their own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can delete their own cover letters" ON cover_letters;

-- Create policies
CREATE POLICY "Users can view their own cover letters"
  ON cover_letters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cover letters"
  ON cover_letters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cover letters"
  ON cover_letters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cover letters"
  ON cover_letters FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Applied Jobs Table
-- ============================================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS applied_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  source_site TEXT,
  job_url TEXT,
  status TEXT DEFAULT 'submitted',
  has_cv BOOLEAN DEFAULT false,
  has_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE applied_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own applied jobs" ON applied_jobs;
DROP POLICY IF EXISTS "Users can insert their own applied jobs" ON applied_jobs;
DROP POLICY IF EXISTS "Users can update their own applied jobs" ON applied_jobs;
DROP POLICY IF EXISTS "Users can delete their own applied jobs" ON applied_jobs;

-- Create policies
CREATE POLICY "Users can view their own applied jobs"
  ON applied_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applied jobs"
  ON applied_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applied jobs"
  ON applied_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applied jobs"
  ON applied_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Saved Jobs Table (Job States)
-- ============================================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  cv_summary TEXT,
  cover_letter_text TEXT,
  cv_status TEXT DEFAULT 'not-tailored',
  cover_status TEXT DEFAULT 'not-created',
  application_status TEXT DEFAULT 'not-submitted',
  training_status TEXT DEFAULT 'not-available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can insert their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can update their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON saved_jobs;

-- Create policies
CREATE POLICY "Users can view their own saved jobs"
  ON saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved jobs"
  ON saved_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs"
  ON saved_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Interview Training Table (if needed)
-- ============================================================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  score INTEGER,
  strengths JSONB,
  weaknesses JSONB,
  improved_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interview_training ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interview training" ON interview_training;
DROP POLICY IF EXISTS "Users can insert their own interview training" ON interview_training;
DROP POLICY IF EXISTS "Users can update their own interview training" ON interview_training;
DROP POLICY IF EXISTS "Users can delete their own interview training" ON interview_training;

-- Create policies
CREATE POLICY "Users can view their own interview training"
  ON interview_training FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview training"
  ON interview_training FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview training"
  ON interview_training FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview training"
  ON interview_training FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Create Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_applied_jobs_user_id ON applied_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_applied_jobs_user_job ON applied_jobs(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_job ON saved_jobs(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_interview_training_user_id ON interview_training(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_training_user_job ON interview_training(user_id, job_id);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. All tables have user_id UUID column that references auth.users(id)
-- 2. RLS is enabled on all tables
-- 3. All policies use auth.uid() to ensure users can only access their own data
-- 4. ON DELETE CASCADE ensures data is deleted when a user is deleted
-- 5. Indexes are created for performance on user_id and common query patterns
-- 6. When querying from client, always include .eq('user_id', user.id) even with RLS
-- 7. When inserting, always set user_id: user.id
-- 8. Never use service role key on the client - only in server-side API routes

