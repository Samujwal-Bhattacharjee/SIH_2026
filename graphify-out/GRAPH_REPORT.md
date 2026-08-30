# Graph Report - SIH  (2026-08-30)

## Corpus Check
- 171 files · ~129,710 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1668 nodes · 3341 edges · 99 communities (89 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf73c602`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- predict_delay
- TestFieldExtraction
- intelligence/__init__.py
- AppLayout.tsx
- types/index.ts
- cases.py
- get_supabase
- TestDeadlineCalculations
- procurement.py
- ProcurementContext.tsx
- case_service.py
- Communities (88 total, 14 thin omitted)
- compilerOptions
- procurement_service.py
- FileRegisterModal.tsx
- test_integrity_engine.py
- mockApi.ts
- schemas/__init__.py
- GOIP Backend API Contract Specification
- validate_file
- TestBottleneckDetection
- AuditLogs.tsx
- TestPriorityAndDashboardAggregation
- create_case
- dependencies
- GOIP Backend — Government File Tracking & Administrative Intelligence System
- compilerOptions
- api/index.ts
- devDependencies
- SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation
- projects.py
- deadline_service.py
- process_ocr_from_bytes
- calculate_case_risk
- delete_case
- extract_text_from_pdf_digital
- update_case
- test_documents.py
- calculate_risk
- react
- get_case
- App.tsx
- oxlint
- TestDocumentStatus
- SystemContext.tsx
- GOIP — Government Operations Intelligence Platform
- generate_land_projects.py
- plugins
- package.json
- _map_db_doc_to_frontend
- verification_provider.py
- TestLandWorkflow
- Google Authentication with Supabase — Step-by-Step Setup Guide
- _map_db_doc_standalone
- test_auth_integration.py
- BottleneckInfo
- Reports.tsx
- Verification Results
- Case Intelligence & Risk Engine
- process_ocr
- Settings
- Graph Report - SIH  (2026-08-28)
- train.py
- test_land_acquisition.py
- intelligence/risk_engine.py
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
- @xyflow/react
- GOIP — Environment Variables & Configuration Guide
- 8. Typical Data Flow
- 10. Environment Configuration
- 5. Technology Stack
- 9. Getting Started
- react-dom
- react-router-dom
- @tailwindcss/postcss
- UploadDocument.tsx
- mark_alert_read
- useProcurement

## God Nodes (most connected - your core abstractions)
1. `get_supabase()` - 66 edges
2. `react` - 64 edges
3. `Communities (88 total, 14 thin omitted)` - 63 edges
4. `validate_file()` - 28 edges
5. `assess_tender_integrity()` - 27 edges
6. `GOIP — Government Operations Intelligence Platform` - 27 edges
7. `BidderFeature` - 26 edges
8. `predict_delay()` - 25 edges
9. `init_db()` - 24 edges
10. `RiskLevel` - 24 edges

## Surprising Connections (you probably didn't know these)
- `DocumentUploadModalProps` --references--> `DocumentRecord`  [EXTRACTED]
  src/components/documents/DocumentUploadModal.tsx → src/types/index.ts
- `list_alerts()` --calls--> `get_supabase()`  [EXTRACTED]
  backend/app/api/routes/alerts.py → backend/app/core/database.py
- `mark_alert_read()` --calls--> `get_supabase()`  [EXTRACTED]
  backend/app/api/routes/alerts.py → backend/app/core/database.py
- `register()` --calls--> `get_supabase()`  [EXTRACTED]
  backend/app/api/routes/auth.py → backend/app/core/database.py
- `login()` --calls--> `get_supabase()`  [EXTRACTED]
  backend/app/api/routes/auth.py → backend/app/core/database.py

## Import Cycles
- None detected.

## Communities (99 total, 10 thin omitted)

### Community 0 - "predict_delay"
Cohesion: 0.05
Nodes (42): get_risk_level_from_probability(), Convert a delay probability (0.0–1.0) to a risk level label., build_feature_vector(), Extract feature values from a project data dictionary. Args: project_data:…, get_feature_importance(), is_model_ready(), load_model(), Any (+34 more)

### Community 1 - "TestFieldExtraction"
Cohesion: 0.06
Nodes (23): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+15 more)

### Community 2 - "intelligence/__init__.py"
Cohesion: 0.16
Nodes (29): calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), classify_deadline_status(), determine_delay_status(), normalize_to_date(), date (+21 more)

### Community 3 - "AppLayout.tsx"
Cohesion: 0.18
Nodes (13): Emblem(), EmblemProps, GovBreadcrumb(), GovFooter(), GovHorizontalNav(), NavItem, GovMainHeader(), GovNotificationTicker() (+5 more)

### Community 4 - "types/index.ts"
Cohesion: 0.08
Nodes (24): RiskAttributionPanelProps, FileMovementTimeline(), FileMovementTimelineProps, CustomWorkflowNode, WorkflowDrawerProps, BottleneckAnalysis, CaseEvent, CaseStage (+16 more)

### Community 5 - "cases.py"
Cohesion: 0.08
Nodes (33): list_alerts(), get, List all alerts. Filter by read status or severity., Cases routes — CRUD endpoints for case management. All business logic delegated…, Dashboard route — returns real aggregate statistics from the database. No…, Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, check_verification() (+25 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "TestDeadlineCalculations"
Cohesion: 0.09
Nodes (12): Past deadline is classified as OVERDUE with negative days., Calculates age in days accurately., Projects future deadline given start date and day count., Tests for deterministic deadline arithmetic and classification., Case with missing deadline returns None days and UNKNOWN status., Deadline 60 days in the future is classified as SAFE., Deadline 30 days in the future is classified as WATCH., Deadline 15 days in the future is classified as HIGH. (+4 more)

### Community 8 - "procurement.py"
Cohesion: 0.06
Nodes (86): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, get_bidder_compliance(), get_bidder_detail(), get_bidder_documents_list() (+78 more)

### Community 9 - "ProcurementContext.tsx"
Cohesion: 0.09
Nodes (25): AppSidebar(), NAV_ITEMS, AuditEvent, Bidder, CheckStatus, compliantRequirements, Discrepancy, exceptionRequirements (+17 more)

### Community 10 - "case_service.py"
Cohesion: 0.08
Nodes (34): post, Re-evaluate all active cases and generate/update alerts accordingly., trigger_alert_refresh(), Update the status of a case (PENDING, APPROVED, DISPOSED, etc.)., update_status(), get_dashboard_metrics(), get, Returns aggregate operational statistics computed from the live database. Every… (+26 more)

### Community 11 - "Communities (88 total, 14 thin omitted)"
Cohesion: 0.03
Nodes (63): Communities (88 total, 14 thin omitted), Community 0 - "projects.py", Community 10 - "case_service.py", Community 11 - "ocr_service.py", Community 12 - "compilerOptions", Community 13 - "procurement_service.py", Community 14 - "UploadDocument.tsx", Community 15 - "api/index.ts" (+55 more)

### Community 12 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, src, vite/client, vite-env.d.ts, compilerOptions, allowImportingTsExtensions (+19 more)

### Community 13 - "procurement_service.py"
Cohesion: 0.05
Nodes (44): classify_document_type(), extract_procurement_fields(), Extract procurement-specific structured fields from OCR text. Used for bid…, Classify a document type from its OCR text using deterministic rules. Returns a…, calculate_compliance_score(), calculate_risk_level(), check_blacklisting_declaration(), check_gst_present() (+36 more)

### Community 14 - "FileRegisterModal.tsx"
Cohesion: 0.10
Nodes (27): EmptyStateProps, FormField(), FormFieldProps, inputBaseClasses, inputErrorClasses, selectBaseClasses, textareaBaseClasses, GovButton() (+19 more)

### Community 15 - "test_integrity_engine.py"
Cohesion: 0.05
Nodes (97): analyze_bid_price_similarity(), analyze_bid_rotation(), analyze_repeated_participation(), analyze_winner_concentration(), Any, Bid & Historical Pattern Analyzer — Procurement Integrity Engine…, Detect disproportionate historical award concentration for any current…, Detect repeated joint participation of the same bidder cohort across multiple… (+89 more)

### Community 16 - "mockApi.ts"
Cohesion: 0.12
Nodes (27): MOCK_AUDIT_LOGS, MOCK_BOTTLENECKS, MOCK_CASE_EVENTS, MOCK_CASES, MOCK_DASHBOARD_METRICS, MOCK_DEPARTMENTS, MOCK_DOCUMENTS, MOCK_OFFICERS (+19 more)

### Community 17 - "schemas/__init__.py"
Cohesion: 0.06
Nodes (61): _create_default_profile(), get_me(), login(), logout(), get, post, Authentication routes. Delegates to Supabase Auth for actual credential…, Authenticate using Supabase Auth. Returns the Supabase JWT token and the user… (+53 more)

### Community 18 - "GOIP Backend API Contract Specification"
Cohesion: 0.08
Nodes (25): 1. Authentication, 2. Dashboard Operations, 3. Case Intelligence, 4. Process Mining & Workflow, 5. Risk Intelligence, 6. Documents & OCR, 7. What-If Simulation, 8. Analytics & Conformance (+17 more)

### Community 19 - "validate_file"
Cohesion: 0.14
Nodes (7): Validate file type and size. Returns error message string if invalid, None if…, validate_file(), Tests for file validation logic., TestDocumentValidation, Tests for file validation logic., A 0-byte file passes size validation (content validation is separate)., TestInvalidFileRejection

### Community 20 - "TestBottleneckDetection"
Cohesion: 0.17
Nodes (7): Tests for file stagnation and workflow bottleneck detection., File pending 3 days at Officer Review is not a bottleneck., File pending 10 days (>7 days) is flagged as MODERATE bottleneck., File pending 16 days (>15 days) is flagged as CRITICAL bottleneck., Uses movement log timestamps to determine dwell days accurately., Resolved or disposed cases do not produce active bottlenecks., TestBottleneckDetection

### Community 21 - "AuditLogs.tsx"
Cohesion: 0.29
Nodes (5): GovTable(), GovTableProps, TableColumn, auditService, riskService

### Community 22 - "TestPriorityAndDashboardAggregation"
Cohesion: 0.33
Nodes (4): Tests for case priority ranking and executive dashboard KPI computation., Ranks cases in correct operational hierarchy: 1. Overdue first (regardless of…, aggregate_dashboard_intelligence computes real KPI numbers correctly., TestPriorityAndDashboardAggregation

### Community 23 - "create_case"
Cohesion: 0.29
Nodes (7): create_case(), forward_case(), post, Forward a case to a different officer, desk, or workflow stage. Records an…, Toggle the 'flagged for review' marker on a case., Register a new case (inward file docket). Automatically: - Assigns a file…, toggle_flag()

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, framer-motion, lucide-react, dependencies, clsx, framer-motion, lucide-react, react (+9 more)

### Community 25 - "GOIP Backend — Government File Tracking & Administrative Intelligence System"
Cohesion: 0.09
Nodes (22): 10. Test the API, 1. Clone and navigate, 2. Create virtual environment, 3. Install dependencies, 4. Configure environment, 5. Configure Supabase, 6. Run the database schema, 7. Seed demo data (optional) (+14 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+11 more)

### Community 27 - "api/index.ts"
Cohesion: 0.16
Nodes (16): GovBadge, StatusBadge(), StatusBadgeProps, DocumentViewerModal(), DocumentViewerModalProps, FileDetail(), casesService, documentService (+8 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+11 more)

### Community 29 - "SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation"
Cohesion: 0.09
Nodes (22): 10. Team Task Allocation & Responsibilities, 11. Exact File Ownership Matrix, 12. Task Priority Framework (P0 – P3), 13. Practical 7-Day Execution Timeline, 14. 5-Minute SIH Winning Demo Script, 15. Remaining Risks & Mitigations, 1. Project Architecture, 2. Current Implementation Status Matrix (+14 more)

### Community 30 - "projects.py"
Cohesion: 0.09
Nodes (31): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), create_project(), _enrich_project_with_ml() (+23 more)

### Community 31 - "deadline_service.py"
Cohesion: 0.08
Nodes (26): calculate_age_days(), calculate_days_remaining(), calculate_deadline(), get_deadline_status(), map_deadline_status_to_case_status(), map_deadline_status_to_priority(), map_deadline_status_to_risk_level(), parse_iso_date() (+18 more)

### Community 32 - "process_ocr_from_bytes"
Cohesion: 0.18
Nodes (10): process_ocr_from_bytes(), Run OCR directly on uploaded bytes (without storing first). Used by the…, _make_digital_pdf(), Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Tests for API response shapes using the document_service module directly. These…, validate_file() returns None when the file is valid., validate_file() returns an error string when validation fails., process_ocr_from_bytes() should return a dict with all required OCRResult… (+2 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.16
Nodes (11): calculate_case_risk(), Any, date, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70)., Overdue legal opinion adds +15 points to the breakdown. (+3 more)

### Community 34 - "delete_case"
Cohesion: 0.67
Nodes (3): delete_case(), Permanently delete a case. Restricted to ADMINISTRATOR role., delete

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.17
Nodes (10): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., Main entry point should return (text, confidence, engine) for a PDF. (+2 more)

### Community 36 - "update_case"
Cohesion: 0.67
Nodes (3): put, Update editable fields of an existing case., update_case()

### Community 37 - "test_documents.py"
Cohesion: 0.13
Nodes (15): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, _minimal_pdf_with_text() (+7 more)

### Community 38 - "calculate_risk"
Cohesion: 0.31
Nodes (5): calculate_risk(), Calculate a transparent risk score for a case. Args: case: Raw case dict from…, Tests for risk_service.py — no database needed., Helper to create a minimal case dict for risk calculation., TestRiskService

### Community 39 - "react"
Cohesion: 0.11
Nodes (13): react, StatutoryDeadlineEngineProps, GovCard(), GovCardProps, TableSkeleton(), StatutoryCountdownProps, TechnicalCardProps, Intelligence() (+5 more)

### Community 40 - "get_case"
Cohesion: 0.40
Nodes (5): get_case(), list_cases(), get, List cases with optional filtering and pagination. Officers see all cases…, Returns a single case with its complete: - File movement timeline (events) -…

### Community 41 - "App.tsx"
Cohesion: 0.19
Nodes (12): App(), ProtectedRoute(), PublicRoute(), AppLayout(), useAuth(), getRandomCaptcha(), Login(), Search() (+4 more)

### Community 43 - "TestDocumentStatus"
Cohesion: 0.22
Nodes (7): Tests for OCR status transitions and persistence logic., Document ocr_status values should be a known set., When process_ocr() succeeds, the DB record should be updated to COMPLETED. We…, When storage download fails, ocr_status must be set to FAILED., process_ocr() should raise ValueError when document_id is not found., TestDocumentStatus, patch

### Community 44 - "SystemContext.tsx"
Cohesion: 0.23
Nodes (9): AppHeader(), GlobalSearchModal(), SystemStatusDrawer(), INITIAL_ALERTS, SystemAlert, SystemContext, SystemContextType, SystemProvider() (+1 more)

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

### Community 49 - "_map_db_doc_to_frontend"
Cohesion: 0.17
Nodes (13): download_document(), get_document(), get_document_status(), list_documents(), get, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.…, Lightweight endpoint for polling OCR processing status. Returns: {id,… (+5 more)

### Community 50 - "verification_provider.py"
Cohesion: 0.28
Nodes (5): DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only…, VerificationProvider, VerificationResult, Protocol

### Community 51 - "TestLandWorkflow"
Cohesion: 0.22
Nodes (5): Verify the 11-stage canonical sequence., All stages have defined positive baseline durations., Stage next progression works as expected., Test probability to risk level mappings., TestLandWorkflow

### Community 52 - "Google Authentication with Supabase — Step-by-Step Setup Guide"
Cohesion: 0.15
Nodes (12): 1. Google Cloud Console Setup, 2. Supabase Dashboard Setup, 3. Database Sync Trigger (Optional but Recommended), 4. Local Environment Verification, Architecture Overview, Google Authentication with Supabase — Step-by-Step Setup Guide, Running the App:, Step 1.1: Create or Select a Project (+4 more)

### Community 53 - "_map_db_doc_standalone"
Cohesion: 0.25
Nodes (5): _map_db_doc_standalone(), Inline version of _map_db_doc_to_frontend for tests that cannot import…, _map_db_doc_to_frontend() returns all required DocumentRecord fields., ocrResult should be populated when extracted_text is present., ocrResult should be None when extracted_text and extracted_fields are both None.

### Community 55 - "BottleneckInfo"
Cohesion: 0.12
Nodes (15): Constants and Configuration for the Case Intelligence & Risk Engine. All…, generate_la_recommendations(), generate_recommendation(), Any, Operational Recommendation Engine. Produces actionable, deterministic…, Generate structured, transparent operational recommendations for Land…, Generate a precise, rule-based operational recommendation for the responsible…, BottleneckInfo (+7 more)

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
Cohesion: 0.13
Nodes (21): get_project_bottlenecks(), get_project_timeline(), get_expected_days(), get_next_stage(), get_stage_index(), Land Acquisition Workflow Constants — SIH26017…, Return the 0-based index of a stage in the canonical workflow. Returns -1 if…, Return the next stage after the current one, or None if at the end. (+13 more)

### Community 64 - "intelligence/risk_engine.py"
Cohesion: 0.21
Nodes (10): datetime, Explainable Risk Scoring Engine. Computes a deterministic, fully explainable…, CaseIntelligenceResult, DashboardIntelligenceSummary, BaseModel, Pydantic schemas and typed definitions for the Case Intelligence & Risk Engine., Explainable points breakdown for the calculated risk score., Comprehensive intelligence output for a single case file. (+2 more)

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

### Community 89 - "GOIP — Environment Variables & Configuration Guide"
Cohesion: 0.33
Nodes (5): 1. Backend Environment Variables (`backend/.env`), 2. Frontend Environment Variables (`.env`), Backend `.env` Template, Frontend `.env` Template, GOIP — Environment Variables & Configuration Guide

### Community 90 - "8. Typical Data Flow"
Cohesion: 0.50
Nodes (4): 8. Typical Data Flow, Case Intelligence, Document Intelligence, Simulation

### Community 92 - "10. Environment Configuration"
Cohesion: 0.67
Nodes (3): 10. Environment Configuration, Development / Mock Mode, Live Backend Mode

### Community 93 - "5. Technology Stack"
Cohesion: 0.67
Nodes (3): 5. Technology Stack, Backend / Intelligence, Frontend

### Community 94 - "9. Getting Started"
Cohesion: 0.67
Nodes (3): 9. Getting Started, Frontend Installation, Prerequisites

### Community 100 - "UploadDocument.tsx"
Cohesion: 0.25
Nodes (6): OCR_STEPS, RegPhase, SuccessResult, ocrService, Department, DocumentType

### Community 102 - "mark_alert_read"
Cohesion: 0.67
Nodes (3): mark_alert_read(), put, Mark a specific alert as read.

### Community 107 - "useProcurement"
Cohesion: 0.23
Nodes (9): useProcurement(), ProcurementAuditTrail(), ExtractedField, ProcurementDocuments(), Tenders(), riskBadge(), STATUS_META, statusBadge() (+1 more)

## Knowledge Gaps
- **377 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+372 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `predict_delay`, `delete_case`, `update_case`, `cases.py`, `mark_alert_read`, `case_service.py`, `schemas/__init__.py`, `_map_db_doc_to_frontend`, `create_case`, `projects.py`, `test_land_acquisition.py`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `extract_fields_from_text()` connect `TestFieldExtraction` to `process_ocr_from_bytes`, `test_documents.py`, `procurement_service.py`, `projects.py`, `deadline_service.py`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `process_ocr_from_bytes`, `test_documents.py`, `procurement.py`, `process_ocr`, `projects.py`, `deadline_service.py`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _377 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `predict_delay` be split into smaller, more focused modules?**
  _Cohesion score 0.053109713487071976 - nodes in this community are weakly interconnected._
- **Should `TestFieldExtraction` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07954545454545454 - nodes in this community are weakly interconnected._