# GOIP — Government Operations Intelligence Platform

> **Phase 1 — Production-quality frontend prototype**

GOIP is a government workflow intelligence platform designed to help administrative and operational teams understand **where government workflows are getting delayed, why delays occur, which cases are at risk of missing statutory timelines, and which interventions may improve outcomes**.

Rather than functioning as a simple file-tracking system, GOIP combines process analysis, deadline monitoring, risk scoring, document intelligence, OCR, and what-if simulation into a single operational workspace.

---

## 1. What GOIP Does

GOIP is built around a simple operational question:

> **What is slowing a government workflow down, and what can be done about it?**

The platform brings together:

- **Process discovery** — identifies how cases actually move through workflow stages.
- **Bottleneck detection** — highlights stages where cases spend substantially more time than expected.
- **Rework detection** — identifies repeated movement between stages and review loops.
- **Delay-risk prediction** — estimates which cases are likely to breach their applicable SLA.
- **Explainable risk attribution** — shows the factors contributing to a case's risk.
- **Statutory deadline monitoring** — keeps deterministic statutory/SLA calculations separate from probabilistic prediction.
- **What-if simulation** — evaluates proposed workflow interventions against historical execution patterns.
- **Document intelligence** — accepts PDF and scanned records, extracts text, and identifies structured entities.
- **Operational dashboards** — presents workflow health, risk, delays, and supporting evidence in one place.

---

## 2. Core Concept

The platform follows this operating model:

```text
Government Records / Case Data
            │
            ▼
     Document & Data Intake
            │
            ├───────────────┐
            ▼               ▼
       OCR / Parsing    Case History
            │               │
            └───────┬───────┘
                    ▼
             Process Analysis
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      Bottlenecks  Rework   SLA Status
          │         │         │
          └─────────┼─────────┘
                    ▼
              Risk Analysis
                    │
                    ▼
            Explainable Causes
                    │
                    ▼
             What-If Simulation
                    │
                    ▼
          Administrative Insight
```

The important distinction is that GOIP does not treat every risk calculation as an opaque AI prediction. **Deterministic statutory rules, process measurements, and probabilistic risk estimates are kept as separate concepts.**

---

## 3. Key Capabilities

### 3.1 Process Discovery

GOIP models government workflows as process graphs and Petri-net-compatible structures.

The process workspace can represent:

- workflow stages
- stage transitions
- average processing/waiting time
- high-volume paths
- rework loops
- stage-level deviations
- process variants

The frontend uses `@xyflow/react` for interactive workflow visualization.

### 3.2 Bottleneck & Rework Detection

GOIP compares observed workflow performance against configured baselines.

Example:

```text
Legal Review
Expected duration: 5 days
Observed duration: 13.5 days

Deviation: +170.9%
```

It can also identify repeated transitions:

```text
Legal Review
      ↓
Officer Review
      ↓
Legal Review
```

This helps distinguish a simple long-running case from a workflow that is repeatedly cycling through review.

### 3.3 Delay-Risk Prediction

The risk layer estimates whether a case is likely to breach its applicable SLA.

Example:

```text
SLA Breach Risk
HIGH

Predicted breach probability
82%

Primary contributing factors
• Legal review wait
• Rework cycles
• Pending officer action
```

The result is intended to be accompanied by contributing factors rather than presented as an unexplained score.

### 3.4 Deterministic Statutory Deadline Engine

Statutory/SLA calculations are handled separately from machine-learning risk predictions.

Configured thresholds may include:

```text
7 days
15 days
30 days
```

The distinction is:

```text
Statutory rule
    ≠
ML prediction
```

The statutory engine answers:

> **What deadline applies?**

The risk engine answers:

> **How likely is this case to breach it?**

### 3.5 What-If Simulation

The Simulation Lab evaluates proposed interventions against historical workflow execution.

Example:

```text
Intervention:
Auto-escalate Legal Review after 5 days

Historical replay
        ↓
Compare baseline vs intervention
        ↓
Estimate:
• cycle-time change
• SLA recovery
• cases potentially saved
```

The simulation is an analytical aid; it does not automatically change government policy.

### 3.6 Document Intake & OCR

The document pipeline is:

```text
PDF / Image
    ↓
PyMuPDF direct text extraction
    ↓
If usable text is unavailable
    ↓
Tesseract OCR
    ↓
Extracted text
    ↓
Entity / field extraction
    ↓
Case-linked document evidence
```

OCR converts document images into machine-readable text. The extraction layer then identifies useful structured fields.

