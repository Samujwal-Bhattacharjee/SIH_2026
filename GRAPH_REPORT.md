# Graph Report - SIH  (2026-08-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1283 nodes · 2783 edges · 88 communities (74 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6afb9d71`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- projects.py
- TestFieldExtraction
- intelligence/__init__.py
- LanguageContext.tsx
- types/index.ts
- main.py
- get_supabase
- calculate_deadline_status
- procurement_store.py
- ProcurementContext.tsx
- case_service.py
- ocr_service.py
- compilerOptions
- procurement_service.py
- UploadDocument.tsx
- api/index.ts
- mockApi.ts
- schemas/__init__.py
- procurement.py
- validate_file
- detect_case_bottleneck
- react
- auth.py
- cases.py
- dependencies
- App.tsx
- compilerOptions
- GovButton.tsx
- devDependencies
- get
- document_service.py
- test_core.py
- test_documents.py
- calculate_case_risk
- deadline_service.py
- extract_text_from_pdf_digital
- seed.py
- extract_text_from_document
- calculate_risk
- Intelligence.tsx
- Reports.tsx
- Enum
- alert_service.py
- TestDocumentStatus
- TestMLPrediction
- test_procurement_persistence.py
- generate_land_projects.py
- plugins
- package.json
- get_document
- verification_provider.py
- TestLandWorkflow
- extract_procurement_fields
- _map_db_doc_standalone
- test_auth_integration.py
- generate_la_recommendations
- TestPriorityAndDashboardAggregation
- get_case
- SeedStats
- process_ocr
- Settings
- calculate_days_remaining
- train.py
- list_alerts
- mark_alert_read
- seed_initial_data
- StatutoryDeadlineEngine.tsx
- StatutoryCountdown.tsx
- TechnicalCard.tsx
- vite-env.d.ts
- tsconfig.json
- vercel.json
- .test_validate_file_returns_none_on_success
- .test_validate_file_returns_string_on_error
- lucide-react
- @xyflow/react

