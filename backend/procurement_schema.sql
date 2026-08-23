-- ============================================================
-- SIH26100 — Bid Compliance Verification Platform
-- Procurement Schema Extension
-- Run in Supabase SQL editor AFTER schema.sql
-- ============================================================

-- ============================================================
-- TENDERS
-- A tender is a procurement notice. Uses cases table for
-- the base record; tender-specific fields stored here.
-- ============================================================

-- Existing generic documents are reused for procurement files.  These two
-- fields preserve the actual extraction method and confidence for evidence.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS ocr_engine TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(5,4);
CREATE TABLE IF NOT EXISTS tenders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id             UUID REFERENCES cases(id) ON DELETE CASCADE,  -- Optional link to cases
    tender_number       TEXT NOT NULL UNIQUE,
    title               TEXT NOT NULL,
    department          TEXT NOT NULL,
    description         TEXT,
    bid_closing_date    DATE,
    estimated_value     NUMERIC(15,2),
    category            TEXT DEFAULT 'General',          -- e.g. Network Infrastructure
    status              TEXT NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE','CLOSED','CANCELLED','AWARDED')),
    local_content_class TEXT DEFAULT 'CLASS_I',          -- CLASS_I (>=50%) / CLASS_II (>=20%) / EXEMPT
    created_by          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_number ON tenders(tender_number);

-- ============================================================
-- TENDER REQUIREMENTS
-- Each row = one eligibility requirement for a tender.
-- ============================================================
CREATE TABLE IF NOT EXISTS tender_requirements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id           UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    requirement_id      TEXT NOT NULL,                   -- e.g. 'GST_REQUIRED'
    name                TEXT NOT NULL,                   -- e.g. 'Valid GST Registration'
    category            TEXT NOT NULL,                   -- STATUTORY | FINANCIAL | TECHNICAL | MANDATORY
    is_mandatory        BOOLEAN NOT NULL DEFAULT TRUE,
    description         TEXT,
    verification_rule   TEXT,                            -- e.g. 'GST_PRESENT'
    threshold_value     NUMERIC(15,2),                   -- For turnover thresholds
    threshold_unit      TEXT,                            -- 'INR_LAKH', 'PERCENT', etc.
    weight              NUMERIC(5,2) DEFAULT 1.0,        -- Scoring weight
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tender_req_tender_id ON tender_requirements(tender_id);

