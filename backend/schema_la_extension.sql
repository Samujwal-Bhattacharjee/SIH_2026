-- ============================================================
-- SIH26017 LAND ACQUISITION SCHEMA EXTENSION
-- Ministry of Rural Development — Land Acquisition Delay Prediction
-- 
-- Run this AFTER the existing schema.sql has been applied.
-- All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- so this is safe to run multiple times.
--
-- This does NOT drop or alter existing columns. It only ADDS
-- new land-acquisition-specific fields to the existing tables.
-- ============================================================

-- ============================================================
-- EXTEND: cases table → Land Acquisition Project fields
-- The existing 'cases' table becomes the projects table.
-- Filter projects using: case_type = 'Land Acquisition'
-- ============================================================
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS project_code          TEXT,
  ADD COLUMN IF NOT EXISTS state                 TEXT DEFAULT 'Maharashtra',
  ADD COLUMN IF NOT EXISTS district              TEXT,
  ADD COLUMN IF NOT EXISTS total_parcels         INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_parcels     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_area            NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documentation_completeness  NUMERIC(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS legal_dispute         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ownership_conflict    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS compensation_pending_days   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rr_status             TEXT DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS rr_delay_days         INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inter_dept_dependency BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pending_approvals     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_probability     NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS predicted_delay_days  INT,
  ADD COLUMN IF NOT EXISTS ml_risk_level         TEXT,
  ADD COLUMN IF NOT EXISTS model_version         TEXT;

-- Indexes for commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_cases_district ON cases(district);
CREATE INDEX IF NOT EXISTS idx_cases_state ON cases(state);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_legal_dispute ON cases(legal_dispute);
CREATE INDEX IF NOT EXISTS idx_cases_ownership_conflict ON cases(ownership_conflict);
CREATE INDEX IF NOT EXISTS idx_cases_delay_probability ON cases(delay_probability);

-- ============================================================
-- EXTEND: documents table → Land Acquisition document types
-- The existing documents table already has extracted_fields (JSONB).
-- We just add a land-acquisition-specific document_category.
-- ============================================================
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS project_stage   TEXT,
  ADD COLUMN IF NOT EXISTS la_doc_category TEXT;

-- ============================================================
-- EXTEND: case_movements → Project Stage Timeline
-- The case_movements table tracks stage transitions.
-- We add expected_duration and actual_duration for LA analysis.
-- ============================================================
ALTER TABLE case_movements
  ADD COLUMN IF NOT EXISTS expected_duration_days  INT,
  ADD COLUMN IF NOT EXISTS actual_duration_days    INT,
  ADD COLUMN IF NOT EXISTS delay_days              INT;

-- ============================================================
-- EXTEND: alerts table → LA-specific alert types
-- No structural change needed — the type and message fields
-- already support LA-domain alert content.
-- The following comment documents the expected LA alert types:
--
-- CRITICAL_DELAY_RISK       — delay_probability >= 0.80
-- STAGE_OVERDUE             — current stage past expected duration  
-- COMPENSATION_DELAY        — compensation_pending_days > threshold
-- DOCUMENTATION_ISSUE       — documentation_completeness < threshold
-- OWNERSHIP_CONFLICT        — ownership_conflict = true
-- LEGAL_DISPUTE             — legal_dispute = true
-- ============================================================

-- ============================================================
-- NOTE: Run seed.py after applying this migration to populate
-- demo data for the SIH26017 prototype.
-- ============================================================
