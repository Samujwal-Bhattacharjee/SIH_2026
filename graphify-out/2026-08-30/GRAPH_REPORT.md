# Graph Report - SIH  (2026-08-30)

## Corpus Check
- 162 files · ~121,849 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1542 nodes · 3031 edges · 102 communities (89 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e5927bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- predict_delay
- TestFieldExtraction
- priority_engine.py
- LanguageContext.tsx
- types/index.ts
- main.py
- get_supabase
- calculate_deadline_status
- procurement.py
- ProcurementContext.tsx
- case_service.py
- Communities (88 total, 14 thin omitted)
- compilerOptions
- procurement_service.py
- UploadDocument.tsx
- api/index.ts
- mockApi.ts
- schemas/__init__.py
- GOIP Backend API Contract Specification
- validate_file
- detect_case_bottleneck
- react
- auth.py
- cases.py
- dependencies
- GOIP Backend — Government File Tracking & Administrative Intelligence System
- compilerOptions
- GovButton.tsx
- devDependencies
- SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation
- document_service.py
- test_core.py
- test_documents.py
- calculate_case_risk
- deadline_service.py
- extract_text_from_pdf_digital
- seed.py
- ocr_service.py
- calculate_risk
- Intelligence.tsx
- Reports.tsx
- Enum
- calculate_days_remaining
- TestDocumentStatus
- TestMLPrediction
- GOIP — Government Operations Intelligence Platform
- generate_land_projects.py
- plugins
- package.json
- documents.py
- verification.py
- get_risk_level_from_probability
- Google Authentication with Supabase — Step-by-Step Setup Guide
- _map_db_doc_standalone
- test_auth_integration.py
- generate_recommendation
- App.tsx
- SIH26100 — Bid Compliance Verification Platform: Walkthrough
- Case Intelligence & Risk Engine
- process_ocr
- Settings
- Graph Report - SIH  (2026-08-28)
- train.py
- test_land_acquisition.py
- intelligence/__init__.py
- 2. Testing Endpoints via PowerShell / cURL
- StatutoryDeadlineEngine.tsx
- 17. Demonstration Flow
- TechnicalCard.tsx
- vite-env.d.ts
- tsconfig.json
- vercel.json
- dashboard.py
- 21. Development Principles
- 3. Key Capabilities
- @xyflow/react
- projects.py
- GOIP — Environment Variables & Configuration Guide
- 8. Typical Data Flow
- trigger_alert_refresh
- 10. Environment Configuration
- 5. Technology Stack
- 9. Getting Started
- react-dom
- react-router-dom
- @tailwindcss/postcss
- postcss
- GovBadge.tsx
- model_loader.py
- StatutoryCountdown.tsx

## God Nodes (most connected - your core abstractions)
1. `get_supabase()` - 66 edges
2. `react` - 63 edges
3. `Communities (88 total, 14 thin omitted)` - 63 edges
4. `validate_file()` - 28 edges
5. `GOIP — Government Operations Intelligence Platform` - 27 edges
6. `predict_delay()` - 25 edges
7. `init_db()` - 24 edges
8. `GovButton()` - 24 edges
9. `get_db()` - 23 edges
10. `detect_case_bottleneck()` - 21 edges

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

## Communities (102 total, 13 thin omitted)

### Community 0 - "predict_delay"
Cohesion: 0.21
Nodes (15): get_project_delay_factors(), get_feature_importance(), Return feature importance dict, or empty dict if not available., _deterministic_fallback(), _estimate_delay_days(), _get_top_factors(), _get_top_factors_with_importance(), predict_delay() (+7 more)

### Community 1 - "TestFieldExtraction"
Cohesion: 0.06
Nodes (23): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+15 more)

### Community 2 - "priority_engine.py"
Cohesion: 0.15
Nodes (19): classify_deadline_status(), determine_delay_status(), Determine composite operational delay status., Classify a case's deadline urgency based on days remaining. Classification…, aggregate_dashboard_intelligence(), compute_case_intelligence(), Any, date (+11 more)

### Community 3 - "LanguageContext.tsx"
Cohesion: 0.08
Nodes (31): Emblem(), EmblemProps, AppHeader(), AppLayout(), GlobalSearchModal(), GovBreadcrumb(), GovFooter(), GovHorizontalNav() (+23 more)

### Community 4 - "types/index.ts"
Cohesion: 0.09
Nodes (20): RiskAttributionPanelProps, CustomWorkflowNode, WorkflowDrawerProps, CaseStage, CaseStatus, DocumentMetadata, FileRecord, LandAcquisitionStage (+12 more)