---

## 4. Technical Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│ React 18 + TypeScript + Vite                                 │
│ Pages • Layout • Components • Context • Process Graphs       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      API SERVICE LAYER                        │
│                                                              │
│ authService • casesService • workflowService                 │
│ riskService • documentsService • simulationService            │
│                                                              │
│ apiClient                                                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
        ┌─────────────────────┐  ┌────────────────────────┐
        │     MOCK ADAPTER    │  │   REAL BACKEND CLIENT  │
        │                     │  │                        │
        │ Development/demo   │  │ FastAPI                 │
        │ fixtures            │  │ Persistent data layer  │
        └─────────────────────┘  └────────────┬───────────┘
                                              │
                                              ▼
                               ┌──────────────────────────┐
                               │ Processing / Intelligence │
                               │                          │
                               │ OCR • Extraction         │
                               │ Deadline Engine          │
                               │ Risk Engine              │
                               │ Process Analysis         │
                               │ Simulation               │
                               └──────────────────────────┘
```

---

## 5. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type-safe application development |
| Vite | Development server and production build |
| React Router v6 | Application routing and protected routes |
| Tailwind CSS | UI styling and design tokens |
| `@xyflow/react` | Interactive workflow/process graphs |
| Lucide React | Interface icons |
| React Context | Domain/application state |

### Backend / Intelligence

| Technology | Purpose |
|---|---|
| FastAPI | REST API backend |
| Python | Backend and intelligence services |
| PM4Py-compatible models | Process mining / process analysis |
| XGBoost | Delay-risk modelling |
| SHAP-style attribution | Explainability |
| PyMuPDF | Digital PDF text extraction |
| Tesseract OCR | Scanned-document OCR |
| PostgreSQL / Supabase | Persistent application data |

> The repository should be treated as the source of truth for the currently enabled backend modules.

---

## 6. Application Structure

```text
GOIP/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   │   └── api/
│   ├── App.tsx
│   └── main.tsx
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── services/
│   │   │   └── intelligence/
│   │   └── main.py
│   ├── schema.sql
│   └── seed.py
│
├── public/
├── docs/
├── .env.example
├── package.json
└── README.md
```

The exact tree may differ as implementation evolves.

---

## 7. Main Application Routes

| Route | Workspace | Purpose |
|---|---|---|
| `/login` | Secure System Access | Authentication and system entry |
| `/dashboard` | Operations Overview | Operational KPIs, bottlenecks, risk overview |
| `/cases` | Case Registry | Search, filter, and review active cases |
| `/cases/:caseId` | Case Intelligence | Detailed case timeline, risk, deadlines, and documents |
| `/workflow` | Process Mining | Workflow graph, stages, transitions, and rework |
| `/risk` | Priority Risk Queue | Ranked cases with elevated delay/SLA risk |
| `/simulation` | What-If Simulation Lab | Test proposed workflow interventions |
| `/documents` | Document & OCR | Upload, process, and inspect government documents |
| `/analytics` | Process Performance | Workflow performance and process variants |
| `/settings` | System Settings | Application/system configuration and status |

---

## 8. Typical Data Flow

### Case Intelligence

```text
Case Record
    ↓
Case History
    ↓
Stage / Transition Analysis
    ↓
Waiting + Active Time Calculation
    ↓
SLA Evaluation
    ↓
Risk Assessment
    ↓
Contributing Factors
    ↓
Officer-facing Case View
```

### Document Intelligence

```text
Document Upload
    ↓
File Validation
    ↓
Text Extraction
    ↓
OCR Fallback
    ↓
Structured Entity Extraction
    ↓
Document Evidence
    ↓
Case Association
    ↓
Case Intelligence
```

### Simulation

```text
Historical Execution Logs
            ↓
     Baseline Process
            ↓
    Select Intervention
            ↓
     Replay / Simulation
            ↓
   Compare Outcomes
            ↓
Cycle Time • SLA Recovery • Cases Affected
```

---

## 9. Getting Started

### Prerequisites

Recommended:

- Node.js 18+
- npm 9+
- Python 3.10+
- Git

For OCR functionality:

- Tesseract OCR must be installed and accessible to the backend.
- PyMuPDF must be installed in the Python environment.

For live persistence:

- PostgreSQL/Supabase configuration is required.

### Frontend Installation

```bash
git clone <repository-url>
cd GOIP
npm install
npm run dev
```

The Vite development server will normally be available at:

```text
http://localhost:5173
```

---

## 10. Environment Configuration

Create a local `.env` file based on `.env.example`.

Example:

```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:8000

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development / Mock Mode

