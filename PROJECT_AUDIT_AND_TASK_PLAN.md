# SIH 2026 — Complete Codebase Audit, Remaining Work & Team Task Allocation

**System**: GOIP — Government File Tracking & Administrative Intelligence System  
**Prototype Goal**: Automated court order ingestion, OCR extraction, statutory limitation tracking, file movement bottleneck detection, and explainable risk scoring for state government litigation.

---

## 1. Project Architecture

```
                                  GOVERNMENT USER / CITIZEN
                                              │
                                              ▼
                             ┌──────────────────────────────────┐
                             │    React 18 + TypeScript + Vite  │
                             │  (Government Standard UI/A11y)  │
                             └────────────────┬─────────────────┘
                                              │ REST API / Bearer JWT
                                              ▼
                             ┌──────────────────────────────────┐
                             │       FastAPI Backend (Python)   │
                             │   (46 REST Endpoints / 38 Paths) │
                             └───────┬──────────────────┬───────┘
                                     │                  │
               ┌─────────────────────┼──────────────┐   │
               ▼                     ▼              ▼   ▼
  ┌───────────────────────┐ ┌────────────────┐ ┌─────────────────────────┐
  │   Supabase Postgres   │ │Supabase Storage│ │ Case Intelligence Engine│
  │ (8 Relational Tables) │ │(gov-documents) │ │ (Deterministic Scoring) │
  └───────────────────────┘ └───────┬────────┘ └───────────┬─────────────┘
                                    │                      │
                                    ▼                      │
                        ┌────────────────────────┐         │
                        │    OCR / Text Engine   │         │
                        │(PyMuPDF + Tesseract-5) │         │
                        └───────────┬────────────┘         │
                                    │ Extracted Metadata   │
                                    └──────────────────────┘
```

---

## 2. Current Implementation Status Matrix

| Component | Status | Real vs. Mock | Description |
|---|---|---|---|
| **Frontend UI (Pages & Components)** | **[IMPLEMENTED]** | Real UI + Mock Adapter | 19 Pages + full government design system. Has built-in adapter switch (`VITE_USE_MOCK_API`). |
| **Backend REST APIs (FastAPI)** | **[IMPLEMENTED]** | Real Code | 46 endpoints across Auth, Cases, Documents, OCR, Risk, Workflow, Analytics, Alerts, Audit. |
| **Case Intelligence Engine** | **[IMPLEMENTED]** | Real Deterministic Engine | Modular package (`app.services.intelligence`) with 0–100 scoring, dwell detection, priority ranking. |
| **OCR Pipeline (PyMuPDF + Tesseract)** | **[IMPLEMENTED]** | Real Code | Ingestion pipeline with regex entity extraction (case number, court, order date, limitation days). |
| **Database Schema (`schema.sql`)** | **[IMPLEMENTED]** | Real SQL DDL | Complete DDL for `departments`, `users`, `cases`, `documents`, `case_movements`, `legal_opinions`, `alerts`, `audit_logs`. |
| **Database Seed Script (`seed.py`)** | **[IMPLEMENTED]** | Real Generator | Generates 40 realistic synthetic government litigation records across 8 departments. |
| **Supabase Cloud Instance** | **[NEEDS CONFIG]** | Requires Credentials | Needs developer to execute `schema.sql`, create `gov-documents` bucket, and populate `.env`. |
| **Frontend ↔ Backend Live Link** | **[READY FOR TOGGLE]**| Tested via client | Setting `VITE_USE_MOCK_API=false` connects frontend `realApi.ts` directly to FastAPI on port 8000. |

---

## 3. Detailed Feature Breakdown

### A. Completed Features (Production-Ready)
1. **Full Frontend UI**: All pages (`Dashboard`, `Files`, `FileDetail`, `UploadDocument`, `Risk`, `Intelligence`, `Workflow`, `Simulation`, `AuditLogs`, `Departments`, `Search`, `Login`) built with React, Lucide icons, and Tailwind styling.
2. **Deterministic Risk Scoring**: 6-factor explainable scoring engine with itemized point attributions and reason generation.
3. **Statutory Deadline Engine**: Dynamic limitation calculation with SLA status (`SAFE`, `WATCH`, `HIGH`, `CRITICAL`, `DUE_TODAY`, `OVERDUE`).
4. **File Stagnation & Bottleneck Detection**: Calculates days dwelled at current stage from movement records; flags warnings (>7d) and critical bottlenecks (>15d).
5. **Document Upload & Storage Handler**: Checksum generation, MIME validation, file size limits (20MB), and Supabase Storage upload.
6. **Multi-Engine OCR**: PyMuPDF for digital text PDFs + Tesseract OCR fallback for scanned images and low-density pages.
7. **Regex Legal Field Extractor**: Extracts Case Number, Court Name, Order Date, Limitation Period (days/weeks/months converted), and Directions.
8. **Automated Test Suite**: **102 tests passing** across `test_core.py`, `test_documents.py`, and `test_intelligence.py`.