### Community 5 - "main.py"
Cohesion: 0.09
Nodes (27): list_alerts(), mark_alert_read(), get, put, List all alerts. Filter by read status or severity., Mark a specific alert as read., OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, Core application configuration. All settings are loaded from environment… (+19 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "calculate_deadline_status"
Cohesion: 0.09
Nodes (25): calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), normalize_to_date(), date, datetime, Deadline & Limitation Calculation Engine. Provides transparent, deterministic… (+17 more)

### Community 8 - "procurement.py"
Cohesion: 0.06
Nodes (82): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, get_bidder_compliance(), get_bidder_detail(), get_bidder_documents_list() (+74 more)

### Community 9 - "ProcurementContext.tsx"
Cohesion: 0.08
Nodes (30): AppSidebar(), NAV_ITEMS, AuditEvent, Bidder, CheckStatus, compliantRequirements, Discrepancy, exceptionRequirements (+22 more)

### Community 10 - "case_service.py"
Cohesion: 0.16
Nodes (19): _create_audit_log(), create_case(), forward_case(), get_case_by_id(), _map_db_case_to_frontend(), _map_movement_to_event(), Case Service — business logic for case management. Database operations are kept…, Fetch a single case with its events (movements) and documents. (+11 more)

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
Cohesion: 0.15
Nodes (21): FormFieldProps, inputErrorClasses, selectBaseClasses, textareaBaseClasses, GovModal(), GovModalProps, FileForwardModal(), FileForwardModalProps (+13 more)

### Community 15 - "api/index.ts"
Cohesion: 0.15
Nodes (19): AuthContext, AuthContextType, AuthProvider(), isSupabaseConfigured(), mapSupabaseUserToAppUser(), supabase, Departments(), auditService (+11 more)

### Community 16 - "mockApi.ts"
Cohesion: 0.13
Nodes (21): MOCK_AUDIT_LOGS, MOCK_BOTTLENECKS, MOCK_CASE_EVENTS, MOCK_CASES, MOCK_DASHBOARD_METRICS, MOCK_DOCUMENTS, MOCK_PERFORMANCE_METRICS, MOCK_PROCESS_MAP (+13 more)

### Community 17 - "schemas/__init__.py"
Cohesion: 0.15
Nodes (24): AlertOut, AuditLogOut, CaseEventOut, CaseListResponse, CaseOut, CaseUpdate, DepartmentInfo, DocumentMetadata (+16 more)

### Community 18 - "GOIP Backend API Contract Specification"
Cohesion: 0.08
Nodes (25): 1. Authentication, 2. Dashboard Operations, 3. Case Intelligence, 4. Process Mining & Workflow, 5. Risk Intelligence, 6. Documents & OCR, 7. What-If Simulation, 8. Analytics & Conformance (+17 more)

### Community 19 - "validate_file"
Cohesion: 0.14
Nodes (7): Validate file type and size. Returns error message string if invalid, None if…, validate_file(), Tests for file validation logic., TestDocumentValidation, Tests for file validation logic., A 0-byte file passes size validation (content validation is separate)., TestInvalidFileRejection

### Community 20 - "detect_case_bottleneck"
Cohesion: 0.12
Nodes (18): calculate_stage_dwell_days(), detect_case_bottleneck(), Any, date, datetime, Bottleneck and File Stagnation Detection Engine. Analyzes case stage…, Calculate the number of days a case has been pending at its current stage.…, Evaluate whether the case is currently stuck in a workflow bottleneck. Returns:… (+10 more)

### Community 21 - "react"
Cohesion: 0.21
Nodes (15): react, inputBaseClasses, GovCard(), GovCardProps, GovTable(), GovTableProps, TableColumn, FileRegisterModal() (+7 more)

### Community 22 - "auth.py"
Cohesion: 0.15
Nodes (20): _create_default_profile(), get_me(), login(), logout(), get, post, Authentication routes. Delegates to Supabase Auth for actual credential…, Authenticate using Supabase Auth. Returns the Supabase JWT token and the user… (+12 more)

### Community 23 - "cases.py"
Cohesion: 0.10
Nodes (24): create_case(), delete_case(), forward_case(), get_case(), list_cases(), get, post, put (+16 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): clsx, framer-motion, lucide-react, dependencies, clsx, framer-motion, lucide-react, react (+9 more)