```env
VITE_USE_MOCK_API=true
```

Useful for frontend development and demonstrations without a live backend.

### Live Backend Mode

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000
```

In live mode, the frontend should communicate with the configured FastAPI backend rather than treating frontend fixtures as authoritative data.

**Never commit real credentials to Git.**

---

## 11. Running the Backend

From the backend environment:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API should then be available at:

```text
http://localhost:8000
```

FastAPI commonly exposes interactive API documentation at:

```text
http://localhost:8000/docs
```

---

## 12. Database

GOIP's persistent deployment uses PostgreSQL/Supabase.

A typical setup is:

```text
Supabase Project
       ↓
Database Schema
       ↓
Seed / Initial Data
       ↓
FastAPI
       ↓
Frontend
```

Before enabling live mode:

1. Create/configure the database.
2. Apply the required schema/migrations.
3. Configure backend environment variables.
4. Seed only intended development/demo data.
5. Start FastAPI.
6. Set `VITE_USE_MOCK_API=false`.
7. Verify API reads and writes using the live database.

Do not delete unrelated legacy tables simply because they belong to an earlier prototype. Confirm dependencies before making schema changes.

---

## 13. Live Data vs Mock Data

```text
                    API Client
                       │
             ┌─────────┴─────────┐
             │                   │
        MOCK MODE             LIVE MODE
             │                   │
        Mock Adapter         FastAPI
             │                   │
      Synthetic Fixtures     Database
```

The intended live architecture is:

```text
Database
   ↓
FastAPI
   ↓
realApi
   ↓
React Context / State
   ↓
Pages
```

Frontend state should not be treated as permanent storage.

After mutations such as:

- uploading a document
- creating a case
- updating a workflow state
- creating an assessment
- recording an officer action

the application should retrieve the authoritative result from the backend.

---

## 14. Security & Data Handling

GOIP is a government-workflow prototype and should be deployed with appropriate security controls before handling real government information.

Important practices:

- Never commit passwords or API keys.
- Keep secrets in environment variables or a secrets manager.
- Use authenticated API access.
- Apply database row-level security where appropriate.
- Validate uploaded files.
- Restrict accepted file types and sizes.
- Avoid logging sensitive document contents.
- Keep an auditable record of administrative actions.
- Separate development/demo data from production data.

The prototype should not be interpreted as authorization to process live government records without the required security, privacy, hosting, and operational approvals.

---

## 15. Explainability Model

GOIP is designed around decision support rather than unexplained automation.

A risk result should be understandable in terms of measurable contributing factors.

Example:

```text
Case: KA-10482

Risk: HIGH
Predicted SLA breach: 82%

Contributing factors:
    Legal review wait       +42%
    Rework cycles           +21%
    Pending officer action  +14%
    Other factors           +5%
```

The precise numbers shown in a demonstration depend on the configured dataset/model.

The objective is that an officer can move from:

```text
HIGH RISK
```

to:

```text
WHY?
```

and then to:

```text
WHAT CAN BE CHANGED?
```

---

## 16. Officer Decision Boundary

GOIP is a decision-support system.

The system can:

- identify patterns
- calculate deadlines
- estimate risk
- surface bottlenecks
- highlight supporting evidence
- simulate interventions

The final administrative decision remains with the authorized officer.

```text
GOIP
  │
  ├── Analysis
  ├── Evidence
  ├── Risk
  ├── Recommendations
  └── Simulation
          │
          ▼
   Human Officer Review
          │
          ▼
   Administrative Decision
```

---

## 17. Demonstration Flow

A concise demonstration can follow this sequence:

### 1. Sign In

Enter the authenticated application.

### 2. Dashboard

Show:

- overall operational state
- high-risk cases
- active bottleneck
- workflow indicators

### 3. Workflow

Open the process graph and show:

- major workflow stages
- transition paths
- slow stages
- rework loops

### 4. Case Intelligence

Open a high-risk case and show:

- timeline
- waiting time
- statutory deadline
- risk
- contributing factors
- associated documents

### 5. Document Intelligence

Open a case document and show:

```text
Document
   ↓
Text Extraction
   ↓
OCR if required
   ↓
Structured Fields
   ↓
Case Evidence
```

### 6. Simulation

Open the What-If Simulation Lab, select an intervention, and compare baseline and simulated outcomes.

### 7. Decision Support

Finish by showing:

```text
Observation
    ↓