## God Nodes (most connected - your core abstractions)
1. `get_supabase()` - 66 edges
2. `react` - 63 edges
3. `validate_file()` - 28 edges
4. `predict_delay()` - 25 edges
5. `GovButton()` - 24 edges
6. `init_db()` - 24 edges
7. `get_db()` - 23 edges
8. `TestFieldExtraction` - 21 edges
9. `detect_case_bottleneck()` - 21 edges
10. `extract_fields_from_text()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `generate_la_recommendations()` --uses--> `BottleneckInfo`  [INFERRED]
  backend/app/services/intelligence/recommendation_engine.py → backend/app/services/intelligence/schemas.py
- `test_document_upload_ocr_compliance_flow()` --calls--> `get_bidders()`  [EXTRACTED]
  backend/tests/test_procurement_persistence.py → backend/app/core/procurement_store.py
- `test_officer_decision_and_audit_trail()` --calls--> `get_bidders()`  [EXTRACTED]
  backend/tests/test_procurement_persistence.py → backend/app/core/procurement_store.py
- `plugins` --extends--> `typescript`  [EXTRACTED]
  .oxlintrc.json → package.json
- `FileForwardModalProps` --references--> `Case`  [EXTRACTED]
  src/components/files/FileForwardModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (88 total, 14 thin omitted)

### Community 0 - "projects.py"
Cohesion: 0.07
Nodes (53): _enrich_project_with_ml(), get_project(), get_project_bottlenecks(), get_project_delay_factors(), get_project_prediction(), get_project_recommendations(), get_project_timeline(), LandProjectCreate (+45 more)

### Community 1 - "TestFieldExtraction"
Cohesion: 0.06
Nodes (23): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+15 more)

### Community 2 - "intelligence/__init__.py"
Cohesion: 0.10
Nodes (36): Constants and Configuration for the Case Intelligence & Risk Engine. All…, classify_deadline_status(), determine_delay_status(), Determine composite operational delay status., Classify a case's deadline urgency based on days remaining. Classification…, Case Intelligence & Risk Engine Package. Provides transparent, deterministic…, aggregate_dashboard_intelligence(), compute_case_intelligence() (+28 more)

### Community 3 - "LanguageContext.tsx"
Cohesion: 0.08
Nodes (31): Emblem(), EmblemProps, AppHeader(), AppLayout(), GlobalSearchModal(), GovBreadcrumb(), GovFooter(), GovHorizontalNav() (+23 more)

### Community 4 - "types/index.ts"
Cohesion: 0.07
Nodes (31): RiskAttributionPanelProps, GovBadge, StatusBadge(), StatusBadgeProps, FileMovementTimeline(), FileMovementTimelineProps, CustomWorkflowNode, WorkflowDrawerProps (+23 more)

### Community 5 - "main.py"
Cohesion: 0.08
Nodes (28): Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, check_verification(), BaseModel, get, post, verification_sources(), VerificationRequest (+20 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "calculate_deadline_status"
Cohesion: 0.09
Nodes (25): calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), normalize_to_date(), date, datetime, Deadline & Limitation Calculation Engine. Provides transparent, deterministic… (+17 more)

### Community 8 - "procurement_store.py"
Cohesion: 0.21
Nodes (33): get_bidder_detail(), Get single bidder metadata, verification status, and requirements., create_bidder_record(), create_tender_record(), get_all_procurement_documents(), get_audit_trail(), get_bidder_by_id(), get_bidder_documents() (+25 more)

### Community 9 - "ProcurementContext.tsx"
Cohesion: 0.09
Nodes (26): AppSidebar(), NAV_ITEMS, AuditEvent, Bidder, CheckStatus, compliantRequirements, Discrepancy, exceptionRequirements (+18 more)

### Community 10 - "case_service.py"
Cohesion: 0.11
Nodes (27): get_dashboard_metrics(), get, Dashboard route — returns real aggregate statistics from the database. No…, Returns aggregate operational statistics computed from the live database. Every…, BottleneckAnalysis, DashboardMetrics, _create_audit_log(), create_case() (+19 more)

### Community 11 - "ocr_service.py"
Cohesion: 0.31
Nodes (4): classify_document_type(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Classify a document type from its OCR text using deterministic rules. Returns a…, TestDocumentClassification

### Community 12 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, src, vite/client, vite-env.d.ts, compilerOptions, allowImportingTsExtensions (+19 more)

### Community 13 - "procurement_service.py"
Cohesion: 0.07
Nodes (38): calculate_compliance_score(), calculate_risk_level(), check_blacklisting_declaration(), check_gst_present(), check_local_content(), check_oem_present(), check_pan_present(), check_turnover_threshold() (+30 more)

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
Cohesion: 0.16
Nodes (23): AlertOut, AuditLogOut, CaseEventOut, CaseListResponse, CaseOut, DepartmentInfo, DocumentMetadata, DocumentRecordOut (+15 more)

### Community 18 - "procurement.py"
Cohesion: 0.17
Nodes (22): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, BaseModel, post, UploadFile (+14 more)

### Community 19 - "validate_file"
Cohesion: 0.14
Nodes (7): Validate file type and size. Returns error message string if invalid, None if…, validate_file(), Tests for file validation logic., TestDocumentValidation, Tests for file validation logic., A 0-byte file passes size validation (content validation is separate)., TestInvalidFileRejection

### Community 20 - "detect_case_bottleneck"
Cohesion: 0.13
Nodes (16): calculate_stage_dwell_days(), detect_case_bottleneck(), Any, date, datetime, Bottleneck and File Stagnation Detection Engine. Analyzes case stage…, Calculate the number of days a case has been pending at its current stage.…, Evaluate whether the case is currently stuck in a workflow bottleneck. Returns:… (+8 more)

### Community 21 - "react"
Cohesion: 0.21
Nodes (15): react, inputBaseClasses, GovCard(), GovCardProps, GovTable(), GovTableProps, TableColumn, FileRegisterModal() (+7 more)

### Community 22 - "auth.py"
Cohesion: 0.15
Nodes (20): _create_default_profile(), get_me(), login(), logout(), get, post, Authentication routes. Delegates to Supabase Auth for actual credential…, Authenticate using Supabase Auth. Returns the Supabase JWT token and the user… (+12 more)

### Community 23 - "cases.py"
Cohesion: 0.12
Nodes (20): create_case(), delete_case(), forward_case(), post, put, Cases routes — CRUD endpoints for case management. All business logic delegated…, Forward a case to a different officer, desk, or workflow stage. Records an…, Update the status of a case (PENDING, APPROVED, DISPOSED, etc.). (+12 more)

### Community 24 - "dependencies"
Cohesion: 0.10
Nodes (21): clsx, framer-motion, dependencies, clsx, framer-motion, react, react-dom, react-router-dom (+13 more)

### Community 25 - "App.tsx"
Cohesion: 0.15
Nodes (16): App(), ProtectedRoute(), PublicRoute(), FormField(), useAuth(), AuditLogs(), Documents(), getRandomCaptcha() (+8 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+11 more)

### Community 27 - "GovButton.tsx"
Cohesion: 0.20
Nodes (12): EmptyStateProps, GovButton(), GovButtonProps, DOCUMENT_TYPES, DocumentUploadModal(), DocumentUploadModalProps, DocumentViewerModal(), DocumentViewerModalProps (+4 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, oxlint, devDependencies, autoprefixer, oxlint, postcss, tailwindcss, @types/node (+11 more)

### Community 29 - "get"
Cohesion: 0.11
Nodes (19): get_bidder_compliance(), get_bidder_documents_list(), get_document_evidence(), get_procurement_audit(), get_procurement_dashboard(), get_tender_detail(), list_all_documents(), list_tender_bidders() (+11 more)

### Community 30 - "document_service.py"
Cohesion: 0.12
Nodes (17): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), create_project(), post (+9 more)

### Community 31 - "test_core.py"
Cohesion: 0.17
Nodes (9): get_deadline_status(), map_deadline_status_to_priority(), map_deadline_status_to_risk_level(), Classify a case by how many days remain until its deadline. Configurable…, Map deadline status to RiskLevel enum (HIGH/MEDIUM/LOW)., Map deadline status to PriorityLevel enum., Backend tests for critical functionality. These tests use unit-testing patterns…, Tests for deadline_service.py — no database needed. (+1 more)

### Community 32 - "test_documents.py"
Cohesion: 0.20
Nodes (11): process_ocr_from_bytes(), Run OCR directly on uploaded bytes (without storing first). Used by the…, _make_digital_pdf(), _minimal_pdf_with_text(), Document pipeline tests — Person 2 additions. These tests are isolated from…, Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Produce the smallest valid PDF that embeds plain ASCII text. Used only as…, Tests for API response shapes using the document_service module directly. These… (+3 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.15
Nodes (12): calculate_case_risk(), Any, date, datetime, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70). (+4 more)

### Community 34 - "deadline_service.py"
Cohesion: 0.17
Nodes (13): calculate_age_days(), map_deadline_status_to_case_status(), parse_iso_date(), parse_iso_datetime(), date, datetime, Deadline Service — centralized date and limitation calculation. All deadline-…, Calculate how many days old a case is. Args: created_at: ISO datetime string of… (+5 more)

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.17
Nodes (10): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., Main entry point should return (text, confidence, engine) for a PDF. (+2 more)

### Community 36 - "seed.py"
Cohesion: 0.22
Nodes (11): calculate_deadline(), Calculate the limitation deadline. Args: start_date: ISO date string (YYYY-MM-…, main(), random_date(), Generate a random past date within the given range., seed_case_actions(), seed_cases(), seed_departments() (+3 more)

### Community 37 - "extract_text_from_document"
Cohesion: 0.16
Nodes (11): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, Tests for the PyMuPDF→Tesseract fallback pipeline., Image MIME types should route to Tesseract engine. (+3 more)

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

### Community 42 - "alert_service.py"
Cohesion: 0.22
Nodes (10): post, Re-evaluate all active cases and generate/update alerts accordingly., trigger_alert_refresh(), _create_alert(), Alert Service — generates real, data-driven alerts from the database. No random…, Run alert generation across ALL active cases. Call this on a schedule or after…, Insert a new alert if one of the same type for this case doesn't already exist.…, Evaluate a single case and generate/update alerts as appropriate. Called… (+2 more)

### Community 43 - "TestDocumentStatus"
Cohesion: 0.22
Nodes (7): Tests for OCR status transitions and persistence logic., Document ocr_status values should be a known set., When process_ocr() succeeds, the DB record should be updated to COMPLETED. We…, When storage download fails, ocr_status must be set to FAILED., process_ocr() should raise ValueError when document_id is not found., TestDocumentStatus, patch

### Community 44 - "TestMLPrediction"
Cohesion: 0.18
Nodes (6): Confirm forbidden target columns are NOT in input features., Feature vector handles empty/partial dictionaries gracefully., Model produces probability in [0.0, 1.0] and valid risk levels., Clean project with 100% docs and no disputes should be low risk., Project with active conflict, dispute, and compensation delay is high risk., TestMLPrediction

### Community 45 - "test_procurement_persistence.py"
Cohesion: 0.20
Nodes (5): auth_client(), Integration and Persistence Tests for Procurement Pipeline (SIH26100)…, test_document_upload_ocr_compliance_flow(), test_officer_decision_and_audit_trail(), fixture

### Community 46 - "generate_land_projects.py"
Cohesion: 0.31
Nodes (9): clamp(), generate_dataset(), generate_project(), Any, Land Acquisition Historical Dataset Generator…, Return True with the given probability., Generate a single synthetic land acquisition project record. Relationships…, weighted_bool() (+1 more)

### Community 47 - "plugins"
Cohesion: 0.20
Nodes (9): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, typescript, oxc, warn (+1 more)

### Community 48 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 49 - "get_document"
Cohesion: 0.22
Nodes (9): download_document(), get_document(), get_document_status(), list_documents(), get, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.…, Lightweight endpoint for polling OCR processing status. Returns: {id,… (+1 more)

### Community 50 - "verification_provider.py"
Cohesion: 0.28
Nodes (5): DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only…, VerificationProvider, VerificationResult, Protocol

### Community 51 - "TestLandWorkflow"
Cohesion: 0.22
Nodes (5): Verify the 11-stage canonical sequence., All stages have defined positive baseline durations., Stage next progression works as expected., Test probability to risk level mappings., TestLandWorkflow

### Community 52 - "extract_procurement_fields"
Cohesion: 0.39
Nodes (3): extract_procurement_fields(), Extract procurement-specific structured fields from OCR text. Used for bid…, TestFieldExtraction

### Community 53 - "_map_db_doc_standalone"
Cohesion: 0.25
Nodes (5): _map_db_doc_standalone(), Inline version of _map_db_doc_to_frontend for tests that cannot import…, _map_db_doc_to_frontend() returns all required DocumentRecord fields., ocrResult should be populated when extracted_text is present., ocrResult should be None when extracted_text and extracted_fields are both None.

### Community 55 - "generate_la_recommendations"
Cohesion: 0.33
Nodes (5): generate_la_recommendations(), Any, Generate structured, transparent operational recommendations for Land…, Recommendations match detected factors., TestBottleneckAndRecommendations

### Community 56 - "TestPriorityAndDashboardAggregation"
Cohesion: 0.33
Nodes (4): Tests for case priority ranking and executive dashboard KPI computation., Ranks cases in correct operational hierarchy: 1. Overdue first (regardless of…, aggregate_dashboard_intelligence computes real KPI numbers correctly., TestPriorityAndDashboardAggregation

### Community 57 - "get_case"
Cohesion: 0.40
Nodes (5): get_case(), list_cases(), get, List cases with optional filtering and pagination. Officers see all cases…, Returns a single case with its complete: - File movement timeline (events) -…

### Community 59 - "process_ocr"
Cohesion: 0.50
Nodes (4): process_ocr(), post, UploadFile, Accept a file, run OCR, and return extracted text + structured fields.…

### Community 62 - "train.py"
Cohesion: 0.50
Nodes (3): ML Model Training Script — Land Acquisition Delay Prediction…, Full training pipeline: 1. Load dataset (generate if missing) 2. Validate…, train()

### Community 63 - "list_alerts"
Cohesion: 0.67
Nodes (3): list_alerts(), get, List all alerts. Filter by read status or severity.

### Community 64 - "mark_alert_read"
Cohesion: 0.67
Nodes (3): mark_alert_read(), put, Mark a specific alert as read.

### Community 65 - "seed_initial_data"
Cohesion: 0.67
Nodes (3): Seed baseline tender, requirements, bidders, and audit log., seed_initial_data(), Connection

## Knowledge Gaps
- **160 isolated node(s):** `FormFieldProps`, `GovModalProps`, `RegPhase`, `SuccessResult`, `GovCardProps` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `mark_alert_read`, `projects.py`, `seed.py`, `main.py`, `case_service.py`, `alert_service.py`, `get_document`, `auth.py`, `cases.py`, `document_service.py`, `list_alerts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `projects.py`, `test_documents.py`, `.test_validate_file_returns_none_on_success`, `.test_validate_file_returns_string_on_error`, `procurement.py`, `process_ocr`, `document_service.py`, `test_core.py`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `extract_fields_from_text()` connect `TestFieldExtraction` to `test_documents.py`, `ocr_service.py`, `extract_procurement_fields`, `document_service.py`, `test_core.py`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `FormFieldProps`, `GovModalProps`, `RegPhase` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `projects.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06721215663354763 - nodes in this community are weakly interconnected._
- **Should `TestFieldExtraction` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._
- **Should `intelligence/__init__.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0966183574879227 - nodes in this community are weakly interconnected._