### Community 25 - "GOIP Backend — Government File Tracking & Administrative Intelligence System"
Cohesion: 0.09
Nodes (22): 10. Test the API, 1. Clone and navigate, 2. Create virtual environment, 3. Install dependencies, 4. Configure environment, 5. Configure Supabase, 6. Run the database schema, 7. Seed demo data (optional) (+14 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+11 more)

### Community 27 - "GovButton.tsx"
Cohesion: 0.20
Nodes (12): EmptyStateProps, GovButton(), GovButtonProps, DOCUMENT_TYPES, DocumentUploadModal(), DocumentUploadModalProps, DocumentViewerModal(), DocumentViewerModalProps (+4 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, oxlint, devDependencies, autoprefixer, oxlint, tailwindcss, @types/node, @types/react (+11 more)

### Community 29 - "SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation"
Cohesion: 0.09
Nodes (22): 10. Team Task Allocation & Responsibilities, 11. Exact File Ownership Matrix, 12. Task Priority Framework (P0 – P3), 13. Practical 7-Day Execution Timeline, 14. 5-Minute SIH Winning Demo Script, 15. Remaining Risks & Mitigations, 1. Project Architecture, 2. Current Implementation Status Matrix (+14 more)

### Community 30 - "document_service.py"
Cohesion: 0.15
Nodes (14): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), post, UploadFile (+6 more)

