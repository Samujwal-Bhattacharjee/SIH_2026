# GOIP — Government Operations Intelligence Platform
**Phase 1 Production-Quality Frontend Prototype**

> *"GOIP does not just tell government officials which files are pending. It shows where the workflow is getting stuck, why it is happening, which cases are likely to be delayed, and what may happen if the workflow is changed."*

---

## 1. System Philosophy & Purpose

GOIP is a **Government Workflow Intelligence Platform** designed for state administrators, department secretaries, and operational officers. It moves government operations from reactive file-tracking to proactive process mining, bottleneck attribution, SLA risk forecasting, and policy intervention simulation.

### Key Capabilities:
1. **Automated Process Discovery**: Dynamic Petri-net and process graph discovery using PM4Py-compatible topology models.
2. **Bottleneck & Rework Detection**: Identifies stages deviating from statutory baselines (e.g. Legal Review running +170% above baseline) and repeated cycles (Legal Review ↔ Officer Review loop occurring in 21.4% of files).
3. **ML Delay Prediction & Explainability**: Predicts SLA breaches with XGBoost models and provides SHAP-style attribution breakdowns for root causes.
4. **Deterministic Statutory Deadline Engine**: Computes citizen charter guarantee thresholds (7d, 15d, 30d max) distinct from probabilistic machine learning.
5. **What-If Simulation Lab**: Replays historical execution logs against proposed administrative interventions (e.g., auto-escalating legal review after 5 days) to forecast cycle time reduction and SLA recovery.
6. **Supporting Document Intake & OCR**: Ingests official records (PDF, scans), extracts text via Tesseract OCR, parses revenue entities, and binds them to case files.

---

## 2. Technical Stack & Architecture

```
┌────────────────────────────────────────────────────────┐
│                   UI Layer (React 18+)                 │
│  Pages, Layout Shell, Components, Modals, Flow Graphs  │
└───────────────────────────┬────────────────────────────┘
                            │ Hooks & State
┌───────────────────────────▼────────────────────────────┐
│                    API Service Layer                   │
│   authService, casesService, workflowService,          │
│   riskService, documentsService, simulationService     │
└───────────────────────────┬────────────────────────────┘
                            │ apiClient (Router)
             ┌──────────────┴──────────────┐
             ▼                             ▼
 ┌───────────────────────┐     ┌───────────────────────┐
 │   Mock API Adapter    │     │   Real Backend Client │
 │   (In-Memory State)   │     │   (FastAPI / PM4Py)   │
 └───────────────────────┘     └───────────────────────┘
```

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom Swiss/Technical editorial tokens, hairline borders, and monospaced typography.
- **Process Mining Graph**: `@xyflow/react` (React Flow) with custom technical nodes and animated rework edges.
- **Routing**: React Router v6 with authentication route guards.
- **Icons**: Lucide React (used strictly with restraint and technical sizing).
- **State Management**: Centralized domain services with React Context.

---

## 3. Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- npm `v9+` or `v11+`

### Installation & Local Run
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Open browser at:
# http://localhost:5173
```

---

## 4. Switching from Mock Mode to FastAPI Backend

The application is built with a zero-rewrite architecture. To switch from the synthetic dataset to your live FastAPI backend:

1. Create a `.env` file in the project root (copy from `.env.example`):
```bash
# .env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. Start your FastAPI server (implementing the contracts in [`/docs/API_CONTRACT.md`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/docs/API_CONTRACT.md)).
3. The frontend `apiClient` will automatically route all requests to `http://localhost:8000/api/v1/...` without changing a single UI component.

---

## 5. Primary Application Routes

| Route | Name | Purpose |
|---|---|---|
| `/login` | Secure System Access | Editorial gateway with mock Supabase authentication |
| `/dashboard` | Operations Overview | Top KPIs, active bottleneck alert, discovered workflow preview |
| `/cases` | Case Registry | Multi-filter table, stage filtering, statutory countdowns, review flags |
| `/cases/:caseId` | Case Intelligence | Sequential history, SHAP attribution bars, statutory engine, OCR docs |
| `/workflow` | Process Mining Workspace | Interactive React Flow canvas, rework loops, stage inspector drawer |
| `/risk` | Priority Risk Queue | Ranked SLA breach delay queue with root causes |
| `/simulation` | What-If Simulation Lab | Policy intervention selector, multi-step animated replay, impact matrix |
| `/documents` | Document & OCR Ingestion | Drag-and-drop intake, multi-stage OCR pipeline, structured viewer |
| `/analytics` | Process Performance | Active scrutiny vs wait time breakdown, 4 discovered variant paths |
| `/settings` | Architectural Settings | Subsystem health, operator session, backend mode status |

---

## 6. SIH Demonstration Journey (30-Second Walkthrough)

1. **Sign In**: Open `/login` and click `QUICK DEMO LOGIN` to authenticate as *Rajeshwar V. Verma, IAS*.
2. **Review Dashboard**: Notice the **Legal Review Primary Bottleneck Banner** (+170.9% wait time across 1,240 cases) and the 173 high-risk cases.
3. **Inspect Process Graph**: Click `INSPECT PROCESS GRAPH` to navigate to `/workflow`. Observe the discovered stages and the animated **Rework Loop** (`Legal Review ➔ Officer Review` in 21.4% of cases).
4. **Inspect Node**: Click on the **Legal Review** node to open the inspection drawer showing time decomposition (8.4d wait vs 6.8d active).
5. **Investigate Critical Case**: Navigate to `/cases` and open `KA-10482` (Land Dispute).
6. **Analyze Root Causes**: View the **Case Timeline** (showing 5.8d delay and 2 review loops), inspect the **SHAP attribution bars** (Legal wait: +42%), and compare the statutory 30-day deadline against the ML predicted breach.
7. **Document OCR**: Click on `KA_10482_TitleDeed_Mutation_1998.pdf` under Associated Documents to inspect the OCR text and extracted revenue survey fields.
8. **Simulate Mitigation**: Navigate to `/simulation`, select *"Auto-Escalate Legal Review Beyond Threshold"*, set slider to `5 Days`, and click **RUN WHAT-IF SIMULATION**.
9. **Compare Impact**: Watch the animated simulation replay (10,482 runs replayed) and view the side-by-side matrix showing a **-6.6 day cycle time reduction** and **+13.6% SLA recovery** (102 cases saved).

---

## 7. License & Attribution
Developed for Smart India Hackathon (SIH) — State Government Operations Intelligence Track.  
Confidential & Proprietary • Department of Administrative Reforms & Public Grievances.
