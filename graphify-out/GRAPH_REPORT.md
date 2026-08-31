# Graph Report - SIH  (2026-08-31)

## Corpus Check
- 175 files · ~144,274 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1780 nodes · 3583 edges · 122 communities (106 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `26ec5e90`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- seed.py
- TestFieldExtraction
- extract_fields_from_text
- useLanguage
- WorkflowDrawer.tsx
- security.py
- get_supabase
- calculate_deadline_status
- procurement_store.py
- ProcurementIntegrity.tsx
- deadline_service.py
- Communities (88 total, 14 thin omitted)
- compilerOptions
- procurement_service.py
- UploadDocument.tsx
- RiskLevel
- types/index.ts
- schemas/__init__.py
- GOIP Backend API Contract Specification
- validate_file
- detect_case_bottleneck
- react
- document_service.py
- cases.py
- dependencies
- GOIP Backend — Government File Tracking & Administrative Intelligence System
- compilerOptions
- FileDetail.tsx
- devDependencies
- SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation
- test_land_acquisition.py
- procurement.py
- test_documents.py
- calculate_case_risk
- test_integrity_engine.py
- extract_text_from_pdf_digital
- feature_extractor.py
- ocr_service.py
- calculate_risk
- api/index.ts
- aggregate_integrity_findings
- RelationshipGraph.tsx
- case_service.py
- TestDocumentStatus
- useAuth
- GOIP — Government Operations Intelligence Platform
- generate_land_projects.py
- plugins
- package.json
- BidderFeature
- verification_provider.py
- get_expected_days
- Google Authentication with Supabase — Step-by-Step Setup Guide
- get
- test_auth_integration.py
- test_intelligence.py
- Reports.tsx
- Verification Results
- Case Intelligence & Risk Engine
- process_ocr
- analyze_bid_price_similarity
- Graph Report - SIH  (2026-08-28)
- train.py
- projects.py
- intelligence/__init__.py
- 2. Testing Endpoints via PowerShell / cURL
- 1. Integrity Module (`backend/app/services/integrity/`)
- 17. Demonstration Flow
- LanguageContext.tsx
- vite-env.d.ts
- tsconfig.json
- vercel.json
- AuthContext.tsx
- 21. Development Principles
- 3. Key Capabilities
- auth.py
- TestMLPrediction
- GOIP — Environment Variables & Configuration Guide
- 8. Typical Data Flow
- ProcurementContext.tsx
- 10. Environment Configuration
- 5. Technology Stack
- 9. Getting Started
- UX4G (User Experience for Government) Design Guidelines
- react-router-dom
- @tailwindcss/postcss
- Enum
- seed_initial_data
- predict_delay
- extract_la_fields
- @supabase/supabase-js
- priority_engine.py
- get_document
- App.tsx
- test_api_tender_and_bidder_integrity
- alert_service.py
- tailwind-merge
- test_procurement_persistence.py
- tailwindcss
- model_loader.py
- get_case
- TestPriorityAndDashboardAggregation
- get_bidder_by_id
- Settings
- list_alerts
- StatutoryDeadlineEngine.tsx
- lucide-react
- StatutoryCountdown.tsx
- TechnicalCard.tsx
- save_compliance_assessment

## God Nodes (most connected - your core abstractions)
1. `react` - 66 edges
2. `get_supabase()` - 66 edges
3. `Communities (88 total, 14 thin omitted)` - 63 edges
4. `assess_tender_integrity()` - 41 edges
5. `RiskLevel` - 33 edges
6. `SignalType` - 29 edges
7. `validate_file()` - 28 edges
8. `BidderFeature` - 28 edges
9. `init_db()` - 27 edges
10. `GOIP — Government Operations Intelligence Platform` - 27 edges

## Surprising Connections (you probably didn't know these)
- `test_document_upload_ocr_compliance_flow()` --calls--> `get_bidders()`  [EXTRACTED]
  backend/tests/test_procurement_persistence.py → backend/app/core/procurement_store.py
- `test_officer_decision_and_audit_trail()` --calls--> `get_bidders()`  [EXTRACTED]
  backend/tests/test_procurement_persistence.py → backend/app/core/procurement_store.py
- `_get_valid_quote()` --uses--> `BidderFeature`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py
- `analyze_bid_price_similarity()` --uses--> `BidderFeature`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py
- `analyze_bid_price_similarity()` --uses--> `FindingStatus`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py

## Import Cycles
- None detected.

## Communities (122 total, 16 thin omitted)

### Community 0 - "seed.py"
Cohesion: 0.15
Nodes (12): calculate_deadline(), Calculate the limitation deadline. Args: start_date: ISO date string (YYYY-MM-…, main(), random_date(), Generate a random past date within the given range., seed_case_actions(), seed_cases(), seed_departments() (+4 more)

### Community 1 - "TestFieldExtraction"
Cohesion: 0.18
Nodes (4): Tests for regex-based structured field extraction., Helper: run extraction and return {key: value} dict., Smoke test: realistic court order text extracts at least case number and court., TestFieldExtraction

### Community 2 - "extract_fields_from_text"
Cohesion: 0.16
Nodes (7): extract_fields_from_text(), Attempt to extract structured fields from raw OCR text using regex patterns.…, Tests for regex-based field extraction in ocr_service.py., TestOCRService, Fields not found should be absent from the list, not present with null., All confidence scores must be between 0 and 1., All regex-extracted fields should have isExtracted=True.

### Community 3 - "useLanguage"
Cohesion: 0.17
Nodes (13): Emblem(), EmblemProps, AppLayout(), GovBreadcrumb(), GovFooter(), GovHorizontalNav(), NavItem, GovNotificationTicker() (+5 more)

### Community 4 - "WorkflowDrawer.tsx"
Cohesion: 0.40
Nodes (3): CustomWorkflowNode, WorkflowDrawerProps, WorkflowNodeData

### Community 5 - "security.py"
Cohesion: 0.08
Nodes (32): mark_alert_read(), put, Mark a specific alert as read., Dashboard route — returns real aggregate statistics from the database. No…, Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, check_verification(), BaseModel (+24 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "calculate_deadline_status"
Cohesion: 0.09
Nodes (25): calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), normalize_to_date(), date, datetime, Deadline & Limitation Calculation Engine. Provides transparent, deterministic… (+17 more)

### Community 8 - "procurement_store.py"
Cohesion: 0.18
Nodes (33): create_bidder_record(), create_tender_record(), get_all_procurement_documents(), get_audit_trail(), get_bidder_documents(), get_bidders(), get_compliance_results(), get_dashboard_summary() (+25 more)

### Community 9 - "ProcurementIntegrity.tsx"
Cohesion: 0.18
Nodes (11): AppSidebar(), NAV_ITEMS, ProcurementIntegrity(), SIGNAL_LABELS, Settings(), apiClient, isUsingMockApi(), mockApi (+3 more)

### Community 10 - "deadline_service.py"
Cohesion: 0.08
Nodes (23): calculate_age_days(), calculate_days_remaining(), get_deadline_status(), map_deadline_status_to_case_status(), map_deadline_status_to_priority(), map_deadline_status_to_risk_level(), parse_iso_date(), parse_iso_datetime() (+15 more)

### Community 11 - "Communities (88 total, 14 thin omitted)"
Cohesion: 0.03
Nodes (63): Communities (88 total, 14 thin omitted), Community 0 - "projects.py", Community 10 - "case_service.py", Community 11 - "ocr_service.py", Community 12 - "compilerOptions", Community 13 - "procurement_service.py", Community 14 - "UploadDocument.tsx", Community 15 - "api/index.ts" (+55 more)

### Community 12 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, src, vite/client, vite-env.d.ts, compilerOptions, allowImportingTsExtensions (+19 more)

### Community 13 - "procurement_service.py"
Cohesion: 0.05
Nodes (44): classify_document_type(), extract_procurement_fields(), Extract procurement-specific structured fields from OCR text. Used for bid…, Classify a document type from its OCR text using deterministic rules. Returns a…, calculate_compliance_score(), calculate_risk_level(), check_blacklisting_declaration(), check_gst_present() (+36 more)

### Community 14 - "UploadDocument.tsx"
Cohesion: 0.14
Nodes (19): textareaBaseClasses, FileForwardModal(), FileForwardModalProps, FileRegisterModal(), FileRegisterModalProps, Files(), STAGES, STATUSES (+11 more)

### Community 15 - "RiskLevel"
Cohesion: 0.15
Nodes (32): analyze_bid_rotation(), analyze_repeated_participation(), analyze_winner_concentration(), Any, IntegrityFinding, Bid & Historical Pattern Analyzer — Procurement Integrity Engine…, Detect disproportionate historical award concentration for any current…, Detect repeated joint participation of the same bidder cohort across multiple… (+24 more)

### Community 16 - "types/index.ts"
Cohesion: 0.07
Nodes (44): RiskAttributionPanelProps, MOCK_AUDIT_LOGS, MOCK_BOTTLENECKS, MOCK_CASE_EVENTS, MOCK_CASES, MOCK_DASHBOARD_METRICS, MOCK_DEPARTMENTS, MOCK_DOCUMENTS (+36 more)

### Community 17 - "schemas/__init__.py"
Cohesion: 0.16
Nodes (23): AlertOut, AuditLogOut, BottleneckAnalysis, CaseEventOut, DashboardMetrics, DepartmentInfo, DocumentMetadata, DocumentRecordOut (+15 more)

### Community 18 - "GOIP Backend API Contract Specification"
Cohesion: 0.08
Nodes (25): 1. Authentication, 2. Dashboard Operations, 3. Case Intelligence, 4. Process Mining & Workflow, 5. Risk Intelligence, 6. Documents & OCR, 7. What-If Simulation, 8. Analytics & Conformance (+17 more)

### Community 19 - "validate_file"
Cohesion: 0.13
Nodes (8): Validate file type and size. Returns error message string if invalid, None if…, validate_file(), Tests for file validation logic., TestDocumentValidation, Tests for file validation logic., A 0-byte file passes size validation (content validation is separate)., validate_file() returns an error string when validation fails., TestInvalidFileRejection

### Community 20 - "detect_case_bottleneck"
Cohesion: 0.13
Nodes (16): calculate_stage_dwell_days(), detect_case_bottleneck(), Any, date, datetime, Bottleneck and File Stagnation Detection Engine. Analyzes case stage…, Calculate the number of days a case has been pending at its current stage.…, Evaluate whether the case is currently stuck in a workflow bottleneck. Returns:… (+8 more)

### Community 21 - "react"
Cohesion: 0.15
Nodes (18): react, EmptyStateProps, FormField(), FormFieldProps, inputBaseClasses, inputErrorClasses, selectBaseClasses, GovButton() (+10 more)

### Community 22 - "document_service.py"
Cohesion: 0.15
Nodes (14): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), post, UploadFile (+6 more)

### Community 23 - "cases.py"
Cohesion: 0.12
Nodes (20): create_case(), delete_case(), forward_case(), post, put, Cases routes — CRUD endpoints for case management. All business logic delegated…, Forward a case to a different officer, desk, or workflow stage. Records an…, Toggle the 'flagged for review' marker on a case. (+12 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, framer-motion, dependencies, clsx, framer-motion, react, react-dom, recharts (+9 more)

### Community 25 - "GOIP Backend — Government File Tracking & Administrative Intelligence System"
Cohesion: 0.09
Nodes (22): 10. Test the API, 1. Clone and navigate, 2. Create virtual environment, 3. Install dependencies, 4. Configure environment, 5. Configure Supabase, 6. Run the database schema, 7. Seed demo data (optional) (+14 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+11 more)

### Community 27 - "FileDetail.tsx"
Cohesion: 0.12
Nodes (17): GovBadge, StatusBadge(), StatusBadgeProps, GovModal(), GovModalProps, DOCUMENT_TYPES, DocumentUploadModal(), DocumentUploadModalProps (+9 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, oxlint, devDependencies, autoprefixer, oxlint, postcss, @types/node, @types/react (+11 more)

### Community 29 - "SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation"
Cohesion: 0.09
Nodes (22): 10. Team Task Allocation & Responsibilities, 11. Exact File Ownership Matrix, 12. Task Priority Framework (P0 – P3), 13. Practical 7-Day Execution Timeline, 14. 5-Minute SIH Winning Demo Script, 15. Remaining Risks & Mitigations, 1. Project Architecture, 2. Current Implementation Status Matrix (+14 more)

### Community 30 - "test_land_acquisition.py"
Cohesion: 0.13
Nodes (17): get_project_recommendations(), get_project_timeline(), get_next_stage(), get_risk_level_from_probability(), get_stage_index(), Land Acquisition Workflow Constants — SIH26017…, Convert a delay probability (0.0–1.0) to a risk level label., Return the 0-based index of a stage in the canonical workflow. Returns -1 if… (+9 more)

### Community 31 - "procurement.py"
Cohesion: 0.14
Nodes (28): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, FindingReviewRequest, Any, BaseModel (+20 more)

### Community 32 - "test_documents.py"
Cohesion: 0.11
Nodes (17): process_ocr_from_bytes(), Run OCR directly on uploaded bytes (without storing first). Used by the…, _make_digital_pdf(), _map_db_doc_standalone(), _minimal_pdf_with_text(), Document pipeline tests — Person 2 additions. These tests are isolated from…, Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Produce the smallest valid PDF that embeds plain ASCII text. Used only as… (+9 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.16
Nodes (11): calculate_case_risk(), Any, date, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70)., Overdue legal opinion adds +15 points to the breakdown. (+3 more)

### Community 34 - "test_integrity_engine.py"
Cohesion: 0.07
Nodes (39): IntegrityAssessment, BaseModel, Consolidated integrity evaluation for a tender or bidder. Provides…, assess_bidder_integrity(), assess_tender_integrity(), Any, Primary entry point: Run comprehensive integrity assessment for a given tender.…, Run integrity evaluation focused on a specific bidder and its co-participants. (+31 more)

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.17
Nodes (10): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., Main entry point should return (text, confidence, engine) for a PDF. (+2 more)

### Community 36 - "feature_extractor.py"
Cohesion: 0.12
Nodes (22): extract_bidder_features(), extract_email_domain(), extract_pan_from_gstin(), extract_pincode(), get_tender_bidder_features(), normalize_address(), normalize_entity_name(), normalize_identifier() (+14 more)

### Community 37 - "ocr_service.py"
Cohesion: 0.16
Nodes (12): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, Tests for the PyMuPDF→Tesseract fallback pipeline. (+4 more)

### Community 38 - "calculate_risk"
Cohesion: 0.26
Nodes (6): calculate_risk(), Calculate a transparent risk score for a case. Args: case: Raw case dict from…, Backend tests for critical functionality. These tests use unit-testing patterns…, Tests for risk_service.py — no database needed., Helper to create a minimal case dict for risk calculation., TestRiskService

### Community 39 - "api/index.ts"
Cohesion: 0.11
Nodes (16): TableSkeleton(), Intelligence(), LA_WORKFLOW_STAGES, LandWorkflowStage, analyticsService, auditService, dashboardService, documentService (+8 more)

### Community 40 - "aggregate_integrity_findings"
Cohesion: 0.24
Nodes (10): aggregate_integrity_findings(), calculate_risk_tier(), generate_executive_summary(), IntegrityFinding, Generate an objective executive summary for procurement review., Map continuous 0-100 risk score to standard 4-tier risk classification., Deterministically aggregate multiple findings with diminishing returns to…, Given bids: A = ₹10,00,000 B = ₹10,01,000 C = ₹10,00,500 Detect… (+2 more)

### Community 41 - "RelationshipGraph.tsx"
Cohesion: 0.11
Nodes (18): BidderInput, BidderNodeData, buildGraph(), C, colForField(), edgeColorForField(), EdgeSel, fieldLabel() (+10 more)

### Community 42 - "case_service.py"
Cohesion: 0.10
Nodes (28): Update the status of a case (PENDING, APPROVED, DISPOSED, etc.)., update_status(), get_dashboard_metrics(), get, Returns aggregate operational statistics computed from the live database. Every…, Evaluate a single case and generate/update alerts as appropriate. Called…, refresh_alerts_for_case(), _create_audit_log() (+20 more)

### Community 43 - "TestDocumentStatus"
Cohesion: 0.22
Nodes (7): Tests for OCR status transitions and persistence logic., Document ocr_status values should be a known set., When process_ocr() succeeds, the DB record should be updated to COMPLETED. We…, When storage download fails, ocr_status must be set to FAILED., process_ocr() should raise ValueError when document_id is not found., TestDocumentStatus, patch

### Community 44 - "useAuth"
Cohesion: 0.15
Nodes (15): ProtectedRoute(), PublicRoute(), AppHeader(), GlobalSearchModal(), GovMainHeader(), SystemStatusDrawer(), useAuth(), INITIAL_ALERTS (+7 more)

### Community 45 - "GOIP — Government Operations Intelligence Platform"
Cohesion: 0.10
Nodes (20): 11. Running the Backend, 12. Database, 13. Live Data vs Mock Data, 14. Security & Data Handling, 15. Explainability Model, 16. Officer Decision Boundary, 18. Example Operational Scenario, 19. Why GOIP Is Different (+12 more)

### Community 46 - "generate_land_projects.py"
Cohesion: 0.31
Nodes (9): clamp(), generate_dataset(), generate_project(), Any, Land Acquisition Historical Dataset Generator…, Return True with the given probability., Generate a single synthetic land acquisition project record. Relationships…, weighted_bool() (+1 more)

### Community 47 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 48 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 49 - "BidderFeature"
Cohesion: 0.12
Nodes (16): BidderFeature, Normalized feature representation of a participating bidder., Vendor winning 8 of 9 historical tenders triggers REPEATED_WINNER_PATTERN with…, Two bidders sharing PAN / GSTIN generate RELATED_BIDDER with multi-attribute…, Multiple distinct signals combine into elevated risk tier while preventing…, Strict verification: Every finding MUST have evidence, reason, confidence, and…, Running assessment repeatedly on identical data produces exact identical scores…, Verify graceful handling for sparse datasets: no historical data, single… (+8 more)

### Community 50 - "verification_provider.py"
Cohesion: 0.28
Nodes (5): DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only…, VerificationProvider, VerificationResult, Protocol

### Community 51 - "get_expected_days"
Cohesion: 0.17
Nodes (8): get_project_bottlenecks(), get_expected_days(), Return the expected duration in days for a given stage., Verify the 11-stage canonical sequence., All stages have defined positive baseline durations., Stage next progression works as expected., Test probability to risk level mappings., TestLandWorkflow

### Community 52 - "Google Authentication with Supabase — Step-by-Step Setup Guide"
Cohesion: 0.15
Nodes (12): 1. Google Cloud Console Setup, 2. Supabase Dashboard Setup, 3. Database Sync Trigger (Optional but Recommended), 4. Local Environment Verification, Architecture Overview, Google Authentication with Supabase — Step-by-Step Setup Guide, Running the App:, Step 1.1: Create or Select a Project (+4 more)

### Community 53 - "get"
Cohesion: 0.10
Nodes (22): get_bidder_compliance(), get_bidder_detail(), get_document_evidence(), get_procurement_audit(), get_procurement_dashboard(), get_tender_detail(), get_tender_integrity_endpoint(), list_all_documents() (+14 more)

### Community 55 - "test_intelligence.py"
Cohesion: 0.18
Nodes (11): generate_recommendation(), Any, Generate a precise, rule-based operational recommendation for the responsible…, BottleneckInfo, Details of detected stage bottleneck for a case., Comprehensive Automated Test Suite for Case Intelligence & Risk Engine. All…, Tests for actionable operational recommendations and full intelligence pipeline., Overdue case recommends Section 5 condonation and emergency escalation. (+3 more)

### Community 56 - "Reports.tsx"
Cohesion: 0.15
Nodes (12): BIDDER_ASSESSMENTS, BidderAssessmentRecord, ExceptionRecord, EXCEPTIONS_DATA, OFFICER_REVIEWS, OfficerReviewRecord, Reports(), ReportType (+4 more)

### Community 57 - "Verification Results"
Cohesion: 0.22
Nodes (8): 1. Integrity Service Layer (`backend/app/services/integrity/`), 2. Read-Only API Endpoints (`backend/app/api/routes/procurement.py`), Backend Test Suite, Frontend Build, Graphify, Key Deliverables, Procurement Integrity Engine — Backend Foundation (Day 1 / Task 3), Verification Results

### Community 58 - "Case Intelligence & Risk Engine"
Cohesion: 0.17
Nodes (11): 1. Overview & Architecture, 2. Core Capabilities, 3. Risk Scoring Breakdown, 4. How Person 1 Integrates This Module, 5. Changing Thresholds and Configuration, 6. Running Automated Tests, A. Single Case Intelligence, B. Priority Ranking for Cases List (+3 more)

### Community 59 - "process_ocr"
Cohesion: 0.50
Nodes (4): process_ocr(), post, UploadFile, Accept a file, run OCR, and return extracted text + structured fields.…

### Community 60 - "analyze_bid_price_similarity"
Cohesion: 0.11
Nodes (24): analyze_bid_price_similarity(), _get_valid_quote(), Return the bidder's quote_amount as a float only if it is a valid positive…, Detect suspiciously close bid prices among participating vendors. Trigger: When…, _make_bidder(), Helper to create a BidderFeature for nullable quote tests., Scenario 1: All bidders have valid quotes — price similarity runs normally., Scenario 2: One bidder has None — excluded from price analysis, others still… (+16 more)

### Community 61 - "Graph Report - SIH  (2026-08-28)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - SIH  (2026-08-28), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 62 - "train.py"
Cohesion: 0.50
Nodes (3): ML Model Training Script — Land Acquisition Delay Prediction…, Full training pipeline: 1. Load dataset (generate if missing) 2. Validate…, train()

### Community 63 - "projects.py"
Cohesion: 0.18
Nodes (15): create_project(), _enrich_project_with_ml(), get_project(), get_project_prediction(), LandProjectCreate, LandProjectUpdate, list_projects(), BaseModel (+7 more)

### Community 64 - "intelligence/__init__.py"
Cohesion: 0.18
Nodes (13): Constants and Configuration for the Case Intelligence & Risk Engine. All…, Case Intelligence & Risk Engine Package. Provides transparent, deterministic…, Operational Recommendation Engine. Produces actionable, deterministic…, datetime, Explainable Risk Scoring Engine. Computes a deterministic, fully explainable…, CaseIntelligenceResult, DashboardIntelligenceSummary, BaseModel (+5 more)

### Community 65 - "2. Testing Endpoints via PowerShell / cURL"
Cohesion: 0.25
Nodes (7): 1. Complete API Contract Matrix, 1. Health Check, 2. Login, 2. Testing Endpoints via PowerShell / cURL, 3. Fetch Dashboard Metrics, 4. Fetch Ranked Cases (Case Intelligence Engine), GOIP — API Integration Checklist & Contract Verification

### Community 66 - "1. Integrity Module (`backend/app/services/integrity/`)"
Cohesion: 0.12
Nodes (16): 1. Integrity Module (`backend/app/services/integrity/`), 2. API Routes (`backend/app/api/routes/procurement.py`), 3. Unit Tests (`backend/tests/test_integrity_engine.py`), Automated Tests, Implementation Plan - Procurement Integrity Engine (Backend Foundation), [MODIFY] [procurement.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/api/routes/procurement.py), [NEW] [test_integrity_engine.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/tests/test_integrity_engine.py), [NEW/UPDATE] [bid_analyzer.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/bid_analyzer.py) (+8 more)

### Community 67 - "17. Demonstration Flow"
Cohesion: 0.25
Nodes (8): 17. Demonstration Flow, 1. Sign In, 2. Dashboard, 3. Workflow, 4. Case Intelligence, 5. Document Intelligence, 6. Simulation, 7. Decision Support

### Community 68 - "LanguageContext.tsx"
Cohesion: 0.23
Nodes (8): Language, LanguageContext, LanguageContextType, LanguageProvider(), TranslationKey, translations, en, hi

### Community 72 - "AuthContext.tsx"
Cohesion: 0.36
Nodes (8): AuthContext, AuthContextType, AuthProvider(), isSupabaseConfigured(), mapSupabaseUserToAppUser(), supabase, authService, User

### Community 73 - "21. Development Principles"
Cohesion: 0.29
Nodes (7): 21. Development Principles, Deterministic rules remain deterministic, Evidence over assumptions, Explainability matters, Human decisions remain human, Mock mode is not production data, Small, composable intelligence services

### Community 74 - "3. Key Capabilities"
Cohesion: 0.29
Nodes (7): 3.1 Process Discovery, 3.2 Bottleneck & Rework Detection, 3.3 Delay-Risk Prediction, 3.4 Deterministic Statutory Deadline Engine, 3.5 What-If Simulation, 3.6 Document Intake & OCR, 3. Key Capabilities

### Community 75 - "auth.py"
Cohesion: 0.14
Nodes (22): _create_default_profile(), get_me(), login(), logout(), get, post, Authentication routes. Delegates to Supabase Auth for actual credential…, Authenticate using Supabase Auth or local officer credentials. Returns a valid… (+14 more)

### Community 88 - "TestMLPrediction"
Cohesion: 0.18
Nodes (6): Confirm forbidden target columns are NOT in input features., Feature vector handles empty/partial dictionaries gracefully., Model produces probability in [0.0, 1.0] and valid risk levels., Clean project with 100% docs and no disputes should be low risk., Project with active conflict, dispute, and compensation delay is high risk., TestMLPrediction

### Community 89 - "GOIP — Environment Variables & Configuration Guide"
Cohesion: 0.33
Nodes (5): 1. Backend Environment Variables (`backend/.env`), 2. Frontend Environment Variables (`.env`), Backend `.env` Template, Frontend `.env` Template, GOIP — Environment Variables & Configuration Guide

### Community 90 - "8. Typical Data Flow"
Cohesion: 0.50
Nodes (4): 8. Typical Data Flow, Case Intelligence, Document Intelligence, Simulation

### Community 91 - "ProcurementContext.tsx"
Cohesion: 0.11
Nodes (19): AuditEvent, Bidder, CheckStatus, compliantRequirements, Discrepancy, exceptionRequirements, initialBidders, nowTime() (+11 more)

### Community 92 - "10. Environment Configuration"
Cohesion: 0.67
Nodes (3): 10. Environment Configuration, Development / Mock Mode, Live Backend Mode

### Community 93 - "5. Technology Stack"
Cohesion: 0.67
Nodes (3): 5. Technology Stack, Backend / Intelligence, Frontend

### Community 94 - "9. Getting Started"
Cohesion: 0.67
Nodes (3): 9. Getting Started, Frontend Installation, Prerequisites

### Community 95 - "UX4G (User Experience for Government) Design Guidelines"
Cohesion: 0.17
Nodes (11): 1. Overview & Core Philosophy, 2. Color Palette & Semantic Tokens, 3. Typography & Hierarchy, 4.1. Status Badges (`GovBadge`), 4.2. Action Buttons (`GovButton`), 4.3. High-Density Tables (`GovTable`), 4. Standard UI Components, 5. Bilingual & GIGW Standards (+3 more)

### Community 98 - "Enum"
Cohesion: 0.29
Nodes (12): CaseStage, CaseStatus, LegalOpinionStatus, MovementStatus, OCRStatus, PriorityLevel, Enum, str (+4 more)

### Community 99 - "seed_initial_data"
Cohesion: 0.29
Nodes (6): Seed synthetic procurement history with realistic multi-scenario data., seed_initial_data(), Synthetic Procurement History & Integrity Dataset Generator — SIH26100…, Populate the SQLite database with the complete deterministic procurement…, seed_synthetic_procurement_history(), Connection

### Community 100 - "predict_delay"
Cohesion: 0.21
Nodes (15): get_project_delay_factors(), get_feature_importance(), Return feature importance dict, or empty dict if not available., _deterministic_fallback(), _estimate_delay_days(), _get_top_factors(), _get_top_factors_with_importance(), predict_delay() (+7 more)

### Community 101 - "extract_la_fields"
Cohesion: 0.17
Nodes (12): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+4 more)

### Community 103 - "priority_engine.py"
Cohesion: 0.24
Nodes (14): classify_deadline_status(), determine_delay_status(), Determine composite operational delay status., Classify a case's deadline urgency based on days remaining. Classification…, aggregate_dashboard_intelligence(), compute_case_intelligence(), Any, date (+6 more)

### Community 104 - "get_document"
Cohesion: 0.18
Nodes (11): download_document(), get_document(), get_document_status(), list_documents(), get, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.…, Lightweight endpoint for polling OCR processing status. Returns: {id,… (+3 more)

### Community 105 - "App.tsx"
Cohesion: 0.16
Nodes (15): App(), useProcurement(), ProcurementAuditTrail(), ProcurementDashboard(), ExtractedField, ProcurementDocuments(), Search(), Tenders() (+7 more)

### Community 107 - "alert_service.py"
Cohesion: 0.22
Nodes (8): post, Re-evaluate all active cases and generate/update alerts accordingly., trigger_alert_refresh(), _create_alert(), Alert Service — generates real, data-driven alerts from the database. No random…, Run alert generation across ALL active cases. Call this on a schedule or after…, Insert a new alert if one of the same type for this case doesn't already exist.…, run_global_alert_refresh()

### Community 109 - "test_procurement_persistence.py"
Cohesion: 0.25
Nodes (5): auth_client(), fixture, Integration and Persistence Tests for Procurement Pipeline (SIH26100)…, test_document_upload_ocr_compliance_flow(), test_officer_decision_and_audit_trail()

### Community 111 - "model_loader.py"
Cohesion: 0.22
Nodes (8): is_model_ready(), load_model(), Any, Model Loader — Singleton model loading for inference.…, Load the trained RandomForest model from disk. Returns None if the model file…, Return True if the model has been trained and is ready for inference., Clear the singleton cache. Mainly for testing., reset_cache()

### Community 112 - "get_case"
Cohesion: 0.40
Nodes (5): get_case(), list_cases(), get, List cases with optional filtering and pagination. Officers see all cases…, Returns a single case with its complete: - File movement timeline (events) -…

### Community 113 - "TestPriorityAndDashboardAggregation"
Cohesion: 0.33
Nodes (4): Tests for case priority ranking and executive dashboard KPI computation., Ranks cases in correct operational hierarchy: 1. Overdue first (regardless of…, aggregate_dashboard_intelligence computes real KPI numbers correctly., TestPriorityAndDashboardAggregation

### Community 114 - "get_bidder_by_id"
Cohesion: 0.40
Nodes (5): get_bidder_documents_list(), get_bidder_integrity_endpoint(), Fetch all documents attached to a specific bidder., Run deterministic integrity analysis for a specific bidder., get_bidder_by_id()

### Community 116 - "list_alerts"
Cohesion: 0.67
Nodes (3): list_alerts(), get, List all alerts. Filter by read status or severity.

## Knowledge Gaps
- **396 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+391 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `seed.py`, `predict_delay`, `security.py`, `get_document`, `case_service.py`, `auth.py`, `alert_service.py`, `get_expected_days`, `list_alerts`, `document_service.py`, `cases.py`, `test_land_acquisition.py`, `projects.py`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `test_documents.py`, `calculate_risk`, `document_service.py`, `process_ocr`, `procurement.py`, `projects.py`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `get_current_user()` connect `security.py` to `test_integrity_engine.py`, `get_supabase`, `auth.py`, `test_procurement_persistence.py`, `cases.py`, `projects.py`, `procurement.py`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `assess_tender_integrity()` (e.g. with `BidderFeature` and `IntegrityFinding`) actually correct?**
  _`assess_tender_integrity()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `RiskLevel` (e.g. with `analyze_bid_price_similarity()` and `analyze_bid_rotation()`) actually correct?**
  _`RiskLevel` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _396 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `seed.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._