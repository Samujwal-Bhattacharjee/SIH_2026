# Graph Report - SIH  (2026-08-31)

## Corpus Check
- 174 files · ~136,869 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1719 nodes · 3432 edges · 107 communities (96 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ac48c06`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- seed.py
- TestFieldExtraction
- priority_engine.py
- AppLayout.tsx
- types/index.ts
- security.py
- get_supabase
- calculate_deadline_status
- procurement.py
- ProcurementIntegrity.tsx
- case_service.py
- Communities (88 total, 14 thin omitted)
- compilerOptions
- procurement_service.py
- UploadDocument.tsx
- test_integrity_engine.py
- mockApi.ts
- schemas/__init__.py
- GOIP Backend API Contract Specification
- validate_file
- detect_case_bottleneck
- api/index.ts
- process_ocr
- cases.py
- dependencies
- GOIP Backend — Government File Tracking & Administrative Intelligence System
- compilerOptions
- FileDetail.tsx
- devDependencies
- SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation
- projects.py
- deadline_service.py
- process_ocr_from_bytes
- calculate_case_risk
- predict_delay
- extract_text_from_pdf_digital
- extract_fields_from_text
- test_documents.py
- calculate_risk
- react
- extract_la_fields
- RelationshipGraph.tsx
- enrich_case_with_deadlines
- TestDocumentStatus
- useAuth
- GOIP — Government Operations Intelligence Platform
- generate_land_projects.py
- plugins
- package.json
- get_document
- verification_provider.py
- get_risk_level_from_probability
- Google Authentication with Supabase — Step-by-Step Setup Guide
- _map_db_doc_standalone
- test_auth_integration.py
- test_intelligence.py
- Reports.tsx
- Verification Results
- Case Intelligence & Risk Engine
- process_ocr
- Settings
- Graph Report - SIH  (2026-08-28)
- train.py
- test_land_acquisition.py
- intelligence/__init__.py
- 2. Testing Endpoints via PowerShell / cURL
- 1. Integrity Module (`backend/app/services/integrity/`)
- 17. Demonstration Flow
- LanguageContext.tsx
- vite-env.d.ts
- tsconfig.json
- vercel.json
- realApi.ts
- 21. Development Principles
- 3. Key Capabilities
- auth.py
- TestMLPrediction
- GOIP — Environment Variables & Configuration Guide
- 8. Typical Data Flow
- model_loader.py
- 10. Environment Configuration
- 5. Technology Stack
- 9. Getting Started
- UX4G (User Experience for Government) Design Guidelines
- react-router-dom
- @tailwindcss/postcss
- Enum
- ProcurementContext.tsx
- generate_la_recommendations
- VerificationHub.tsx
- @supabase/supabase-js
- tailwindcss
- lucide-react
- App.tsx
- tailwind-merge

## God Nodes (most connected - your core abstractions)
1. `react` - 66 edges
2. `get_supabase()` - 66 edges
3. `Communities (88 total, 14 thin omitted)` - 63 edges
4. `validate_file()` - 28 edges
5. `assess_tender_integrity()` - 28 edges
6. `GOIP — Government Operations Intelligence Platform` - 27 edges
7. `BidderFeature` - 26 edges
8. `predict_delay()` - 25 edges
9. `init_db()` - 24 edges
10. `RiskLevel` - 24 edges

## Surprising Connections (you probably didn't know these)
- `generate_recommendation()` --uses--> `BottleneckInfo`  [INFERRED]
  backend/app/services/intelligence/recommendation_engine.py → backend/app/services/intelligence/schemas.py
- `generate_la_recommendations()` --uses--> `BottleneckInfo`  [INFERRED]
  backend/app/services/intelligence/recommendation_engine.py → backend/app/services/intelligence/schemas.py
- `TestRecommendationsAndIntelligence` --uses--> `BottleneckInfo`  [INFERRED]
  backend/tests/test_intelligence.py → backend/app/services/intelligence/schemas.py
- `list_alerts()` --calls--> `get_supabase()`  [EXTRACTED]
  backend/app/api/routes/alerts.py → backend/app/core/database.py
- `mark_alert_read()` --calls--> `get_supabase()`  [EXTRACTED]
  backend/app/api/routes/alerts.py → backend/app/core/database.py

## Import Cycles
- None detected.

## Communities (107 total, 11 thin omitted)

### Community 0 - "seed.py"
Cohesion: 0.15
Nodes (12): calculate_deadline(), Calculate the limitation deadline. Args: start_date: ISO date string (YYYY-MM-…, main(), random_date(), Generate a random past date within the given range., seed_case_actions(), seed_cases(), seed_departments() (+4 more)

### Community 1 - "TestFieldExtraction"
Cohesion: 0.18
Nodes (4): Tests for regex-based structured field extraction., Helper: run extraction and return {key: value} dict., Smoke test: realistic court order text extracts at least case number and court., TestFieldExtraction

### Community 2 - "priority_engine.py"
Cohesion: 0.24
Nodes (14): classify_deadline_status(), determine_delay_status(), Determine composite operational delay status., Classify a case's deadline urgency based on days remaining. Classification…, aggregate_dashboard_intelligence(), compute_case_intelligence(), Any, date (+6 more)

### Community 3 - "AppLayout.tsx"
Cohesion: 0.17
Nodes (13): Emblem(), EmblemProps, AppLayout(), GovBreadcrumb(), GovFooter(), GovHorizontalNav(), NavItem, GovNotificationTicker() (+5 more)

### Community 4 - "types/index.ts"
Cohesion: 0.08
Nodes (23): RiskAttributionPanelProps, FileMovementTimeline(), FileMovementTimelineProps, CustomWorkflowNode, WorkflowDrawerProps, CaseEvent, CaseStage, CaseStatus (+15 more)

### Community 5 - "security.py"
Cohesion: 0.08
Nodes (29): Dashboard route — returns real aggregate statistics from the database. No…, Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, check_verification(), BaseModel, get, post, verification_sources() (+21 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "calculate_deadline_status"
Cohesion: 0.09
Nodes (25): calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), normalize_to_date(), date, datetime, Deadline & Limitation Calculation Engine. Provides transparent, deterministic… (+17 more)

### Community 8 - "procurement.py"
Cohesion: 0.06
Nodes (86): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, get_bidder_compliance(), get_bidder_detail(), get_bidder_documents_list() (+78 more)

### Community 9 - "ProcurementIntegrity.tsx"
Cohesion: 0.18
Nodes (11): AppSidebar(), NAV_ITEMS, ProcurementIntegrity(), SIGNAL_LABELS, Settings(), apiClient, isUsingMockApi(), mockApi (+3 more)

### Community 10 - "case_service.py"
Cohesion: 0.13
Nodes (20): get_dashboard_metrics(), get, Returns aggregate operational statistics computed from the live database. Every…, _create_audit_log(), forward_case(), get_case_by_id(), _map_db_case_to_frontend(), _map_db_doc_to_frontend() (+12 more)

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
Cohesion: 0.13
Nodes (25): FormField(), FormFieldProps, inputBaseClasses, inputErrorClasses, selectBaseClasses, textareaBaseClasses, FileForwardModal(), FileForwardModalProps (+17 more)

### Community 15 - "test_integrity_engine.py"
Cohesion: 0.05
Nodes (101): analyze_bid_price_similarity(), analyze_bid_rotation(), analyze_repeated_participation(), analyze_winner_concentration(), Any, IntegrityFinding, Bid & Historical Pattern Analyzer — Procurement Integrity Engine…, Detect disproportionate historical award concentration for any current… (+93 more)

### Community 16 - "mockApi.ts"
Cohesion: 0.15
Nodes (18): MOCK_AUDIT_LOGS, MOCK_BOTTLENECKS, MOCK_CASE_EVENTS, MOCK_CASES, MOCK_DASHBOARD_METRICS, MOCK_DOCUMENTS, MOCK_PERFORMANCE_METRICS, MOCK_PROCESS_MAP (+10 more)

### Community 17 - "schemas/__init__.py"
Cohesion: 0.14
Nodes (25): AlertOut, AuditLogOut, BottleneckAnalysis, CaseEventOut, CaseListResponse, CaseOut, DashboardMetrics, DepartmentInfo (+17 more)

### Community 18 - "GOIP Backend API Contract Specification"
Cohesion: 0.08
Nodes (25): 1. Authentication, 2. Dashboard Operations, 3. Case Intelligence, 4. Process Mining & Workflow, 5. Risk Intelligence, 6. Documents & OCR, 7. What-If Simulation, 8. Analytics & Conformance (+17 more)

### Community 19 - "validate_file"
Cohesion: 0.14
Nodes (7): Validate file type and size. Returns error message string if invalid, None if…, validate_file(), Tests for file validation logic., TestDocumentValidation, Tests for file validation logic., A 0-byte file passes size validation (content validation is separate)., TestInvalidFileRejection

### Community 20 - "detect_case_bottleneck"
Cohesion: 0.12
Nodes (18): calculate_stage_dwell_days(), detect_case_bottleneck(), Any, date, datetime, Bottleneck and File Stagnation Detection Engine. Analyzes case stage…, Calculate the number of days a case has been pending at its current stage.…, Evaluate whether the case is currently stuck in a workflow bottleneck. Returns:… (+10 more)

### Community 21 - "api/index.ts"
Cohesion: 0.11
Nodes (19): GovTable(), GovTableProps, TableColumn, DISTRICTS, LA_STAGES, RISK_LEVELS, auditService, dashboardService (+11 more)

### Community 22 - "process_ocr"
Cohesion: 0.18
Nodes (12): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), UploadFile, upload_project_document() (+4 more)

### Community 23 - "cases.py"
Cohesion: 0.10
Nodes (25): create_case(), delete_case(), forward_case(), get_case(), list_cases(), get, post, put (+17 more)

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
Nodes (20): GovBadge, StatusBadge(), StatusBadgeProps, GovCard(), GovCardProps, GovModal(), GovModalProps, DOCUMENT_TYPES (+12 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, oxlint, devDependencies, autoprefixer, oxlint, postcss, @types/node, @types/react (+11 more)

### Community 29 - "SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation"
Cohesion: 0.09
Nodes (22): 10. Team Task Allocation & Responsibilities, 11. Exact File Ownership Matrix, 12. Task Priority Framework (P0 – P3), 13. Practical 7-Day Execution Timeline, 14. 5-Minute SIH Winning Demo Script, 15. Remaining Risks & Mitigations, 1. Project Architecture, 2. Current Implementation Status Matrix (+14 more)

### Community 30 - "projects.py"
Cohesion: 0.17
Nodes (16): create_project(), _enrich_project_with_ml(), get_project(), get_project_prediction(), LandProjectCreate, LandProjectUpdate, list_projects(), BaseModel (+8 more)

### Community 31 - "deadline_service.py"
Cohesion: 0.08
Nodes (23): calculate_age_days(), calculate_days_remaining(), get_deadline_status(), map_deadline_status_to_case_status(), map_deadline_status_to_priority(), map_deadline_status_to_risk_level(), parse_iso_date(), parse_iso_datetime() (+15 more)

### Community 32 - "process_ocr_from_bytes"
Cohesion: 0.18
Nodes (10): process_ocr_from_bytes(), Run OCR directly on uploaded bytes (without storing first). Used by the…, _make_digital_pdf(), Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Tests for API response shapes using the document_service module directly. These…, validate_file() returns None when the file is valid., validate_file() returns an error string when validation fails., process_ocr_from_bytes() should return a dict with all required OCRResult… (+2 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.16
Nodes (11): calculate_case_risk(), Any, date, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70)., Overdue legal opinion adds +15 points to the breakdown. (+3 more)

### Community 34 - "predict_delay"
Cohesion: 0.21
Nodes (15): get_project_delay_factors(), get_feature_importance(), Return feature importance dict, or empty dict if not available., _deterministic_fallback(), _estimate_delay_days(), _get_top_factors(), _get_top_factors_with_importance(), predict_delay() (+7 more)

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.17
Nodes (10): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., Main entry point should return (text, confidence, engine) for a PDF. (+2 more)

### Community 36 - "extract_fields_from_text"
Cohesion: 0.15
Nodes (8): extract_fields_from_text(), Attempt to extract structured fields from raw OCR text using regex patterns.…, Backend tests for critical functionality. These tests use unit-testing patterns…, Tests for regex-based field extraction in ocr_service.py., TestOCRService, Fields not found should be absent from the list, not present with null., All confidence scores must be between 0 and 1., All regex-extracted fields should have isExtracted=True.

### Community 37 - "test_documents.py"
Cohesion: 0.13
Nodes (15): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, _minimal_pdf_with_text() (+7 more)

### Community 38 - "calculate_risk"
Cohesion: 0.31
Nodes (5): calculate_risk(), Calculate a transparent risk score for a case. Args: case: Raw case dict from…, Tests for risk_service.py — no database needed., Helper to create a minimal case dict for risk calculation., TestRiskService

### Community 39 - "react"
Cohesion: 0.10
Nodes (15): react, StatutoryDeadlineEngineProps, EmptyStateProps, GovButton(), GovButtonProps, TableSkeleton(), StatutoryCountdownProps, TechnicalCardProps (+7 more)

### Community 40 - "extract_la_fields"
Cohesion: 0.17
Nodes (12): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+4 more)

### Community 41 - "RelationshipGraph.tsx"
Cohesion: 0.11
Nodes (18): BidderInput, BidderNodeData, buildGraph(), C, colForField(), edgeColorForField(), EdgeSel, fieldLabel() (+10 more)

### Community 42 - "enrich_case_with_deadlines"
Cohesion: 0.11
Nodes (21): list_alerts(), mark_alert_read(), get, post, put, List all alerts. Filter by read status or severity., Mark a specific alert as read., Re-evaluate all active cases and generate/update alerts accordingly. (+13 more)

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

### Community 49 - "get_document"
Cohesion: 0.18
Nodes (11): download_document(), get_document(), get_document_status(), list_documents(), get, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.…, Lightweight endpoint for polling OCR processing status. Returns: {id,… (+3 more)

### Community 50 - "verification_provider.py"
Cohesion: 0.28
Nodes (5): DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only…, VerificationProvider, VerificationResult, Protocol

### Community 51 - "get_risk_level_from_probability"
Cohesion: 0.18
Nodes (7): get_risk_level_from_probability(), Convert a delay probability (0.0–1.0) to a risk level label., Verify the 11-stage canonical sequence., All stages have defined positive baseline durations., Stage next progression works as expected., Test probability to risk level mappings., TestLandWorkflow

### Community 52 - "Google Authentication with Supabase — Step-by-Step Setup Guide"
Cohesion: 0.15
Nodes (12): 1. Google Cloud Console Setup, 2. Supabase Dashboard Setup, 3. Database Sync Trigger (Optional but Recommended), 4. Local Environment Verification, Architecture Overview, Google Authentication with Supabase — Step-by-Step Setup Guide, Running the App:, Step 1.1: Create or Select a Project (+4 more)

### Community 53 - "_map_db_doc_standalone"
Cohesion: 0.25
Nodes (5): _map_db_doc_standalone(), Inline version of _map_db_doc_to_frontend for tests that cannot import…, _map_db_doc_to_frontend() returns all required DocumentRecord fields., ocrResult should be populated when extracted_text is present., ocrResult should be None when extracted_text and extracted_fields are both None.

### Community 55 - "test_intelligence.py"
Cohesion: 0.12
Nodes (12): generate_recommendation(), Generate a precise, rule-based operational recommendation for the responsible…, Comprehensive Automated Test Suite for Case Intelligence & Risk Engine. All…, Tests for actionable operational recommendations and full intelligence pipeline., Overdue case recommends Section 5 condonation and emergency escalation., Approaching deadline + bottleneck recommends fast-tracking file., compute_case_intelligence produces a complete CaseIntelligenceResult model., Tests for case priority ranking and executive dashboard KPI computation. (+4 more)

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

### Community 61 - "Graph Report - SIH  (2026-08-28)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - SIH  (2026-08-28), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 62 - "train.py"
Cohesion: 0.50
Nodes (3): ML Model Training Script — Land Acquisition Delay Prediction…, Full training pipeline: 1. Load dataset (generate if missing) 2. Validate…, train()

### Community 63 - "test_land_acquisition.py"
Cohesion: 0.19
Nodes (13): get_project_bottlenecks(), get_project_timeline(), get_expected_days(), get_next_stage(), get_stage_index(), Land Acquisition Workflow Constants — SIH26017…, Return the 0-based index of a stage in the canonical workflow. Returns -1 if…, Return the next stage after the current one, or None if at the end. (+5 more)

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

### Community 72 - "realApi.ts"
Cohesion: 0.33
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

### Community 91 - "model_loader.py"
Cohesion: 0.22
Nodes (8): is_model_ready(), load_model(), Any, Model Loader — Singleton model loading for inference.…, Load the trained RandomForest model from disk. Returns None if the model file…, Return True if the model has been trained and is ready for inference., Clear the singleton cache. Mainly for testing., reset_cache()

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

### Community 99 - "ProcurementContext.tsx"
Cohesion: 0.11
Nodes (18): AuditEvent, Bidder, CheckStatus, compliantRequirements, Discrepancy, exceptionRequirements, initialBidders, nowTime() (+10 more)

### Community 100 - "generate_la_recommendations"
Cohesion: 0.29
Nodes (6): get_project_recommendations(), generate_la_recommendations(), Any, Generate structured, transparent operational recommendations for Land…, Recommendations match detected factors., TestBottleneckAndRecommendations

### Community 101 - "VerificationHub.tsx"
Cohesion: 0.60
Nodes (4): riskBadge(), STATUS_META, statusBadge(), VerificationHub()

### Community 107 - "App.tsx"
Cohesion: 0.20
Nodes (11): App(), useProcurement(), ProcurementAuditTrail(), ProcurementDashboard(), ExtractedField, ProcurementDocuments(), Search(), Tenders() (+3 more)

## Knowledge Gaps
- **397 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `seed.py`, `predict_delay`, `generate_la_recommendations`, `security.py`, `case_service.py`, `enrich_case_with_deadlines`, `auth.py`, `get_document`, `process_ocr`, `cases.py`, `projects.py`, `test_land_acquisition.py`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `process_ocr_from_bytes`, `extract_fields_from_text`, `security.py`, `test_documents.py`, `procurement.py`, `process_ocr`, `process_ocr`, `projects.py`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `get_current_user()` connect `security.py` to `get_supabase`, `procurement.py`, `enrich_case_with_deadlines`, `auth.py`, `test_integrity_engine.py`, `cases.py`, `projects.py`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _397 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `seed.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08266129032258064 - nodes in this community are weakly interconnected._
- **Should `security.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07965860597439545 - nodes in this community are weakly interconnected._