### B. Partially Implemented / Configuration Required
1. **Supabase Cloud Setup**: `schema.sql` and `seed.py` are written, but must be run in a live Supabase project.
2. **Local Tesseract OS Binary**: `pytesseract` Python library is installed; Windows machine must have Tesseract-OCR binary installed for image OCR.
3. **Frontend API Toggle**: `VITE_USE_MOCK_API` is set to `true` by default; toggle to `false` in `.env` for the live backend demo.

### C. Mock / Synthetic Features (Intentionally Mocked for Prototype)
1. **Process Mining Discovery Graph (`/workflow/process-map`)**: Computed from live case stage counts; full PM4Py event log mining graph is modeled with rule-based heuristics for speed.
2. **Policy Simulation (`/simulation/run`)**: Rule-based simulation applying discrete intervention factors; sufficient for prototype presentation.

### D. Features NOT Required for SIH Prototype (Do Not Build)
- External SMS/WhatsApp citizen notification gateways.
- Complex multi-tenant departmental IAM SAML/SSO (Supabase email/password auth is sufficient).
- Heavy machine learning model retraining pipelines (XGBoost/LLM training).
- Real payment gateway for court fee stamps.

---

## 4. Feature Implementation & Ownership Table

| Feature | Current State | Real vs. Mock | What is Needed | Person |
|---|---|---|---|---|
| **User Authentication** | Working in code | Real (Supabase Auth) | Configure Supabase URL & keys in `backend/.env` | **Person 1** |
| **Case CRUD & State** | Complete | Real (PostgreSQL) | Run `schema.sql` and `seed.py` in Supabase | **Person 1** |
| **Case Movement / Forwarding**| Complete | Real (PostgreSQL) | Verify movement logging in `case_movements` table | **Person 1** |
| **Database Persistence** | Complete | Real (PostgreSQL) | Live credentials in `backend/.env` | **Person 1** |
| **Backend Deployment** | Runnable locally | Real (Uvicorn) | Deploy to Render / Railway / Render free tier | **Person 1** |
| **Document Upload & Storage** | Complete | Real (Supabase Storage) | Create `gov-documents` bucket in Supabase | **Person 2** |
| **Digital PDF Text Extraction**| Complete | Real (PyMuPDF) | Test with sample court order PDFs | **Person 2** |
| **Image / Scanned OCR** | Complete | Real (Tesseract) | Verify Tesseract binary in OS PATH | **Person 2** |
| **Structured Field Extraction**| Complete | Real (Regex rules) | Add any extra state-specific court patterns | **Person 2** |
| **Case Intelligence & Risk** | Complete | Real (Deterministic) | Verify end-to-end output in `/risk/intelligence` | **Person 2** |
| **Dashboard Metrics API** | Complete | Real (Aggregated DB) | Verify SQL counts against seeded cases | **Person 2** |
| **Frontend Auth Flow** | Complete | Real / Mock Switch | Test login -> token storage -> dashboard transition | **Person 3** |
| **Frontend Case Management** | Complete | Real / Mock Switch | Verify File List and File Detail with live API | **Person 3** |
| **Frontend Upload & OCR UI** | Complete | Real / Mock Switch | Test document scanning & field pre-fill in UI | **Person 3** |
| **Frontend Intelligence View** | Complete | Real / Mock Switch | Verify Risk Attribution Panel & Deadline Engine | **Person 3** |
| **End-to-End Demo Script** | Documented | Real Demo | Rehearse complete 5-minute hackathon demo | **All** |

---

## 5. Environment Variables & API Keys Audit

All environment variables are documented in [`ENV_SETUP.md`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/ENV_SETUP.md).

- **Backend** requires: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_STORAGE_BUCKET`, `CORS_ORIGINS`.
- **Frontend** requires: `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=http://localhost:8000`.
- **No external paid API keys** (OpenAI, AWS, Azure, Google Cloud) are required. Everything runs on free Supabase tier + local PyMuPDF / Tesseract.

---

## 6. Supabase & Database Status

- **Tables Defined in `schema.sql`**:
  1. `departments` (8 state departments with disposal averages)
  2. `users` (Officer profiles matched to Supabase Auth UUIDs)
  3. `cases` (Case metadata, court, order date, statutory deadlines)
  4. `documents` (Uploaded files, storage paths, OCR text, `extracted_fields` JSONB)
  5. `case_movements` (File forwarding audit trail)
  6. `legal_opinions` (Counsel referral requests and due dates)
  7. `alerts` (Automated limitation & stagnation notices)
  8. `audit_logs` (Immutable system activity logs)
