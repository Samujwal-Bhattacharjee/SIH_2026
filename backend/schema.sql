-- ============================================================
-- GOIP Government File Tracking System — Database Schema
-- Run this in the Supabase SQL editor ONCE to set up all tables
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL UNIQUE,
    name_hi         TEXT,
    code            TEXT NOT NULL UNIQUE,
    head_officer    TEXT,
    location        TEXT,
    avg_disposal_days   NUMERIC(6,2) DEFAULT 0,
    sla_compliance_pct  NUMERIC(5,2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);

-- ============================================================
-- USERS
-- (ID must match Supabase Auth user UUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY,  -- Matches auth.users.id
    email           TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'SECTION_OFFICER'
                    CHECK (role IN ('ADMINISTRATOR','DEPARTMENT_HEAD','OPERATIONS_OFFICER','SECTION_OFFICER')),
    department      TEXT,
    section         TEXT,
    designation     TEXT,
    badge_number    TEXT UNIQUE,
    phone           TEXT,
    desk_number     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- ============================================================
-- AUTOMATIC PROFILE TRIGGER FOR SUPABASE AUTH & GOOGLE OAUTH
-- Automatically creates a row in `users` when a user logs in with Google/Supabase
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, department, designation, badge_number)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'OPERATIONS_OFFICER',
    'General Administration',
    'Operations Officer',
    'GOI-' || UPPER(SUBSTRING(new.id::text, 1, 8))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure freshness
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_number             TEXT UNIQUE,
    title                   TEXT NOT NULL,
    subject                 TEXT,
    case_type               TEXT NOT NULL DEFAULT 'Administrative',
    department              TEXT NOT NULL,
    section                 TEXT,
    current_stage           TEXT NOT NULL DEFAULT 'Application Received',
    status                  TEXT NOT NULL DEFAULT 'REGISTERED',
    applicant               TEXT,
    origin                  TEXT,
    assigned_officer        TEXT,
    current_desk            TEXT,
    flagged_for_review      BOOLEAN DEFAULT FALSE,
    document_ids            TEXT[] DEFAULT '{}',
    -- Deadline fields
    statutory_deadline_days INT NOT NULL DEFAULT 90,
    -- Litigation-specific
    court                   TEXT,
    order_date              DATE,
    received_date           DATE,
    limitation_days         INT,
    limitation_deadline     DATE,
    -- Audit
    last_movement_date      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_department ON cases(department);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_stage ON cases(current_stage);
CREATE INDEX IF NOT EXISTS idx_cases_limitation_deadline ON cases(limitation_deadline);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON cases(assigned_officer);
-- Full text search index
CREATE INDEX IF NOT EXISTS idx_cases_title_search ON cases USING GIN(to_tsvector('english', title));

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    storage_path    TEXT NOT NULL,
    file_url        TEXT,
    file_type       TEXT NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    document_type   TEXT DEFAULT 'Court Order',
    page_count      INT DEFAULT 0,
    ocr_status      TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (ocr_status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
    extracted_text  TEXT,
    uploaded_by     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_ocr_status ON documents(ocr_status);

-- ============================================================
-- CASE MOVEMENTS (File Movement / Workflow Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
    from_stage      TEXT,
    to_stage        TEXT NOT NULL,
    assigned_to     TEXT,
    remarks         TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'FORWARDED'
                    CHECK (status IN ('COMPLETED','IN_PROGRESS','REWORK_TRIGGERED','FORWARDED'))
);

CREATE INDEX IF NOT EXISTS idx_movements_case_id ON case_movements(case_id);

-- ============================================================
-- LEGAL OPINIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_opinions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
    requested_by    UUID REFERENCES users(id),
    assigned_to     TEXT,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date        DATE,
    received_at     TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'REQUESTED'
                    CHECK (status IN ('REQUESTED','IN_REVIEW','RECEIVED','OVERDUE','CLOSED')),
    recommendation  TEXT,
    document_id     UUID REFERENCES documents(id),
    remarks         TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_opinions_case_id ON legal_opinions(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_opinions_status ON legal_opinions(status);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    severity        TEXT NOT NULL DEFAULT 'MEDIUM'
                    CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    message         TEXT NOT NULL,
    due_date        DATE,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_case_id ON alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- ============================================================
-- AUDIT LOGS (Immutable — no UPDATE/DELETE)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id      TEXT,
    officer_name    TEXT NOT NULL,
    action          TEXT NOT NULL,
    file_id         TEXT,
    file_number     TEXT,
    previous_state  TEXT,
    new_state       TEXT,
    ip_address      TEXT,
    terminal_id     TEXT,
    remarks         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_file_id ON audit_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_officer_id ON audit_logs(officer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- CASE ACTIONS (Action history per case)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_actions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
    action_type     TEXT NOT NULL,
    performed_by    UUID REFERENCES users(id),
    remarks         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_actions_case_id ON case_actions(case_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- The backend uses the service role key which bypasses RLS.
-- Enable RLS on tables for future direct-client access.
-- ============================================================
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Allow backend (service role) full access
-- (Service role automatically bypasses RLS — no policy needed for it)

-- Allow authenticated users full operations on cases
CREATE POLICY "Authenticated users can view cases"
    ON cases FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert cases"
    ON cases FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases"
    ON cases FOR UPDATE
    TO authenticated
    USING (true);

-- Documents policies
CREATE POLICY "Authenticated users can view documents"
    ON documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
    ON documents FOR UPDATE
    TO authenticated
    USING (true);

-- Alerts policies
CREATE POLICY "Authenticated users can view their alerts"
    ON alerts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert alerts"
    ON alerts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
    ON alerts FOR UPDATE
    TO authenticated
    USING (true);

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select users"
    ON users FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Users can insert users"
    ON users FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Users can update users"
    ON users FOR UPDATE
    TO authenticated, anon
    USING (true);

-- Movements and audit log policies
ALTER TABLE case_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view case_movements" ON case_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert case_movements" ON case_movements FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- SUPABASE STORAGE BUCKET SETUP
-- Run this to create the storage bucket (or do it in the UI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gov-documents', 'gov-documents', false)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION: Document OCR Pipeline additions (Person 2)
-- Adds structured OCR storage columns to the documents table.
-- Run once in the Supabase SQL editor AFTER the initial schema.
-- Safe to re-run (IF NOT EXISTS guards).
-- ============================================================
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS extracted_fields   JSONB,
  ADD COLUMN IF NOT EXISTS processed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message      TEXT,
  ADD COLUMN IF NOT EXISTS ocr_engine         TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence     NUMERIC(5,4);

-- Index for querying documents that have been processed
CREATE INDEX IF NOT EXISTS idx_documents_processed_at ON documents(processed_at);