### Community 31 - "test_core.py"
Cohesion: 0.14
Nodes (11): calculate_deadline(), get_deadline_status(), map_deadline_status_to_priority(), map_deadline_status_to_risk_level(), Classify a case by how many days remain until its deadline. Configurable…, Map deadline status to RiskLevel enum (HIGH/MEDIUM/LOW)., Map deadline status to PriorityLevel enum., Calculate the limitation deadline. Args: start_date: ISO date string (YYYY-MM-… (+3 more)

### Community 32 - "test_documents.py"
Cohesion: 0.15
Nodes (13): process_ocr_from_bytes(), Run OCR directly on uploaded bytes (without storing first). Used by the…, _make_digital_pdf(), _minimal_pdf_with_text(), Document pipeline tests — Person 2 additions. These tests are isolated from…, Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Produce the smallest valid PDF that embeds plain ASCII text. Used only as…, Tests for API response shapes using the document_service module directly. These… (+5 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.16
Nodes (11): calculate_case_risk(), Any, date, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70)., Overdue legal opinion adds +15 points to the breakdown. (+3 more)

### Community 34 - "deadline_service.py"
Cohesion: 0.17
Nodes (13): calculate_age_days(), map_deadline_status_to_case_status(), parse_iso_date(), parse_iso_datetime(), date, datetime, Deadline Service — centralized date and limitation calculation. All deadline-…, Calculate how many days old a case is. Args: created_at: ISO datetime string of… (+5 more)

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.17
Nodes (10): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., Main entry point should return (text, confidence, engine) for a PDF. (+2 more)

### Community 36 - "seed.py"
Cohesion: 0.19
Nodes (10): main(), random_date(), Generate a random past date within the given range., seed_case_actions(), seed_cases(), seed_departments(), seed_documents(), seed_land_acquisition_projects() (+2 more)

### Community 37 - "ocr_service.py"
Cohesion: 0.16
Nodes (12): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, Tests for the PyMuPDF→Tesseract fallback pipeline. (+4 more)

### Community 38 - "calculate_risk"
Cohesion: 0.31
Nodes (5): calculate_risk(), Calculate a transparent risk score for a case. Args: case: Raw case dict from…, Tests for risk_service.py — no database needed., Helper to create a minimal case dict for risk calculation., TestRiskService

### Community 39 - "Intelligence.tsx"
Cohesion: 0.20
Nodes (9): TableSkeleton(), Intelligence(), LA_WORKFLOW_STAGES, LandWorkflowStage, Workflow(), analyticsService, workflowService, ProcessMapData (+1 more)

### Community 40 - "Reports.tsx"
Cohesion: 0.15
Nodes (12): BIDDER_ASSESSMENTS, BidderAssessmentRecord, ExceptionRecord, EXCEPTIONS_DATA, OFFICER_REVIEWS, OfficerReviewRecord, Reports(), ReportType (+4 more)

### Community 41 - "Enum"
Cohesion: 0.29
Nodes (12): CaseStage, CaseStatus, LegalOpinionStatus, MovementStatus, OCRStatus, PriorityLevel, Extended stages matching the government litigation workflow., RiskLevel (+4 more)

### Community 42 - "calculate_days_remaining"
Cohesion: 0.21
Nodes (9): _create_alert(), Alert Service — generates real, data-driven alerts from the database. No random…, Run alert generation across ALL active cases. Call this on a schedule or after…, Insert a new alert if one of the same type for this case doesn't already exist.…, Evaluate a single case and generate/update alerts as appropriate. Called…, refresh_alerts_for_case(), run_global_alert_refresh(), calculate_days_remaining() (+1 more)

### Community 43 - "TestDocumentStatus"
Cohesion: 0.22
Nodes (7): Tests for OCR status transitions and persistence logic., Document ocr_status values should be a known set., When process_ocr() succeeds, the DB record should be updated to COMPLETED. We…, When storage download fails, ocr_status must be set to FAILED., process_ocr() should raise ValueError when document_id is not found., TestDocumentStatus, patch

### Community 44 - "TestMLPrediction"
Cohesion: 0.18
Nodes (6): Confirm forbidden target columns are NOT in input features., Feature vector handles empty/partial dictionaries gracefully., Model produces probability in [0.0, 1.0] and valid risk levels., Clean project with 100% docs and no disputes should be low risk., Project with active conflict, dispute, and compensation delay is high risk., TestMLPrediction

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

### Community 49 - "documents.py"
Cohesion: 0.18
Nodes (14): download_document(), get_document(), get_document_status(), list_documents(), get, Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.… (+6 more)

### Community 50 - "verification.py"
Cohesion: 0.15
Nodes (11): check_verification(), BaseModel, get, post, verification_sources(), VerificationRequest, DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only… (+3 more)

### Community 51 - "get_risk_level_from_probability"
Cohesion: 0.22
Nodes (6): get_risk_level_from_probability(), Convert a delay probability (0.0–1.0) to a risk level label., Verify the 11-stage canonical sequence., Stage next progression works as expected., Test probability to risk level mappings., TestLandWorkflow

### Community 52 - "Google Authentication with Supabase — Step-by-Step Setup Guide"
Cohesion: 0.15
Nodes (12): 1. Google Cloud Console Setup, 2. Supabase Dashboard Setup, 3. Database Sync Trigger (Optional but Recommended), 4. Local Environment Verification, Architecture Overview, Google Authentication with Supabase — Step-by-Step Setup Guide, Running the App:, Step 1.1: Create or Select a Project (+4 more)

### Community 53 - "_map_db_doc_standalone"
Cohesion: 0.25
Nodes (5): _map_db_doc_standalone(), Inline version of _map_db_doc_to_frontend for tests that cannot import…, _map_db_doc_to_frontend() returns all required DocumentRecord fields., ocrResult should be populated when extracted_text is present., ocrResult should be None when extracted_text and extracted_fields are both None.

### Community 55 - "generate_recommendation"
Cohesion: 0.13
Nodes (12): generate_la_recommendations(), generate_recommendation(), Any, Generate structured, transparent operational recommendations for Land…, Generate a precise, rule-based operational recommendation for the responsible…, Tests for actionable operational recommendations and full intelligence pipeline., Overdue case recommends Section 5 condonation and emergency escalation., Approaching deadline + bottleneck recommends fast-tracking file. (+4 more)

### Community 56 - "App.tsx"
Cohesion: 0.15
Nodes (16): App(), ProtectedRoute(), PublicRoute(), FormField(), useAuth(), AuditLogs(), Documents(), getRandomCaptcha() (+8 more)

### Community 57 - "SIH26100 — Bid Compliance Verification Platform: Walkthrough"
Cohesion: 0.15
Nodes (12): 1. Pipeline Verification, 2. Key Modules Implemented, 3. Test & Build Validation, 4. Exact Demo Sequence for Judges, A. OCR & Field Extraction Layer, B. Procurement Compliance & Risk Engine, Backend Tests, C. Backend API Routes (+4 more)

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
Cohesion: 0.16
Nodes (14): get_project_bottlenecks(), get_project_timeline(), get_expected_days(), get_next_stage(), get_stage_index(), Land Acquisition Workflow Constants — SIH26017…, Return the 0-based index of a stage in the canonical workflow. Returns -1 if…, Return the next stage after the current one, or None if at the end. (+6 more)

### Community 64 - "intelligence/__init__.py"
Cohesion: 0.18
Nodes (13): Constants and Configuration for the Case Intelligence & Risk Engine. All…, Case Intelligence & Risk Engine Package. Provides transparent, deterministic…, Operational Recommendation Engine. Produces actionable, deterministic…, datetime, Explainable Risk Scoring Engine. Computes a deterministic, fully explainable…, CaseIntelligenceResult, DashboardIntelligenceSummary, BaseModel (+5 more)

### Community 65 - "2. Testing Endpoints via PowerShell / cURL"
Cohesion: 0.25
Nodes (7): 1. Complete API Contract Matrix, 1. Health Check, 2. Login, 2. Testing Endpoints via PowerShell / cURL, 3. Fetch Dashboard Metrics, 4. Fetch Ranked Cases (Case Intelligence Engine), GOIP — API Integration Checklist & Contract Verification

### Community 67 - "17. Demonstration Flow"
Cohesion: 0.25
Nodes (8): 17. Demonstration Flow, 1. Sign In, 2. Dashboard, 3. Workflow, 4. Case Intelligence, 5. Document Intelligence, 6. Simulation, 7. Decision Support

### Community 72 - "dashboard.py"
Cohesion: 0.38
Nodes (6): get_dashboard_metrics(), get, Dashboard route — returns real aggregate statistics from the database. No…, Returns aggregate operational statistics computed from the live database. Every…, BottleneckAnalysis, DashboardMetrics

### Community 73 - "21. Development Principles"
Cohesion: 0.29
Nodes (7): 21. Development Principles, Deterministic rules remain deterministic, Evidence over assumptions, Explainability matters, Human decisions remain human, Mock mode is not production data, Small, composable intelligence services

### Community 74 - "3. Key Capabilities"
Cohesion: 0.29
Nodes (7): 3.1 Process Discovery, 3.2 Bottleneck & Rework Detection, 3.3 Delay-Risk Prediction, 3.4 Deterministic Statutory Deadline Engine, 3.5 What-If Simulation, 3.6 Document Intake & OCR, 3. Key Capabilities

### Community 88 - "projects.py"
Cohesion: 0.18
Nodes (16): create_project(), _enrich_project_with_ml(), get_project(), get_project_prediction(), get_project_recommendations(), LandProjectCreate, LandProjectUpdate, list_projects() (+8 more)

### Community 89 - "GOIP — Environment Variables & Configuration Guide"
Cohesion: 0.33
Nodes (5): 1. Backend Environment Variables (`backend/.env`), 2. Frontend Environment Variables (`.env`), Backend `.env` Template, Frontend `.env` Template, GOIP — Environment Variables & Configuration Guide

### Community 90 - "8. Typical Data Flow"
Cohesion: 0.50
Nodes (4): 8. Typical Data Flow, Case Intelligence, Document Intelligence, Simulation

### Community 91 - "trigger_alert_refresh"
Cohesion: 0.67
Nodes (3): post, Re-evaluate all active cases and generate/update alerts accordingly., trigger_alert_refresh()

### Community 92 - "10. Environment Configuration"
Cohesion: 0.67
Nodes (3): 10. Environment Configuration, Development / Mock Mode, Live Backend Mode

### Community 93 - "5. Technology Stack"
Cohesion: 0.67
Nodes (3): 5. Technology Stack, Backend / Intelligence, Frontend

### Community 94 - "9. Getting Started"
Cohesion: 0.67
Nodes (3): 9. Getting Started, Frontend Installation, Prerequisites

### Community 99 - "GovBadge.tsx"
Cohesion: 0.16
Nodes (11): GovBadge, StatusBadge(), StatusBadgeProps, FileMovementTimeline(), FileMovementTimelineProps, ProjectDetail(), projectService, CaseEvent (+3 more)

### Community 100 - "model_loader.py"
Cohesion: 0.22
Nodes (8): is_model_ready(), load_model(), Any, Model Loader — Singleton model loading for inference.…, Load the trained RandomForest model from disk. Returns None if the model file…, Return True if the model has been trained and is ready for inference., Clear the singleton cache. Mainly for testing., reset_cache()

## Knowledge Gaps
- **370 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+365 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `predict_delay`, `seed.py`, `main.py`, `dashboard.py`, `calculate_days_remaining`, `case_service.py`, `documents.py`, `auth.py`, `cases.py`, `projects.py`, `document_service.py`, `test_land_acquisition.py`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `test_documents.py`, `procurement.py`, `projects.py`, `process_ocr`, `document_service.py`, `test_core.py`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `compute_case_intelligence()` connect `priority_engine.py` to `intelligence/__init__.py`, `calculate_case_risk`, `get_supabase`, `calculate_deadline_status`, `detect_case_bottleneck`, `generate_recommendation`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _370 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TestFieldExtraction` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._
- **Should `LanguageContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07729468599033816 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._