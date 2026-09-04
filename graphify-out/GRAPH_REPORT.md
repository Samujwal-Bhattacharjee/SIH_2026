# Graph Report - SIH  (2026-09-04)

## Corpus Check
- 186 files · ~253,186 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1995 nodes · 4218 edges · 126 communities (111 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2305e479`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_compliance_qualification_logic.py
- extract_fields_from_text
- VerificationHub.tsx
- GovNotificationTicker.tsx
- types/index.ts
- main.py
- get_supabase
- TestDeadlineCalculations
- procurement_store.py
- ProcurementContext.tsx
- enrich_case_with_deadlines
- Communities (88 total, 14 thin omitted)
- compilerOptions
- test_procurement.py
- UploadDocument.tsx
- FindingStatus
- mockApi.ts
- schemas/__init__.py
- GOIP Backend API Contract Specification
- validate_file
- detect_case_bottleneck
- api/index.ts
- test_integrity_engine.py
- cases.py
- dependencies
- GOIP Backend — Government File Tracking & Administrative Intelligence System
- compilerOptions
- FileDetail.tsx
- devDependencies
- SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation
- AuthContext.tsx
- procurement.py
- _make_digital_pdf
- calculate_case_risk
- integrity/__init__.py
- extract_text_from_pdf_digital
- intelligence/__init__.py
- test_documents.py
- calculate_risk
- procurement_service.py
- assess_bidder_integrity
- RelationshipGraph.tsx
- case_service.py
- TestDocumentStatus
- SystemContext.tsx
- GOIP — Government Operations Intelligence Platform
- generate_land_projects.py
- plugins
- package.json
- BidderFeature
- verification_provider.py
- TestLandWorkflow
- Google Authentication with Supabase — Step-by-Step Setup Guide
- generate_la_recommendations
- test_auth_integration.py
- TestRecommendationsAndIntelligence
- react
- Verification Results
- Case Intelligence & Risk Engine
- useLanguage
- SignalType
- Graph Report - SIH  (2026-08-28)
- train.py
- document_service.py
- TestPriorityAndDashboardAggregation
- 2. Testing Endpoints via PowerShell / cURL
- 1. Integrity Module (`backend/app/services/integrity/`)
- 17. Demonstration Flow
- LanguageContext.tsx
- vite-env.d.ts
- tsconfig.json
- vercel.json
- test_session_ephemeral.py
- 21. Development Principles
- 3. Key Capabilities
- auth.py
- AppLayout.tsx
- GOIP — Environment Variables & Configuration Guide
- 8. Typical Data Flow
- TestMLPrediction
- 10. Environment Configuration
- 5. Technology Stack
- 9. Getting Started
- UX4G (User Experience for Government) Design Guidelines
- react-router-dom
- @tailwindcss/postcss
- Enum
- run_full_verification
- projects.py
- seed.py
- @supabase/supabase-js
- get_bidder_documents
- get_document
- Reports.tsx
- process_ocr
- calculate_days_remaining
- tailwind-merge
- get_bidders
- get_bidder_detail
- extract_fairbid_canonical
- StatutoryCountdown.tsx
- classify_document_type
- App.tsx
- TechnicalCard.tsx
- run_cross_document_validation
- BidderVerification.tsx
- generate_synthetic_docs.py
- seed_synthetic_procurement_history
- Settings
- list_alerts
- mark_alert_read
- StatutoryDeadlineEngine.tsx
- clsx
- @types/node

## God Nodes (most connected - your core abstractions)
1. `react` - 70 edges
2. `get_supabase()` - 66 edges
3. `Communities (88 total, 14 thin omitted)` - 63 edges
4. `assess_tender_integrity()` - 56 edges
5. `SignalType` - 48 edges
6. `RiskLevel` - 46 edges
7. `BidderFeature` - 39 edges
8. `init_db()` - 30 edges
9. `get_db()` - 29 edges
10. `validate_file()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `_get_valid_quote()` --uses--> `BidderFeature`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py
- `analyze_bid_price_similarity()` --uses--> `BidderFeature`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py
- `analyze_bid_price_similarity()` --uses--> `FindingStatus`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py
- `analyze_bid_price_similarity()` --uses--> `RiskLevel`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py
- `analyze_winner_concentration()` --uses--> `BidderFeature`  [INFERRED]
  backend/app/services/integrity/bid_analyzer.py → backend/app/services/integrity/models.py

## Import Cycles
- None detected.

## Communities (126 total, 15 thin omitted)

### Community 0 - "test_compliance_qualification_logic.py"
Cohesion: 0.10
Nodes (27): check_pan_present(), determine_compliance_status(), Determine objective compliance status based strictly on tender mandatory…, Check: PAN card present and PAN extractable., Comprehensive regression test suite for Compliance vs Integrity vs…, Compliance and Integrity scores evaluate distinct dimensions independently., Live verification pipeline outputs match saved DB state., Same check results and discrepancies deterministically yield identical… (+19 more)

### Community 1 - "extract_fields_from_text"
Cohesion: 0.05
Nodes (26): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+18 more)