- **Storage**: Single bucket named `gov-documents`.
- **Row Level Security (RLS)**: Configured; backend uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS securely.

---

## 7. OCR & Intelligence Pipeline Audit

- **OCR Strategy**:
  - `document_service.py` validates file size (≤20MB) and MIME type (`application/pdf`, `image/png`, `image/jpeg`).
  - Text extraction first attempts direct digital extraction via PyMuPDF. If extracted text is <100 characters (scanned PDF), it automatically triggers Tesseract page rasterization and OCR.
  - Regex rules in `ocr_service.py` extract: `caseNumber`, `court`, `orderDate`, `limitationDays`, `petitioner`, `directions`.
- **Intelligence Engine**:
  - Modular package in `backend/app/services/intelligence/`.
  - Calculates 0–100 risk score, flags bottlenecks (Moderate >7d, Critical >15d), assigns priority (`IMMEDIATE`, `URGENT`, `ROUTINE`), and provides actionable recommendations.
  - 100% deterministic and explainable — zero hallucinated AI predictions.

---

## 8. Frontend & API Contract Audit

- **Frontend Architecture**:
  - React 18, Vite, TypeScript, TailwindCSS, React Router 6.
  - Centralized API layer in `src/services/api/index.ts` with transparent switching between `mockApi.ts` and `realApi.ts`.
- **API Contract Compatibility**:
  - All 41 REST endpoints audited and documented in [`API_INTEGRATION_CHECKLIST.md`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/API_INTEGRATION_CHECKLIST.md).
  - 100% path and payload parity between `realApi.ts` and FastAPI routes.

---

## 9. Backend Startup & Execution

### Windows Development:
```powershell
# 1. Activate Python Environment & Navigate to Backend
cd c:\Users\Samujwal\OneDrive\Desktop\projects\SIH\backend

# 2. Install Dependencies
python -m pip install -r requirements.txt

# 3. Configure Environment
# Copy .env.example to .env and insert Supabase credentials

# 4. Seed Database (Run once after setting up Supabase schema.sql)
python seed.py

# 5. Run Test Suite
python -m pytest tests/ -v

# 6. Start FastAPI Development Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Development:
```powershell
cd c:\Users\Samujwal\OneDrive\Desktop\projects\SIH
npm install
npm run dev
```

---

## 10. Team Task Allocation & Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SIH TEAM TASK SPLIT                              │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│           PERSON 1           │           PERSON 2           │   PERSON 3    │
│  Backend & Infrastructure    │   OCR & Intelligence Lead    │ Frontend Lead │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ • Supabase Cloud & Tables    │ • OCR Pipeline & Parsing     │ • Live API    │
│ • Database Seeding           │ • Regex Legal Entity Rules   │ • Auth UI Flow│
│ • Auth & Token Verification  │ • Intelligence Engine Tuning │ • Upload Flow │
│ • CORS & FastAPI Server      │ • Alert Generation Logic     │ • E2E Testing │
│ • Cloud Deployment (Render)  │ • Sample PDF / Scan Corpus   │ • Demo Prep   │
└──────────────────────────────┴──────────────────────────────┴───────────────┘
```

---

## 11. Exact File Ownership Matrix

To prevent merge conflicts, each developer has strictly isolated file boundaries:

| Developer | Files to Modify / Own | Files to NOT Touch |
|---|---|---|
| **Person 1** (Backend/Infra) | `backend/schema.sql`<br>`backend/seed.py`<br>`backend/app/core/*`<br>`backend/app/api/routes/auth.py`<br>`backend/app/api/routes/cases.py`<br>`backend/requirements.txt`<br>`backend/.env` | `src/*`<br>`backend/app/services/intelligence/*`<br>`backend/app/services/ocr_service.py` |
| **Person 2** (OCR/Intelligence) | `backend/app/services/intelligence/*`<br>`backend/app/services/ocr_service.py`<br>`backend/app/services/document_service.py`<br>`backend/app/api/routes/documents.py`<br>`backend/app/api/routes/ocr.py`<br>`backend/tests/test_intelligence.py`<br>`backend/tests/test_documents.py` | `src/*`<br>`backend/app/core/security.py`<br>`backend/app/api/routes/auth.py` |
| **Person 3** (Frontend/Integration) | `src/services/api/realApi.ts`<br>`src/services/api/apiClient.ts`<br>`src/context/AuthContext.tsx`<br>`src/pages/*`<br>`src/components/*`<br>`.env` | `backend/app/*`<br>`backend/schema.sql` |

---

## 12. Task Priority Framework (P0 – P3)

