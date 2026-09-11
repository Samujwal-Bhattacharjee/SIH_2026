# Graph Report - SIH  (2026-09-11)

## Corpus Check
- 201 files · ~279,436 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2305 nodes · 4818 edges · 131 communities (115 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af45f08b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_every_benchmark_case_class_matches_calculated_score
- TestFieldExtraction
- test_case_activation.py
- @types/react-dom
- IntegrityFinding
- main.py
- get_supabase
- calculate_deadline_status
- procurement_store.py
- App.tsx
- deadline_service.py
- Communities (88 total, 14 thin omitted)
- compilerOptions
- classify_document_type
- case_service.py
- integrity/risk_engine.py
- types/index.ts
- schemas/__init__.py
- GOIP Backend API Contract Specification
- validate_file
- detect_case_bottleneck
- api/index.ts
- assess_tender_integrity
- cases.py
- dependencies
- GOIP Backend — Government File Tracking & Administrative Intelligence System
- compilerOptions
- test_ml_benchmark.py
- devDependencies
- SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation
- predict_delay
- build_compliance_dataset
- test_documents.py
- calculate_case_risk
- extract_la_fields
- extract_text_from_pdf_digital
- intelligence/__init__.py
- ocr_service.py
- dataset_generator.py
- test_compliance_qualification_logic.py
- aggregate_integrity_findings
- RelationshipGraph.tsx
- score_compliance_benchmark
- TestDocumentStatus
- train_and_evaluate_all
- GOIP — Government Operations Intelligence Platform
- generate_land_projects.py
- plugins
- package.json
- BidderFeature
- verification_provider.py
- land_workflow.py
- Google Authentication with Supabase — Step-by-Step Setup Guide
- score_integrity_benchmark
- calculate_risk
- test_intelligence.py
- Files.tsx
- Verification Results
- Case Intelligence & Risk Engine
- get_document
- test_integrity_engine.py
- Graph Report - SIH  (2026-08-28)
- train.py
- process_ocr
- _make_clean_check_results
- 2. Testing Endpoints via PowerShell / cURL
- 1. Integrity Module (`backend/app/services/integrity/`)
- 17. Demonstration Flow
- extract_fields_from_text
- vite-env.d.ts
- tsconfig.json
- vercel.json
- test_session_ephemeral.py
- 21. Development Principles
- 3. Key Capabilities
- auth.py
- react
- GOIP — Environment Variables & Configuration Guide
- 8. Typical Data Flow
- TestMLPrediction
- 10. Environment Configuration
- 5. Technology Stack
- 9. Getting Started
- UX4G (User Experience for Government) Design Guidelines
- react-router-dom
- @tailwindcss/postcss
- priority_engine.py
- test_land_acquisition.py
- projects.py
- seed.py
- @supabase/supabase-js
- test_ground_truth_benchmark.py
- AIModelValidation.tsx
- Reports.tsx
- generate_la_recommendations
- alert_service.py
- get_stage_index
- test_procurement_persistence.py
- procurement.py
- extract_fairbid_canonical
- dataset.py
- test_compliance_and_integrity_models_train_successfully
- Enum
- process_ocr
- ErrorBoundary
- Settings
- generate_synthetic_docs.py
- seed_initial_data
- GovNotificationTicker.tsx
- extract_procurement_fields
- list_alerts
- mark_alert_read
- test_scenario_9_dashboard_equals_backend
- test_scenario_11_refresh_preserves_results
- test_synthetic_procurement_history_idempotency
- lucide-react
- deactivate_all_cases
- get_activated_case_ids
- clsx

## God Nodes (most connected - your core abstractions)
1. `react` - 72 edges
2. `get_supabase()` - 66 edges
3. `Communities (88 total, 14 thin omitted)` - 63 edges
4. `assess_tender_integrity()` - 59 edges
5. `BidderFeature` - 42 edges
6. `IntegrityFinding` - 37 edges
7. `get_db()` - 34 edges
8. `init_db()` - 33 edges
9. `get_bidders()` - 30 edges
10. `score_compliance_benchmark()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `test_document_upload_ocr_compliance_flow()` --calls--> `get_bidders()`  [EXTRACTED]
  backend/tests/test_procurement_persistence.py → backend/app/core/procurement_store.py
- `test_officer_decision_and_audit_trail()` --calls--> `get_bidders()`  [EXTRACTED]
  backend/tests/test_procurement_persistence.py → backend/app/core/procurement_store.py
- `generate_recommendation()` --uses--> `BottleneckInfo`  [INFERRED]
  backend/app/services/intelligence/recommendation_engine.py → backend/app/services/intelligence/schemas.py
- `generate_la_recommendations()` --uses--> `BottleneckInfo`  [INFERRED]
  backend/app/services/intelligence/recommendation_engine.py → backend/app/services/intelligence/schemas.py
- `TestRecommendationsAndIntelligence` --uses--> `BottleneckInfo`  [INFERRED]
  backend/tests/test_intelligence.py → backend/app/services/intelligence/schemas.py

## Import Cycles
- None detected.

## Communities (131 total, 16 thin omitted)

### Community 0 - "test_every_benchmark_case_class_matches_calculated_score"
Cohesion: 0.33
Nodes (6): classify_integrity_score(), Derive statutory integrity risk classification from a continuous 0-100 score.…, CRITICAL GROUND-TRUTH VALIDITY ASSERTION: For EVERY benchmark case in…, Explicit mathematical verification of integrity risk tier thresholds: LOW:…, test_every_benchmark_case_class_matches_calculated_score(), test_mathematical_integrity_threshold_examples()

### Community 1 - "TestFieldExtraction"
Cohesion: 0.12
Nodes (7): Tests for regex-based structured field extraction., Helper: run extraction and return {key: value} dict., Fields not found should be absent from the list, not present with null., All confidence scores must be between 0 and 1., All regex-extracted fields should have isExtracted=True., Smoke test: realistic court order text extracts at least case number and court., TestFieldExtraction

### Community 2 - "test_case_activation.py"
Cohesion: 0.08
Nodes (43): is_case_activated(), SESSION-EPHEMERAL RESET — Core startup routine for DEMO_SESSION_MODE. Deletes…, Check if a case is currently activated in this session., reset_session_db(), generate_case_pdf(), generate_jbmd_case_pdf(), generate_ndmc_case_pdf(), Synthetic Case Document Generator (SIH26100)… (+35 more)

### Community 4 - "IntegrityFinding"
Cohesion: 0.11
Nodes (36): _finding(), RiskLevel, Build a minimal IntegrityFinding dict for benchmark storage., analyze_bid_rotation(), analyze_bid_to_estimate_anomaly(), analyze_commercial_boq_patterns(), analyze_losing_bid_pattern(), analyze_narrow_competition() (+28 more)

### Community 5 - "main.py"
Cohesion: 0.08
Nodes (29): Dashboard route — returns real aggregate statistics from the database. No…, Document routes — upload, OCR, retrieval, and download endpoints. Route prefix:…, OCR process endpoint — accepts a raw file upload for immediate OCR. Used by the…, check_verification(), BaseModel, get, post, verification_sources() (+21 more)

### Community 6 - "get_supabase"
Cohesion: 0.11
Nodes (36): get_case_intelligence_detail(), get_legal_opinion(), get_movements(), get_performance(), get_process_map(), get_ranked_cases(), get_risk_cases(), get_risk_prediction() (+28 more)

### Community 7 - "calculate_deadline_status"
Cohesion: 0.09
Nodes (25): calculate_case_age(), calculate_days_remaining(), calculate_deadline_status(), calculate_statutory_deadline(), normalize_to_date(), date, datetime, Deadline & Limitation Calculation Engine. Provides transparent, deterministic… (+17 more)

### Community 8 - "procurement_store.py"
Cohesion: 0.09
Nodes (66): get_bidder_detail(), UploadFile, Get single bidder metadata, verification status, and requirements., Step 1: Read file and run OCR extraction. Step 2: Classify document type if not…, upload_bidder_document(), activate_case_fixture(), _activated_case_tender_ids(), create_bidder_record() (+58 more)

### Community 9 - "App.tsx"
Cohesion: 0.06
Nodes (58): GovPageHeader(), GovPageHeaderProps, AppSidebar(), NAV_ITEMS, GovHorizontalNav(), NavItem, GovTopStrip(), FontSize (+50 more)

### Community 10 - "deadline_service.py"
Cohesion: 0.08
Nodes (26): calculate_age_days(), calculate_days_remaining(), calculate_deadline(), get_deadline_status(), map_deadline_status_to_case_status(), map_deadline_status_to_priority(), map_deadline_status_to_risk_level(), parse_iso_date() (+18 more)

### Community 11 - "Communities (88 total, 14 thin omitted)"
Cohesion: 0.03
Nodes (63): Communities (88 total, 14 thin omitted), Community 0 - "projects.py", Community 10 - "case_service.py", Community 11 - "ocr_service.py", Community 12 - "compilerOptions", Community 13 - "procurement_service.py", Community 14 - "UploadDocument.tsx", Community 15 - "api/index.ts" (+55 more)

### Community 12 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, src, vite/client, vite-env.d.ts, compilerOptions, allowImportingTsExtensions (+19 more)

### Community 13 - "classify_document_type"
Cohesion: 0.43
Nodes (3): classify_document_type(), Classify a document type from its OCR text using deterministic rules. Returns a…, TestDocumentClassification

### Community 14 - "case_service.py"
Cohesion: 0.12
Nodes (24): get_dashboard_metrics(), get, Returns aggregate operational statistics computed from the live database. Every…, _create_audit_log(), create_case(), forward_case(), get_case_by_id(), _map_db_case_to_frontend() (+16 more)

### Community 15 - "integrity/risk_engine.py"
Cohesion: 0.08
Nodes (48): Bid & Historical Pattern Analyzer — Procurement Integrity Engine V2…, enrich_bidder_features_with_history(), extract_bidder_features(), extract_directors_from_fields(), extract_email_domain(), extract_pan_from_gstin(), extract_pincode(), get_tender_bidder_features() (+40 more)

### Community 16 - "types/index.ts"
Cohesion: 0.05
Nodes (66): RiskAttributionPanelProps, FileMovementTimeline(), FileMovementTimelineProps, CustomWorkflowNode, WorkflowDrawerProps, AuthContext, AuthContextType, AuthProvider() (+58 more)

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
Nodes (18): TableSkeleton(), Dashboard(), Intelligence(), LA_WORKFLOW_STAGES, LandWorkflowStage, analyticsService, auditService, authService (+10 more)

### Community 22 - "assess_tender_integrity"
Cohesion: 0.08
Nodes (25): analyze_decision_traceability_gap(), assess_tender_integrity(), Any, Detect bids marked 'NOT_EVALUATED' without any recorded reason or…, Primary entry point: Run comprehensive integrity assessment for a given tender.…, Verify that every assessment provides decomposable score contributions and…, Verify detection quality across new live seeded scenarios 9, 10, and 11., Scenario 1: TEN-2026-001 with independent bidders must evaluate to LOW risk… (+17 more)

### Community 23 - "cases.py"
Cohesion: 0.10
Nodes (25): create_case(), delete_case(), forward_case(), get_case(), list_cases(), get, post, put (+17 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): framer-motion, dependencies, framer-motion, react, react-dom, recharts, tailwind-merge, @tailwindcss/vite (+9 more)

### Community 25 - "GOIP Backend — Government File Tracking & Administrative Intelligence System"
Cohesion: 0.09
Nodes (22): 10. Test the API, 1. Clone and navigate, 2. Create virtual environment, 3. Install dependencies, 4. Configure environment, 5. Configure Supabase, 6. Run the database schema, 7. Seed demo data (optional) (+14 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+11 more)

### Community 27 - "test_ml_benchmark.py"
Cohesion: 0.10
Nodes (19): Tests for Procurement ML Benchmark — Decoupled Compliance & Integrity Models…, Verify that features contain no target labels, scores, finding outputs, or…, Predictions on held-out data must only belong to valid risk classes., Benchmark metrics must reflect strictly held-out test data samples., Persisted joblib files must load and support predict and predict_proba., Models must expose top-10 feature importances sorted descending., Benchmark JSON must carry mandatory honesty declarations., GET /api/v1/procurement/ml/benchmark must return 200 with benchmark structure. (+11 more)

### Community 28 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, oxlint, devDependencies, autoprefixer, oxlint, postcss, tailwindcss, @types/node (+11 more)

### Community 29 - "SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation"
Cohesion: 0.09
Nodes (22): 10. Team Task Allocation & Responsibilities, 11. Exact File Ownership Matrix, 12. Task Priority Framework (P0 – P3), 13. Practical 7-Day Execution Timeline, 14. 5-Minute SIH Winning Demo Script, 15. Remaining Risks & Mitigations, 1. Project Architecture, 2. Current Implementation Status Matrix (+14 more)

### Community 30 - "predict_delay"
Cohesion: 0.21
Nodes (15): get_project_delay_factors(), get_feature_importance(), Return feature importance dict, or empty dict if not available., _deterministic_fallback(), _estimate_delay_days(), _get_top_factors(), _get_top_factors_with_importance(), predict_delay() (+7 more)

### Community 31 - "build_compliance_dataset"
Cohesion: 0.20
Nodes (15): assert_no_target_leakage(), build_compliance_dataset(), build_integrity_dataset(), extract_compliance_features(), extract_integrity_features(), Any, ndarray, Raw Feature Extraction and Anti-Leakage Validation for Procurement ML Benchmark… (+7 more)

### Community 32 - "test_documents.py"
Cohesion: 0.10
Nodes (16): _make_digital_pdf(), _map_db_doc_standalone(), _minimal_pdf_with_text(), Document pipeline tests — Person 2 additions. These tests are isolated from…, Create a minimal digital (text-based) PDF in memory using PyMuPDF. Falls back…, Produce the smallest valid PDF that embeds plain ASCII text. Used only as…, Inline version of _map_db_doc_to_frontend for tests that cannot import…, Tests for API response shapes using the document_service module directly. These… (+8 more)

### Community 33 - "calculate_case_risk"
Cohesion: 0.16
Nodes (11): calculate_case_risk(), Any, date, Calculate an explainable, deterministic risk score and breakdown for a case.…, Tests for deterministic risk scoring and point breakdowns., Case with 45 days remaining and no stagnation scores LOW risk., Overdue case receives severe penalty and scores CRITICAL (>= 70)., Overdue legal opinion adds +15 points to the breakdown. (+3 more)

### Community 34 - "extract_la_fields"
Cohesion: 0.17
Nodes (12): extract_la_fields(), fields_to_ocr_list(), _find_date_near_keyword(), _parse_date(), Any, Land Acquisition Document Field Extractor…, Convert extracted fields dict to the OCRField list format expected by the…, Attempt to parse a date string into ISO format. Returns None on failure. (+4 more)

### Community 35 - "extract_text_from_pdf_digital"
Cohesion: 0.21
Nodes (9): extract_text_from_pdf_digital(), Extract text directly from a digital (non-scanned) PDF using PyMuPDF. Fast and…, Tests for digital PDF text extraction via PyMuPDF., PyMuPDF should extract non-empty text from a digital PDF., Extracted text should contain the content we embedded., Corrupted/empty input should not crash — returns empty string., Non-PDF binary data should not crash — returns empty string., TestPDFTextExtraction (+1 more)

### Community 36 - "intelligence/__init__.py"
Cohesion: 0.18
Nodes (13): Constants and Configuration for the Case Intelligence & Risk Engine. All…, Case Intelligence & Risk Engine Package. Provides transparent, deterministic…, Operational Recommendation Engine. Produces actionable, deterministic…, datetime, Explainable Risk Scoring Engine. Computes a deterministic, fully explainable…, CaseIntelligenceResult, DashboardIntelligenceSummary, BaseModel (+5 more)

### Community 37 - "ocr_service.py"
Cohesion: 0.14
Nodes (13): extract_text_from_document(), extract_text_from_image_ocr(), extract_text_from_pdf_ocr(), OCR Service — modular document text extraction. Architecture: 1. Try PyMuPDF…, Main entry point for text extraction. Returns (text, confidence, engine_used).…, Extract text from a scanned document or image using Tesseract OCR. Returns…, Convert PDF pages to images and OCR them. Used when PyMuPDF yields insufficient…, Main entry point should return (text, confidence, engine) for a PDF. (+5 more)

### Community 38 - "dataset_generator.py"
Cohesion: 0.20
Nodes (14): generate_benchmark_dataset(), generate_synthetic_case(), _make_compliance_check(), _make_integrity_finding(), Any, RiskLevel, FairBid Ground-Truth ML Benchmark Dataset Generator — SIH26100…, Create a structured IntegrityFinding dict for Task 1 benchmark engine. (+6 more)

### Community 39 - "test_compliance_qualification_logic.py"
Cohesion: 0.04
Nodes (81): calculate_compliance_score(), calculate_risk_level(), check_application_completeness(), check_blacklisting_declaration(), check_experience_status(), check_gst_present(), check_land_availability(), check_local_content() (+73 more)

### Community 40 - "aggregate_integrity_findings"
Cohesion: 0.17
Nodes (14): aggregate_integrity_findings(), AggregateResult, calculate_risk_tier(), generate_executive_summary(), IntegrityFinding, RiskLevel, Map continuous 0-100 risk score to standard 4-tier statutory classification., Backwards-compatible tuple holding (score, risk_level, confidence) with… (+6 more)

### Community 41 - "RelationshipGraph.tsx"
Cohesion: 0.11
Nodes (18): BidderInput, BidderNodeData, buildGraph(), C, colForField(), edgeColorForField(), EdgeSel, fieldLabel() (+10 more)

### Community 42 - "score_compliance_benchmark"
Cohesion: 0.12
Nodes (26): _check_result_per_rule_score(), classify_compliance_score(), _is_hard_fail_status(), Any, FairBid Ground-Truth Compliance Benchmark — SIH26100…, Map compliance score and mandatory hard-fail flag to COMPLIANCE RISK class.…, Map operational check status to a 0-100 per-rule score for benchmark weighting.…, Return True if the status constitutes a mandatory rule failure. (+18 more)

### Community 43 - "TestDocumentStatus"
Cohesion: 0.22
Nodes (7): Tests for OCR status transitions and persistence logic., Document ocr_status values should be a known set., When process_ocr() succeeds, the DB record should be updated to COMPLETED. We…, When storage download fails, ocr_status must be set to FAILED., process_ocr() should raise ValueError when document_id is not found., TestDocumentStatus, patch

### Community 44 - "train_and_evaluate_all"
Cohesion: 0.22
Nodes (13): _compute_classification_metrics(), _compute_regression_metrics(), _get_top_features(), Any, ndarray, Path, Model Training, Evaluation, and Persistence for Procurement ML Benchmark…, Extract real feature importances sorted descending. (+5 more)

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
Cohesion: 0.09
Nodes (25): _get_valid_quote(), Return the bidder's quote_amount as a float only if it is a valid positive…, BidderFeature, Normalized feature representation of a participating bidder., analyze_document_identity_inconsistencies(), analyze_related_bidders(), IntegrityFinding, Detect document-level identity cross-contamination where OCR-extracted… (+17 more)

### Community 50 - "verification_provider.py"
Cohesion: 0.28
Nodes (5): DemoVerificationProvider, Extensible government verification adapters for the procurement MVP. Only…, VerificationProvider, VerificationResult, Protocol

### Community 51 - "land_workflow.py"
Cohesion: 0.12
Nodes (13): get_project_bottlenecks(), get_expected_days(), get_next_stage(), get_risk_level_from_probability(), Land Acquisition Workflow Constants — SIH26017…, Convert a delay probability (0.0–1.0) to a risk level label., Return the next stage after the current one, or None if at the end., Return the expected duration in days for a given stage. (+5 more)

### Community 52 - "Google Authentication with Supabase — Step-by-Step Setup Guide"
Cohesion: 0.15
Nodes (12): 1. Google Cloud Console Setup, 2. Supabase Dashboard Setup, 3. Database Sync Trigger (Optional but Recommended), 4. Local Environment Verification, Architecture Overview, Google Authentication with Supabase — Step-by-Step Setup Guide, Running the App:, Step 1.1: Create or Select a Project (+4 more)

### Community 53 - "score_integrity_benchmark"
Cohesion: 0.08
Nodes (31): IntegrityFinding, Resolve a SignalType enum member from its string value safely., Calculate the FairBid integrity ground-truth benchmark score. Parameters…, Return family name for a signal type value string., score_integrity_benchmark(), _signal_family(), _signal_type_from_value(), _make_multi_signal_findings() (+23 more)

### Community 54 - "calculate_risk"
Cohesion: 0.31
Nodes (5): calculate_risk(), Calculate a transparent risk score for a case. Args: case: Raw case dict from…, Tests for risk_service.py — no database needed., Helper to create a minimal case dict for risk calculation., TestRiskService

### Community 55 - "test_intelligence.py"
Cohesion: 0.12
Nodes (12): generate_recommendation(), Generate a precise, rule-based operational recommendation for the responsible…, Comprehensive Automated Test Suite for Case Intelligence & Risk Engine. All…, Tests for actionable operational recommendations and full intelligence pipeline., Overdue case recommends Section 5 condonation and emergency escalation., Approaching deadline + bottleneck recommends fast-tracking file., compute_case_intelligence produces a complete CaseIntelligenceResult model., Tests for case priority ranking and executive dashboard KPI computation. (+4 more)

### Community 56 - "Files.tsx"
Cohesion: 0.08
Nodes (47): FormField(), FormFieldProps, inputBaseClasses, selectBaseClasses, textareaBaseClasses, GovBadge, StatusBadge(), StatusBadgeProps (+39 more)

### Community 57 - "Verification Results"
Cohesion: 0.22
Nodes (8): 1. Integrity Service Layer (`backend/app/services/integrity/`), 2. Read-Only API Endpoints (`backend/app/api/routes/procurement.py`), Backend Test Suite, Frontend Build, Graphify, Key Deliverables, Procurement Integrity Engine — Backend Foundation (Day 1 / Task 3), Verification Results

### Community 58 - "Case Intelligence & Risk Engine"
Cohesion: 0.17
Nodes (11): 1. Overview & Architecture, 2. Core Capabilities, 3. Risk Scoring Breakdown, 4. How Person 1 Integrates This Module, 5. Changing Thresholds and Configuration, 6. Running Automated Tests, A. Single Case Intelligence, B. Priority Ranking for Cases List (+3 more)

### Community 59 - "get_document"
Cohesion: 0.18
Nodes (11): download_document(), get_document(), get_document_status(), list_documents(), get, List documents, optionally filtered by case, search term, or OCR status., Get a single document's metadata, extracted text, and structured OCR fields.…, Lightweight endpoint for polling OCR processing status. Returns: {id,… (+3 more)

### Community 60 - "test_integrity_engine.py"
Cohesion: 0.05
Nodes (54): analyze_bid_price_similarity(), Detect suspiciously close bid prices among participating vendors. Trigger: When…, auth_client(), _make_bidder(), fixture, Unit Tests — Procurement Integrity Engine (SIH26100 Day 1 / Task 3)…, Detect bids clustered abnormally close to the official estimated tender value., Detect cover bidding where a bidder repeatedly finishes 2nd behind the winner… (+46 more)

### Community 61 - "Graph Report - SIH  (2026-08-28)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - SIH  (2026-08-28), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 62 - "train.py"
Cohesion: 0.50
Nodes (3): ML Model Training Script — Land Acquisition Delay Prediction…, Full training pipeline: 1. Load dataset (generate if missing) 2. Validate…, train()

### Community 63 - "process_ocr"
Cohesion: 0.25
Nodes (8): post, UploadFile, Trigger OCR processing on an already-uploaded document. Pipeline: 1. Retrieve…, Upload a document and attach it to a case. - Validates file type (PDF, PNG,…, run_ocr_on_document(), upload_document(), process_ocr(), Run OCR on a stored document and update the database record. Returns the OCR…

### Community 64 - "_make_clean_check_results"
Cohesion: 0.09
Nodes (25): _make_clean_check_results(), _make_mandatory_fail_check_results(), Any, Same check_results always produce exactly the same benchmark score., Fully compliant bidder must produce LOW compliance classification., GST + PAN failures (mandatory HARD FAILs) must cap score at 40.0., Even a single mandatory NON_COMPLIANT must produce CRITICAL classification., EXPIRED OEM authorization must trigger HARD FAIL (status = EXPIRED). (+17 more)

### Community 65 - "2. Testing Endpoints via PowerShell / cURL"
Cohesion: 0.25
Nodes (7): 1. Complete API Contract Matrix, 1. Health Check, 2. Login, 2. Testing Endpoints via PowerShell / cURL, 3. Fetch Dashboard Metrics, 4. Fetch Ranked Cases (Case Intelligence Engine), GOIP — API Integration Checklist & Contract Verification

### Community 66 - "1. Integrity Module (`backend/app/services/integrity/`)"
Cohesion: 0.12
Nodes (16): 1. Integrity Module (`backend/app/services/integrity/`), 2. API Routes (`backend/app/api/routes/procurement.py`), 3. Unit Tests (`backend/tests/test_integrity_engine.py`), Automated Tests, Implementation Plan - Procurement Integrity Engine (Backend Foundation), [MODIFY] [procurement.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/api/routes/procurement.py), [NEW] [test_integrity_engine.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/tests/test_integrity_engine.py), [NEW/UPDATE] [bid_analyzer.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/bid_analyzer.py) (+8 more)

### Community 67 - "17. Demonstration Flow"
Cohesion: 0.25
Nodes (8): 17. Demonstration Flow, 1. Sign In, 2. Dashboard, 3. Workflow, 4. Case Intelligence, 5. Document Intelligence, 6. Simulation, 7. Decision Support

### Community 68 - "extract_fields_from_text"
Cohesion: 0.29
Nodes (4): extract_fields_from_text(), Attempt to extract structured fields from raw OCR text using regex patterns.…, Tests for regex-based field extraction in ocr_service.py., TestOCRService

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

### Community 88 - "react"
Cohesion: 0.07
Nodes (35): react, ProtectedRoute(), PublicRoute(), Emblem(), EmblemProps, PetroleumBackground(), PetroleumLensHUD(), StatutoryDeadlineEngineProps (+27 more)

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

### Community 98 - "priority_engine.py"
Cohesion: 0.24
Nodes (14): classify_deadline_status(), determine_delay_status(), Determine composite operational delay status., Classify a case's deadline urgency based on days remaining. Classification…, aggregate_dashboard_intelligence(), compute_case_intelligence(), Any, date (+6 more)

### Community 99 - "test_land_acquisition.py"
Cohesion: 0.22
Nodes (9): is_model_ready(), load_model(), Any, Model Loader — Singleton model loading for inference.…, Load the trained RandomForest model from disk. Returns None if the model file…, Return True if the model has been trained and is ready for inference., Clear the singleton cache. Mainly for testing., reset_cache() (+1 more)

### Community 100 - "projects.py"
Cohesion: 0.14
Nodes (20): create_project(), _enrich_project_with_ml(), get_project(), get_project_prediction(), LandProjectCreate, LandProjectUpdate, list_projects(), BaseModel (+12 more)

### Community 101 - "seed.py"
Cohesion: 0.19
Nodes (10): main(), random_date(), Generate a random past date within the given range., seed_case_actions(), seed_cases(), seed_departments(), seed_documents(), seed_land_acquisition_projects() (+2 more)

### Community 103 - "test_ground_truth_benchmark.py"
Cohesion: 0.07
Nodes (33): evaluate_all_benchmark_cases(), Evaluate all 11 benchmark cases and return their results. Reproducible: same…, Test Suite -- FairBid Ground-Truth Benchmark Engine…, All compliance benchmark rule weights must sum exactly to 100., Benchmark table must contain exactly 9 rules., Exactly 5 mandatory (HARD FAIL) rules., Dataset must have exactly 11 cases., All case IDs in the dataset must be unique. (+25 more)

### Community 104 - "AIModelValidation.tsx"
Cohesion: 0.28
Nodes (8): AIModelValidation(), BenchmarkResponse, ConfusionMatrixData, FeatureImportance, formatFeatureName(), getRiskBadgeClass(), ModelMetrics, SamplePrediction

### Community 105 - "Reports.tsx"
Cohesion: 0.15
Nodes (12): BIDDER_ASSESSMENTS, BidderAssessmentRecord, ExceptionRecord, EXCEPTIONS_DATA, OFFICER_REVIEWS, OfficerReviewRecord, Reports(), ReportType (+4 more)

### Community 106 - "generate_la_recommendations"
Cohesion: 0.29
Nodes (6): get_project_recommendations(), generate_la_recommendations(), Any, Generate structured, transparent operational recommendations for Land…, Recommendations match detected factors., TestBottleneckAndRecommendations

### Community 107 - "alert_service.py"
Cohesion: 0.22
Nodes (10): post, Re-evaluate all active cases and generate/update alerts accordingly., trigger_alert_refresh(), _create_alert(), Alert Service — generates real, data-driven alerts from the database. No random…, Run alert generation across ALL active cases. Call this on a schedule or after…, Insert a new alert if one of the same type for this case doesn't already exist.…, Evaluate a single case and generate/update alerts as appropriate. Called… (+2 more)

### Community 108 - "get_stage_index"
Cohesion: 0.33
Nodes (6): get_project_timeline(), get_stage_index(), Return the 0-based index of a stage in the canonical workflow. Returns -1 if…, build_feature_vector(), Feature Definitions for Land Acquisition Delay Prediction Model…, Extract feature values from a project data dictionary. Args: project_data:…

### Community 109 - "test_procurement_persistence.py"
Cohesion: 0.07
Nodes (21): Any, Safely convert an arbitrary OCR metadata value to float. Handles: int, float,…, _safe_float(), Integration tests for authentication endpoints. Tests public/protected…, auth_client(), fixture, Integration and Persistence Tests for Procurement Pipeline (SIH26100)…, Unit tests for _safe_float handling all possible OCR confidence formats. (+13 more)

### Community 110 - "procurement.py"
Cohesion: 0.06
Nodes (52): actor_name(), add_bidder_to_tender(), BidderCreate, create_tender(), DecisionRequest, FindingReviewRequest, get_bidder_compliance(), get_bidder_documents_list() (+44 more)

### Community 111 - "extract_fairbid_canonical"
Cohesion: 0.12
Nodes (27): process_ocr_from_bytes(), Document Service — file upload to Supabase Storage and OCR pipeline. Note:…, Run OCR directly on uploaded bytes (without storing first). Used by the…, _clean_cross_field_contamination(), _clean_str(), extract_case_reference(), extract_fairbid_canonical(), _identify_sections() (+19 more)

### Community 112 - "dataset.py"
Cohesion: 0.18
Nodes (17): _build_benchmark_case(), _clean_checks(), _cross_doc_checks(), get_benchmark_case(), _high_compliance_checks(), list_benchmark_cases(), _low_compliance_checks(), _make_check() (+9 more)

### Community 113 - "test_compliance_and_integrity_models_train_successfully"
Cohesion: 0.40
Nodes (5): Path, Both models must fit and expose classes, estimators, and predictions., Two complete training passes with seed 42 must generate identical held-out…, test_compliance_and_integrity_models_train_successfully(), test_metrics_are_reproducible()

### Community 114 - "Enum"
Cohesion: 0.29
Nodes (12): CaseStage, CaseStatus, LegalOpinionStatus, MovementStatus, OCRStatus, PriorityLevel, Enum, str (+4 more)

### Community 115 - "process_ocr"
Cohesion: 0.50
Nodes (4): process_ocr(), post, UploadFile, Accept a file, run OCR, and return extracted text + structured fields.…

### Community 116 - "ErrorBoundary"
Cohesion: 0.18
Nodes (4): App(), ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 118 - "generate_synthetic_docs.py"
Cohesion: 0.60
Nodes (4): build_doc_text(), create_pdf(), generate_all(), Synthetic Document Generator and Verification Benchmark for FairBid OCR…

### Community 119 - "seed_initial_data"
Cohesion: 0.19
Nodes (12): Seed synthetic procurement history with realistic multi-scenario data., Populate _dormant_tender_ids and _dormant_bidder_ids from demo_case_fixtures., _rebuild_dormant_id_caches(), seed_initial_data(), _preseed_compliance_results(), Synthetic Procurement History & Integrity Dataset Generator — SIH26100 V2…, Pre-compute and persist compliance results for all ACTIVE tender bidders. This…, Seed demonstration case fixtures that remain hidden (dormant) until a matching… (+4 more)

### Community 121 - "extract_procurement_fields"
Cohesion: 0.39
Nodes (3): extract_procurement_fields(), Extract procurement-specific structured fields from OCR text. Used for bid…, TestFieldExtraction

### Community 122 - "list_alerts"
Cohesion: 0.67
Nodes (3): list_alerts(), get, List all alerts. Filter by read status or severity.

### Community 123 - "mark_alert_read"
Cohesion: 0.67
Nodes (3): mark_alert_read(), put, Mark a specific alert as read.

## Knowledge Gaps
- **415 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+410 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_supabase()` connect `get_supabase` to `projects.py`, `main.py`, `seed.py`, `get_document`, `generate_la_recommendations`, `auth.py`, `get_stage_index`, `alert_service.py`, `case_service.py`, `extract_fairbid_canonical`, `land_workflow.py`, `cases.py`, `list_alerts`, `mark_alert_read`, `predict_delay`, `process_ocr`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `validate_file()` connect `validate_file` to `test_documents.py`, `projects.py`, `procurement_store.py`, `deadline_service.py`, `procurement.py`, `extract_fairbid_canonical`, `process_ocr`, `process_ocr`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `get_current_user()` connect `main.py` to `test_case_activation.py`, `projects.py`, `get_supabase`, `procurement_store.py`, `auth.py`, `test_procurement_persistence.py`, `procurement.py`, `cases.py`, `test_integrity_engine.py`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _415 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TestFieldExtraction` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `test_case_activation.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07878787878787878 - nodes in this community are weakly interconnected._
- **Should `IntegrityFinding` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._