### Community 2 - "VerificationHub.tsx"
Cohesion: 0.50
Nodes (3): riskBadge(), STATUS_META, VerificationHub()

### Community 4 - "types/index.ts"
Cohesion: 0.08
Nodes (24): RiskAttributionPanelProps, CustomWorkflowNode, WorkflowDrawerProps, BottleneckAnalysis, CaseStage, CaseStatus, DocumentMetadata, FileRecord (+16 more)

### Community 5 - "main.py"
Cohesion: 0.08
Nodes (31): Dashboard route — returns real aggregate statistics from the database. No…, Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, check_verification(), BaseModel, get, post, verification_sources() (+23 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "TestDeadlineCalculations"
Cohesion: 0.09
Nodes (12): Past deadline is classified as OVERDUE with negative days., Calculates age in days accurately., Projects future deadline given start date and day count., Tests for deterministic deadline arithmetic and classification., Case with missing deadline returns None days and UNKNOWN status., Deadline 60 days in the future is classified as SAFE., Deadline 30 days in the future is classified as WATCH., Deadline 15 days in the future is classified as HIGH. (+4 more)

### Community 8 - "procurement_store.py"
Cohesion: 0.16
Nodes (30): get_tender_integrity_endpoint(), Run deterministic integrity analysis for a tender and its participating bidders., create_bidder_record(), create_tender_record(), get_all_procurement_documents(), get_audit_trail(), get_db(), get_discrepancies() (+22 more)

### Community 9 - "ProcurementContext.tsx"
Cohesion: 0.12
Nodes (18): AppSidebar(), NAV_ITEMS, AuditEvent, Bidder, compliantRequirements, Discrepancy, exceptionRequirements, initialBidders (+10 more)

### Community 10 - "enrich_case_with_deadlines"
Cohesion: 0.08
Nodes (28): get_dashboard_metrics(), get, Returns aggregate operational statistics computed from the live database. Every…, calculate_age_days(), calculate_deadline(), enrich_case_with_deadlines(), get_deadline_status(), map_deadline_status_to_case_status() (+20 more)

### Community 11 - "Communities (88 total, 14 thin omitted)"
Cohesion: 0.03
Nodes (63): Communities (88 total, 14 thin omitted), Community 0 - "projects.py", Community 10 - "case_service.py", Community 11 - "ocr_service.py", Community 12 - "compilerOptions", Community 13 - "procurement_service.py", Community 14 - "UploadDocument.tsx", Community 15 - "api/index.ts" (+55 more)

### Community 12 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, src, vite/client, vite-env.d.ts, compilerOptions, allowImportingTsExtensions (+19 more)

### Community 13 - "test_procurement.py"
Cohesion: 0.15
Nodes (12): calculate_compliance_score(), calculate_risk_level(), generate_recommendations(), Run all compliance checks for a bidder. Returns a list of compliance result…, Calculate weighted compliance score (0-100). Scoring formula: - Each check…, Calculate risk level from compliance score and discrepancy data. Returns:…, Generate actionable recommendations based on compliance check results. Each…, run_compliance_checks() (+4 more)

### Community 14 - "UploadDocument.tsx"
Cohesion: 0.12
Nodes (22): Emblem(), EmblemProps, FormField(), FormFieldProps, inputBaseClasses, inputErrorClasses, selectBaseClasses, textareaBaseClasses (+14 more)

### Community 15 - "FindingStatus"
Cohesion: 0.15
Nodes (34): analyze_bid_rotation(), analyze_bid_to_estimate_anomaly(), analyze_commercial_boq_patterns(), analyze_losing_bid_pattern(), analyze_narrow_competition(), analyze_non_competition_pattern(), analyze_officer_vendor_association(), analyze_repeated_participation() (+26 more)

### Community 16 - "mockApi.ts"
Cohesion: 0.11
Nodes (29): MOCK_AUDIT_LOGS, MOCK_BOTTLENECKS, MOCK_CASE_EVENTS, MOCK_CASES, MOCK_DASHBOARD_METRICS, MOCK_DEPARTMENTS, MOCK_DOCUMENTS, MOCK_OFFICERS (+21 more)

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
Cohesion: 0.13
Nodes (16): get_project_bottlenecks(), calculate_stage_dwell_days(), detect_case_bottleneck(), Any, date, datetime, Calculate the number of days a case has been pending at its current stage.…, Evaluate whether the case is currently stuck in a workflow bottleneck. Returns:… (+8 more)

### Community 21 - "api/index.ts"
Cohesion: 0.13
Nodes (15): TableSkeleton(), Intelligence(), LA_WORKFLOW_STAGES, LandWorkflowStage, analyticsService, auditService, dashboardService, documentService (+7 more)

### Community 22 - "test_integrity_engine.py"
Cohesion: 0.07
Nodes (47): Standard 4-tier risk classification matching government procurement tiers., RiskLevel, assess_tender_integrity(), Any, Primary entry point: Run comprehensive integrity assessment for a given tender.…, auth_client(), fixture, Unit Tests — Procurement Integrity Engine (SIH26100 Day 1 / Task 3)… (+39 more)

### Community 23 - "cases.py"
Cohesion: 0.10
Nodes (25): create_case(), delete_case(), forward_case(), get_case(), list_cases(), get, post, put (+17 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): framer-motion, lucide-react, dependencies, framer-motion, lucide-react, react, react-dom, recharts (+9 more)

### Community 25 - "GOIP Backend — Government File Tracking & Administrative Intelligence System"
Cohesion: 0.09
Nodes (22): 10. Test the API, 1. Clone and navigate, 2. Create virtual environment, 3. Install dependencies, 4. Configure environment, 5. Configure Supabase, 6. Run the database schema, 7. Seed demo data (optional) (+14 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+11 more)

### Community 27 - "FileDetail.tsx"
Cohesion: 0.14
Nodes (17): GovBadge, StatusBadge(), StatusBadgeProps, DOCUMENT_TYPES, DocumentUploadModal(), DocumentUploadModalProps, DocumentViewerModal(), DocumentViewerModalProps (+9 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, oxlint, devDependencies, autoprefixer, oxlint, postcss, tailwindcss, @types/react (+11 more)

### Community 29 - "SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation"
Cohesion: 0.09
Nodes (22): 10. Team Task Allocation & Responsibilities, 11. Exact File Ownership Matrix, 12. Task Priority Framework (P0 – P3), 13. Practical 7-Day Execution Timeline, 14. 5-Minute SIH Winning Demo Script, 15. Remaining Risks & Mitigations, 1. Project Architecture, 2. Current Implementation Status Matrix (+14 more)

### Community 30 - "AuthContext.tsx"
Cohesion: 0.36
Nodes (8): AuthContext, AuthContextType, AuthProvider(), isSupabaseConfigured(), mapSupabaseUserToAppUser(), supabase, authService, User

### Community 31 - "procurement.py"
Cohesion: 0.14
Nodes (30): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, FindingReviewRequest, get_bidder_integrity_endpoint(), BaseModel (+22 more)

### Community 32 - "_make_digital_pdf"
Cohesion: 0.11
Nodes (13): _make_digital_pdf(), _map_db_doc_standalone(), Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Inline version of _map_db_doc_to_frontend for tests that cannot import…, Tests for API response shapes using the document_service module directly. These…, validate_file() returns None when the file is valid., validate_file() returns an error string when validation fails., process_ocr_from_bytes() should return a dict with all required OCRResult… (+5 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.15
Nodes (12): calculate_case_risk(), Any, date, datetime, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70). (+4 more)

### Community 34 - "integrity/__init__.py"
Cohesion: 0.10
Nodes (33): enrich_bidder_features_with_history(), extract_bidder_features(), extract_directors_from_fields(), extract_email_domain(), extract_pan_from_gstin(), extract_pincode(), get_tender_bidder_features(), normalize_address() (+25 more)

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.17
Nodes (10): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., Main entry point should return (text, confidence, engine) for a PDF. (+2 more)

### Community 36 - "intelligence/__init__.py"
Cohesion: 0.10
Nodes (45): Bottleneck and File Stagnation Detection Engine. Analyzes case stage…, Constants and Configuration for the Case Intelligence & Risk Engine. All…, calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), classify_deadline_status(), determine_delay_status() (+37 more)

### Community 37 - "test_documents.py"
Cohesion: 0.13
Nodes (15): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, _minimal_pdf_with_text() (+7 more)

### Community 38 - "calculate_risk"
Cohesion: 0.26
Nodes (6): calculate_risk(), Calculate a transparent risk score for a case. Args: case: Raw case dict from…, Backend tests for critical functionality. These tests use unit-testing patterns…, Tests for risk_service.py — no database needed., Helper to create a minimal case dict for risk calculation., TestRiskService

### Community 39 - "procurement_service.py"
Cohesion: 0.09
Nodes (31): check_application_completeness(), check_blacklisting_declaration(), check_experience_status(), check_gst_present(), check_land_availability(), check_local_content(), check_oem_present(), check_statutory_compliance() (+23 more)

### Community 40 - "assess_bidder_integrity"
Cohesion: 0.11
Nodes (22): IntegrityAssessment, BaseModel, Consolidated integrity evaluation for a tender or bidder. Provides…, Transparent point decomposition of an individual finding's impact on overall…, Parameters and thresholds used in the integrity assessment. Surfaced to…, RiskBasis, ScoreContributor, aggregate_integrity_findings() (+14 more)

### Community 41 - "RelationshipGraph.tsx"
Cohesion: 0.11
Nodes (18): BidderInput, BidderNodeData, buildGraph(), C, colForField(), edgeColorForField(), EdgeSel, fieldLabel() (+10 more)

### Community 42 - "case_service.py"
Cohesion: 0.12
Nodes (22): create_project(), put, update_project(), _create_audit_log(), create_case(), forward_case(), get_case_by_id(), _map_db_case_to_frontend() (+14 more)

### Community 43 - "TestDocumentStatus"
Cohesion: 0.22
Nodes (7): Tests for OCR status transitions and persistence logic., Document ocr_status values should be a known set., When process_ocr() succeeds, the DB record should be updated to COMPLETED. We…, When storage download fails, ocr_status must be set to FAILED., process_ocr() should raise ValueError when document_id is not found., TestDocumentStatus, patch

### Community 44 - "SystemContext.tsx"
Cohesion: 0.22
Nodes (11): ProtectedRoute(), PublicRoute(), AppHeader(), GovMainHeader(), SystemStatusDrawer(), useAuth(), INITIAL_ALERTS, SystemAlert (+3 more)

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
Nodes (19): BidderFeature, Normalized feature representation of a participating bidder., analyze_document_identity_inconsistencies(), analyze_related_bidders(), IntegrityFinding, Detect document-level identity cross-contamination where OCR-extracted…, Detect shared identity attributes across all pairwise combinations of…, Detect persistent non-competitive participation in category (>= 4 tenders with… (+11 more)

### Community 50 - "verification_provider.py"
Cohesion: 0.28
Nodes (5): DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only…, VerificationProvider, VerificationResult, Protocol

### Community 51 - "TestLandWorkflow"
Cohesion: 0.22
Nodes (5): Verify the 11-stage canonical sequence., All stages have defined positive baseline durations., Stage next progression works as expected., Test probability to risk level mappings., TestLandWorkflow

### Community 52 - "Google Authentication with Supabase — Step-by-Step Setup Guide"
Cohesion: 0.15
Nodes (12): 1. Google Cloud Console Setup, 2. Supabase Dashboard Setup, 3. Database Sync Trigger (Optional but Recommended), 4. Local Environment Verification, Architecture Overview, Google Authentication with Supabase — Step-by-Step Setup Guide, Running the App:, Step 1.1: Create or Select a Project (+4 more)

### Community 53 - "generate_la_recommendations"
Cohesion: 0.33
Nodes (5): generate_la_recommendations(), Any, Generate structured, transparent operational recommendations for Land…, Recommendations match detected factors., TestBottleneckAndRecommendations

### Community 55 - "TestRecommendationsAndIntelligence"
Cohesion: 0.25
Nodes (5): Tests for actionable operational recommendations and full intelligence pipeline., Overdue case recommends Section 5 condonation and emergency escalation., Approaching deadline + bottleneck recommends fast-tracking file., compute_case_intelligence produces a complete CaseIntelligenceResult model., TestRecommendationsAndIntelligence

### Community 56 - "react"
Cohesion: 0.14
Nodes (16): react, EmptyStateProps, GovButton(), GovButtonProps, GovCard(), GovCardProps, GovModal(), GovModalProps (+8 more)

### Community 57 - "Verification Results"
Cohesion: 0.22
Nodes (8): 1. Integrity Service Layer (`backend/app/services/integrity/`), 2. Read-Only API Endpoints (`backend/app/api/routes/procurement.py`), Backend Test Suite, Frontend Build, Graphify, Key Deliverables, Procurement Integrity Engine — Backend Foundation (Day 1 / Task 3), Verification Results

### Community 58 - "Case Intelligence & Risk Engine"
Cohesion: 0.17
Nodes (11): 1. Overview & Architecture, 2. Core Capabilities, 3. Risk Scoring Breakdown, 4. How Person 1 Integrates This Module, 5. Changing Thresholds and Configuration, 6. Running Automated Tests, A. Single Case Intelligence, B. Priority Ranking for Cases List (+3 more)

### Community 59 - "useLanguage"
Cohesion: 0.16
Nodes (15): GovHorizontalNav(), NavItem, GovTopStrip(), useLanguage(), useProcurement(), Dashboard(), ProcurementAuditTrail(), ProcurementDashboard() (+7 more)

### Community 60 - "SignalType"
Cohesion: 0.07
Nodes (44): analyze_bid_price_similarity(), _get_valid_quote(), Return the bidder's quote_amount as a float only if it is a valid positive…, Detect suspiciously close bid prices among participating vendors. Trigger: When…, Enum, Procurement Integrity Engine Models — SIH26100 V2…, Catalog of deterministic integrity signal categories., SignalType (+36 more)

### Community 61 - "Graph Report - SIH  (2026-08-28)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - SIH  (2026-08-28), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 62 - "train.py"
Cohesion: 0.50
Nodes (3): ML Model Training Script — Land Acquisition Delay Prediction…, Full training pipeline: 1. Load dataset (generate if missing) 2. Validate…, train()

### Community 63 - "document_service.py"
Cohesion: 0.15
Nodes (14): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), post, UploadFile (+6 more)

### Community 64 - "TestPriorityAndDashboardAggregation"
Cohesion: 0.33
Nodes (4): Tests for case priority ranking and executive dashboard KPI computation., Ranks cases in correct operational hierarchy: 1. Overdue first (regardless of…, aggregate_dashboard_intelligence computes real KPI numbers correctly., TestPriorityAndDashboardAggregation

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
Nodes (8): FontSize, Language, LanguageContext, LanguageContextType, TranslationKey, translations, en, hi

### Community 72 - "test_session_ephemeral.py"
Cohesion: 0.14
Nodes (18): _create_bidder(), _create_tender(), _get_bidder_by_id(), _get_bidders(), _get_document_by_id(), _get_tenders(), Session-Ephemeral Data Behavior Tests (SIH26100) Validates DEMO_SESSION_MODE…, A document record saved during a session must disappear after reset. (+10 more)

### Community 73 - "21. Development Principles"
Cohesion: 0.29
Nodes (7): 21. Development Principles, Deterministic rules remain deterministic, Evidence over assumptions, Explainability matters, Human decisions remain human, Mock mode is not production data, Small, composable intelligence services

### Community 74 - "3. Key Capabilities"
Cohesion: 0.29
Nodes (7): 3.1 Process Discovery, 3.2 Bottleneck & Rework Detection, 3.3 Delay-Risk Prediction, 3.4 Deterministic Statutory Deadline Engine, 3.5 What-If Simulation, 3.6 Document Intake & OCR, 3. Key Capabilities

### Community 75 - "auth.py"
Cohesion: 0.14
Nodes (22): _create_default_profile(), get_me(), login(), logout(), get, post, Authentication routes. Delegates to Supabase Auth for actual credential…, Authenticate using Supabase Auth or local officer credentials. Returns a valid… (+14 more)

### Community 88 - "AppLayout.tsx"
Cohesion: 0.19
Nodes (13): PetroleumBackground(), PetroleumLensHUD(), AppLayout(), GlobalSearchModal(), GovBreadcrumb(), GovFooter(), BackgroundContext, BackgroundContextType (+5 more)

### Community 89 - "GOIP — Environment Variables & Configuration Guide"
Cohesion: 0.33
Nodes (5): 1. Backend Environment Variables (`backend/.env`), 2. Frontend Environment Variables (`.env`), Backend `.env` Template, Frontend `.env` Template, GOIP — Environment Variables & Configuration Guide

### Community 90 - "8. Typical Data Flow"
Cohesion: 0.50
Nodes (4): 8. Typical Data Flow, Case Intelligence, Document Intelligence, Simulation

### Community 91 - "TestMLPrediction"
Cohesion: 0.18
Nodes (6): Confirm forbidden target columns are NOT in input features., Feature vector handles empty/partial dictionaries gracefully., Model produces probability in [0.0, 1.0] and valid risk levels., Clean project with 100% docs and no disputes should be low risk., Project with active conflict, dispute, and compensation delay is high risk., TestMLPrediction

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

### Community 99 - "run_full_verification"
Cohesion: 0.18
Nodes (15): process_ocr_from_bytes(), Run OCR directly on uploaded bytes (without storing first). Used by the…, _preseed_compliance_results(), Synthetic Procurement History & Integrity Dataset Generator — SIH26100 V2…, Pre-compute and persist compliance results for all ACTIVE tender bidders. This…, Run the complete compliance verification pipeline for a bidder. Returns a…, run_full_verification(), Verify that changing the filename of a high-risk PDF to 'Compliant_Perfect.pdf'… (+7 more)

### Community 100 - "projects.py"
Cohesion: 0.07
Nodes (50): _enrich_project_with_ml(), get_project(), get_project_delay_factors(), get_project_prediction(), get_project_recommendations(), get_project_timeline(), LandProjectCreate, LandProjectUpdate (+42 more)

### Community 101 - "seed.py"
Cohesion: 0.19
Nodes (10): main(), random_date(), Generate a random past date within the given range., seed_case_actions(), seed_cases(), seed_departments(), seed_documents(), seed_land_acquisition_projects() (+2 more)

### Community 103 - "get_bidder_documents"
Cohesion: 0.15
Nodes (18): get_bidder_documents_list(), Fetch all documents attached to a specific bidder., get_bidder_documents(), get_compliance_results(), Manually reset and reseed the procurement database with synthetic history., Persist compliance check results and discrepancies in the database., reset_and_seed_procurement_data(), save_compliance_assessment() (+10 more)

### Community 104 - "get_document"
Cohesion: 0.18
Nodes (11): download_document(), get_document(), get_document_status(), list_documents(), get, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.…, Lightweight endpoint for polling OCR processing status. Returns: {id,… (+3 more)

### Community 105 - "Reports.tsx"
Cohesion: 0.12
Nodes (16): GovPageHeader(), GovPageHeaderProps, ExtractedField, BIDDER_ASSESSMENTS, BidderAssessmentRecord, ExceptionRecord, EXCEPTIONS_DATA, OFFICER_REVIEWS (+8 more)

### Community 106 - "process_ocr"
Cohesion: 0.50
Nodes (4): process_ocr(), post, UploadFile, Accept a file, run OCR, and return extracted text + structured fields.…

### Community 107 - "calculate_days_remaining"
Cohesion: 0.16
Nodes (12): post, Re-evaluate all active cases and generate/update alerts accordingly., trigger_alert_refresh(), _create_alert(), Alert Service — generates real, data-driven alerts from the database. No random…, Run alert generation across ALL active cases. Call this on a schedule or after…, Insert a new alert if one of the same type for this case doesn't already exist.…, Evaluate a single case and generate/update alerts as appropriate. Called… (+4 more)

### Community 109 - "get_bidders"
Cohesion: 0.07
Nodes (32): get_procurement_dashboard(), list_tender_bidders(), Any, Get all participating bidders and their compliance posture., Safely convert an arbitrary OCR metadata value to float. Handles: int, float,…, Compute aggregate statistics from persistent database records., _safe_float(), get_bidders() (+24 more)

### Community 110 - "get_bidder_detail"
Cohesion: 0.14
Nodes (15): get_bidder_compliance(), get_bidder_detail(), get_document_evidence(), get_procurement_audit(), get_tender_detail(), list_all_documents(), list_tenders(), get (+7 more)

### Community 111 - "extract_fairbid_canonical"
Cohesion: 0.25
Nodes (13): _clean_cross_field_contamination(), _clean_str(), extract_fairbid_canonical(), _identify_sections(), is_fairbid_document(), _parse_explicit_key_values(), _parse_label_value_sequence(), _parse_three_column_table() (+5 more)

### Community 113 - "classify_document_type"
Cohesion: 0.43
Nodes (3): classify_document_type(), Classify a document type from its OCR text using deterministic rules. Returns a…, TestDocumentClassification

### Community 114 - "App.tsx"
Cohesion: 0.20
Nodes (9): App(), LanguageProvider(), SystemProvider(), getRandomCaptcha(), Login(), Search(), VERIFICATION_SOURCES, VerificationSource (+1 more)

### Community 116 - "run_cross_document_validation"
Cohesion: 0.20
Nodes (9): _field_value(), _get_field(), _name_similarity(), Compute string similarity ratio between two names., Compare extracted fields across documents to detect mismatches. Returns a list…, Find a field by key from extracted fields list., Get field value or None., run_cross_document_validation() (+1 more)

### Community 117 - "BidderVerification.tsx"
Cohesion: 0.25
Nodes (8): CheckStatus, Requirement, ALLOWED_TYPES, Banner, BannerKind, BidderVerification(), BidderView, DECISION_LABELS

### Community 118 - "generate_synthetic_docs.py"
Cohesion: 0.47
Nodes (5): build_doc_text(), create_pdf(), generate_all(), Synthetic Document Generator and Verification Benchmark for FairBid OCR…, run_benchmark()

### Community 119 - "seed_synthetic_procurement_history"
Cohesion: 0.40
Nodes (5): Seed synthetic procurement history with realistic multi-scenario data., seed_initial_data(), Populate the SQLite database with the complete deterministic procurement…, seed_synthetic_procurement_history(), Connection

### Community 121 - "list_alerts"
Cohesion: 0.67
Nodes (3): list_alerts(), get, List all alerts. Filter by read status or severity.

### Community 122 - "mark_alert_read"
Cohesion: 0.67
Nodes (3): mark_alert_read(), put, Mark a specific alert as read.

## Knowledge Gaps
- **408 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+403 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `projects.py`, `main.py`, `seed.py`, `get_document`, `enrich_case_with_deadlines`, `auth.py`, `case_service.py`, `calculate_days_remaining`, `detect_case_bottleneck`, `cases.py`, `list_alerts`, `mark_alert_read`, `document_service.py`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `get_current_user()` connect `main.py` to `projects.py`, `get_supabase`, `procurement_store.py`, `auth.py`, `get_bidders`, `test_integrity_engine.py`, `cases.py`, `procurement.py`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `_make_digital_pdf`, `projects.py`, `test_documents.py`, `calculate_risk`, `process_ocr`, `document_service.py`, `procurement.py`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `assess_tender_integrity()` (e.g. with `BidderFeature` and `IntegrityFinding`) actually correct?**
  _`assess_tender_integrity()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 39 inferred relationships involving `SignalType` (e.g. with `analyze_bid_price_similarity()` and `analyze_bid_rotation()`) actually correct?**
  _`SignalType` has 39 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_compliance_qualification_logic.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._