- **P0 (Must Work for Hackathon Jury Demo)**:
  1. Live Login with official credentials (`director.operations@goip.gov.in`).
  2. Live Dashboard with real counts calculated from database.
  3. Upload sample Court Order PDF -> Automatic text extraction & pre-fill.
  4. Register file docket into active database.
  5. View File Detail -> Timeline movements + Statutory Deadline Engine + Risk Attribution Panel.
  6. Forward file to another officer/desk -> Audit log & timeline update.
  7. Risk Intelligence page displaying Priority-Ranked Cases.
- **P1 (Important Demonstrable Differentiators)**:
  - Policy Simulation tool showing cycle time reduction.
  - Multi-lingual Hindi/English UI switch (`LanguageContext`).
  - Search endpoint matching file numbers and titles.
- **P2 (Nice to Have / Time Permitting)**:
  - Export audit logs to CSV.
  - Dark mode / contrast toggle.
- **P3 (Cut / Do Not Build for Prototype)**:
  - SMS gateway integration.
  - Re-training custom neural networks.

---

## 13. Practical 7-Day Execution Timeline

```
DAY 1: System Audit & Environment Setup (COMPLETED)
       • Architecture mapped, tests passing (102/102), contracts verified.

DAY 2: Database & Backend Deployment (Person 1 Lead)
       • Person 1: Create Supabase project, execute schema.sql, run seed.py.
       • Person 2: Prepare 5 sample government PDF/image orders.
       • Person 3: Configure frontend .env (VITE_USE_MOCK_API=false).

DAY 3: OCR & Document Ingestion Validation (Person 2 Lead)
       • Person 2: Verify PDF upload and OCR field extraction.
       • Person 1: Verify Supabase Storage bucket permissions.
       • Person 3: Test UploadDocument page end-to-end with live backend.

DAY 4: Intelligence & Risk Verification (Person 2 + Person 1)
       • Person 2: Verify bottleneck detection & risk score calculations.
       • Person 1: Verify /risk/ranked-cases and /dashboard/metrics DB queries.
       • Person 3: Connect FileDetail risk attribution panel to live API.

DAY 5: Frontend ↔ Backend End-to-End Integration (Person 3 Lead)
       • Person 3: Test full user journey (Login -> Upload -> Forward -> Track).
       • Person 1: Fix any CORS or parameter format issues.
       • Person 2: Tune regex parser for any corner-case court formats.

DAY 6: Live Staging Deployment & Edge Testing (All Team)
       • Person 1: Deploy backend to cloud (Render / Railway).
       • Person 3: Deploy frontend to Vercel with cloud backend URL.
       • Person 2: Run automated pytest suite against staging.

DAY 7: Demo Rehearsal & Presentation Polish (All Team)
       • 5-minute timed live demo rehearsal.
       • Backup offline mock mode verified in case of venue internet failure.
```

---

## 14. 5-Minute SIH Winning Demo Script

1. **Minute 0:00 – 1:00 (The Problem & Login)**:
   - Explain the challenge: Government departments miss statutory limitation deadlines in court orders, causing contempt proceedings and loss of state revenue.
   - Log in as Director of Operations (`director.operations@goip.gov.in`).
2. **Minute 1:00 – 2:30 (Live Document Ingestion & OCR)**:
   - Navigate to **Upload Document**. Drop a sample High Court order PDF.
   - Show live OCR extracting Case Number (`WA 200277/2025`), Court (`High Court of Karnataka`), and Limitation Period (`30 days`).
   - Click **Register Docket** -> Immediate database persistence.
3. **Minute 2:30 – 3:45 (Explainable Risk & Deadline Intelligence)**:
   - Open the registered file detail.
   - Showcase the **Statutory Deadline Engine** (T-7, T-15, T-30 countdown).
   - Showcase the **Risk Attribution Panel** explaining *why* the file is high risk (e.g. dwell time + legal opinion delay).
4. **Minute 3:45 – 4:30 (File Movement & Decision Support)**:
   - Forward the file to Legal Review desk. Show immediate immutable update in timeline and audit log.
   - Open **Case Intelligence** page showing priority-ranked executive queue.
5. **Minute 4:30 – 5:00 (Policy Simulation & Conclusion)**:
   - Open **What-If Simulation**, apply "Auto-Escalate Legal Review Beyond 5 Days", and show projected 6.6-day cycle time reduction.

---

## 15. Remaining Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Hackathon venue Wi-Fi failure during jury presentation | High | Frontend has built-in offline mock mode (`VITE_USE_MOCK_API=true`) as a 1-second instant fallback. |
| Scanned PDF has poor image resolution | Medium | Dual engine strategy: PyMuPDF handles digital PDFs instantly; Tesseract handles scanned raster images. Manual override pre-fill is supported in the UI. |
| Cloud deployment rate-limits free tier | Low | Backend runs 100% locally on `localhost:8000` via Uvicorn as a zero-latency demo option. |