Cause
    ↓
Prediction
    ↓
Intervention
    ↓
Expected Outcome
```

---

## 18. Example Operational Scenario

Consider a case that moves through:

```text
Registration
      ↓
Document Verification
      ↓
Legal Review
      ↓
Officer Review
      ↓
Approval
```

Suppose the observed history shows:

```text
Legal Review
    expected: 5 days
    observed: 13.5 days

Officer Review
    expected: 3 days
    observed: 4 days

Rework:
Legal Review → Officer Review → Legal Review
```

GOIP can surface:

```text
Primary Bottleneck:
Legal Review

Rework:
Detected

SLA Risk:
High

Potential cause:
Extended legal-review waiting time

Possible intervention:
Escalate cases exceeding configured legal-review threshold
```

The simulation layer can then estimate how the proposed intervention might affect historical outcomes.

---

## 19. Why GOIP Is Different

Traditional workflow systems generally focus on:

```text
Where is the file?
What is its current status?
Who has it?
```

GOIP adds an intelligence layer:

```text
Where is the workflow slowing down?
Why is it slowing down?
Which cases are likely to breach SLA?
Which process stage contributes most to the delay?
Is the same work being repeated?
What could happen if the process were changed?
```

The core differentiator is the combination of:

> **Process Mining + Bottleneck Attribution + SLA Intelligence + Explainable Risk + Document Intelligence + What-If Simulation**

within one operational workflow.

---

## 20. Project Status

GOIP is being developed as a **Smart India Hackathon prototype**.

The project is evolving from an initial government-operations workflow intelligence concept toward a complete backend-connected system.

Current development areas include:

- frontend application
- FastAPI backend
- persistent database integration
- document/OCR processing
- structured extraction
- process intelligence
- risk analysis
- workflow visualization
- auditability
- live frontend/backend integration

Some capabilities may currently operate in prototype/mock mode depending on the active branch and environment configuration.

The repository and running implementation are the authoritative sources for current feature status.

---

## 21. Development Principles

### Evidence over assumptions

Risk and workflow findings should be traceable to case/process data wherever possible.

### Deterministic rules remain deterministic

Statutory deadlines should not be replaced by a machine-learning guess.

### Explainability matters

A useful risk score should provide a reason.

### Human decisions remain human

The platform supports officers rather than silently making administrative decisions.

### Mock mode is not production data

Synthetic fixtures are useful for development and demonstration, but live mode should use the configured backend/database.

### Small, composable intelligence services

OCR, extraction, deadline calculation, risk scoring, process analysis, and simulation should remain modular so each subsystem can be tested independently.

---

## 22. Testing

Frontend build:

```bash
npm run build
```

Backend tests:

```bash
pytest
```

A meaningful end-to-end test should verify:

```text
Upload document
      ↓
Backend receives file
      ↓
OCR / extraction completes
      ↓
Structured fields generated
      ↓
Data persisted
      ↓
Risk / deadline analysis runs
      ↓
Dashboard reflects result
      ↓
Audit event recorded
      ↓
Browser refresh
      ↓
Data still available
```

A successful frontend build alone does not establish that the live data path is working.

---

## 23. Roadmap

Potential next stages include:

- stronger process-mining pipelines using real event logs
- calibrated delay prediction models
- richer model explainability
- configurable departmental SLA rules
- role-based access control
- improved document classification
- multilingual OCR/document processing
- stronger evidence provenance
- production-grade observability
- secure government-system integrations
- policy simulation using larger historical datasets

---

## 24. Project Identity

**Project:** GOIP — Government Operations Intelligence Platform  
**Purpose:** Government workflow intelligence, process analysis, and delay-risk decision support  
**Development context:** Smart India Hackathon prototype  
**Primary technologies:** React, TypeScript, FastAPI, Python, PostgreSQL/Supabase, PyMuPDF, Tesseract, process-analysis tooling, XGBoost  
**Application type:** Government operations / administrative decision-support platform

---

## 25. License & Attribution

Developed as a prototype for **Smart India Hackathon (SIH)**.

Unless a separate license file states otherwise, the repository should be treated as **Confidential / Proprietary prototype software**.

Third-party libraries and technologies remain subject to their respective licenses.

---

## 26. One-Line Description

> **GOIP turns government workflow data into operational intelligence by identifying bottlenecks, forecasting delay risk, explaining the causes, and evaluating possible interventions.**