-- ============================================================
-- BIDDERS
-- A bidder participates in one tender.
-- Documents are linked via the documents table (case_id = bidder_id for storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS bidders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id           UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    legal_name          TEXT NOT NULL,
    trade_name          TEXT,
    gstin               TEXT,
    pan                 TEXT,
    udyam_number        TEXT,
    cin                 TEXT,
    registered_address  TEXT,
    contact_email       TEXT,
    contact_phone       TEXT,
    enterprise_category TEXT,                            -- MICRO | SMALL | MEDIUM | LARGE
    status              TEXT NOT NULL DEFAULT 'PENDING_DOCUMENTS'
                        CHECK (status IN (
                            'PENDING_DOCUMENTS','UNDER_REVIEW','COMPLIANT',
                            'NON_COMPLIANT','EXCEPTION_FOUND','QUALIFIED','DISQUALIFIED',
                            'CLARIFICATION_REQUESTED','MARK_FOR_REVIEW'
                        )),
    compliance_score    NUMERIC(5,2),
    risk_level          TEXT CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    officer_decision    TEXT,
    officer_note        TEXT,
    decided_at          TIMESTAMPTZ,
    decided_by          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bidders_tender_id ON bidders(tender_id);
CREATE INDEX IF NOT EXISTS idx_bidders_status ON bidders(status);
CREATE INDEX IF NOT EXISTS idx_bidders_gstin ON bidders(gstin);

-- ============================================================
-- BIDDER DOCUMENTS
-- Maps documents (from documents table) to a specific bidder.
-- The documents table already stores the file; this adds the bidder link.
-- ============================================================
CREATE TABLE IF NOT EXISTS bidder_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bidder_id       UUID NOT NULL REFERENCES bidders(id) ON DELETE CASCADE,
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_type   TEXT,                                -- Classified type: GST Certificate, PAN, etc.
    is_primary      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (bidder_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_bidder_docs_bidder_id ON bidder_documents(bidder_id);

-- ============================================================
-- COMPLIANCE RESULTS
-- One row per requirement per bidder, updated after each verification run.
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bidder_id           UUID NOT NULL REFERENCES bidders(id) ON DELETE CASCADE,
    tender_id           UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    requirement_id      TEXT NOT NULL,
    requirement_name    TEXT NOT NULL,
    category            TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN (
                            'COMPLIANT','NON_COMPLIANT','PENDING',
                            'NEEDS_REVIEW','NOT_APPLICABLE','EXPIRED'
                        )),
    severity            TEXT NOT NULL DEFAULT 'MEDIUM'
                        CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    score               NUMERIC(5,2) DEFAULT 0,
    evidence_doc_id     UUID REFERENCES documents(id),
    evidence_field_key  TEXT,                            -- Which extracted field provided evidence
    evidence_value      TEXT,                            -- The actual extracted value used
    confidence          NUMERIC(5,2),
    reason              TEXT,                            -- Human-readable explanation
    verified_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_bidder_id ON compliance_results(bidder_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tender_id ON compliance_results(tender_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_results(status);

-- ============================================================
-- DISCREPANCIES
-- Cross-document validation findings.
-- ============================================================
CREATE TABLE IF NOT EXISTS discrepancies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bidder_id           UUID NOT NULL REFERENCES bidders(id) ON DELETE CASCADE,
    discrepancy_type    TEXT NOT NULL,                   -- NAME_MISMATCH | GSTIN_MISMATCH | EXPIRED_DOC | etc.
    severity            TEXT NOT NULL DEFAULT 'MEDIUM'
                        CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    field_name          TEXT NOT NULL,                   -- Which field has mismatch
    expected_value      TEXT,                            -- What was expected
    found_value         TEXT,                            -- What was found
    source_doc_1_id     UUID REFERENCES documents(id),
    source_doc_2_id     UUID REFERENCES documents(id),
    description         TEXT NOT NULL,                   -- Human-readable description
    recommendation      TEXT,                            -- What officer should do
    is_resolved         BOOLEAN DEFAULT FALSE,
    resolved_by         TEXT,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discrepancies_bidder_id ON discrepancies(bidder_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_type ON discrepancies(discrepancy_type);

-- ============================================================
-- BIDDER AUDIT EVENTS
-- Every important action on a bidder creates an event.
-- ============================================================
CREATE TABLE IF NOT EXISTS bidder_audit_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID REFERENCES tenders(id) ON DELETE CASCADE,
    bidder_id       UUID REFERENCES bidders(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id),
    action          TEXT NOT NULL,
    actor           TEXT NOT NULL DEFAULT 'System',
    actor_user_id   TEXT,
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bidder_audit_tender_id ON bidder_audit_events(tender_id);
CREATE INDEX IF NOT EXISTS idx_bidder_audit_bidder_id ON bidder_audit_events(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bidder_audit_created_at ON bidder_audit_events(created_at DESC);

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidder_audit_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated full access (backend uses service key which bypasses RLS)
CREATE POLICY "Auth users tenders select" ON tenders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users tenders insert" ON tenders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users tenders update" ON tenders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users tender_req select" ON tender_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users tender_req insert" ON tender_requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users tender_req update" ON tender_requirements FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users bidders select" ON bidders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users bidders insert" ON bidders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users bidders update" ON bidders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users bidder_docs select" ON bidder_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users bidder_docs insert" ON bidder_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users compliance select" ON compliance_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users compliance insert" ON compliance_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users compliance update" ON compliance_results FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users discrepancies select" ON discrepancies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users discrepancies insert" ON discrepancies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users discrepancies update" ON discrepancies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users bidder_audit select" ON bidder_audit_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users bidder_audit insert" ON bidder_audit_events FOR INSERT TO authenticated WITH CHECK (true);
