# GOIP Backend — Government File Tracking & Administrative Intelligence System
## Smart India Hackathon 2026 Prototype

---

## Quick Start

### 1. Clone and navigate

```bash
cd backend
```

### 2. Create virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> **Tesseract OCR** must also be installed separately for scanned PDF support:
> - Windows: https://github.com/UB-Mannheim/tesseract/wiki
> - Ubuntu: `sudo apt install tesseract-ocr tesseract-ocr-hin`
> - macOS: `brew install tesseract`

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 5. Configure Supabase

1. Create a project at https://supabase.com
2. Go to **Project → Settings → API** and copy:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Project → Settings → API → JWT Secret** and copy `SUPABASE_JWT_SECRET`
4. Go to **SQL Editor** in Supabase and run the contents of `schema.sql`
5. Go to **Storage** and create a bucket named `gov-documents` (set to **private**)

### 6. Run the database schema

In the Supabase SQL editor, paste and run the full contents of `backend/schema.sql`.

### 7. Seed demo data (optional)

```bash
python seed.py
```

This creates ~40 realistic litigation cases with varied deadlines, statuses, and risk levels.

### 8. Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 9. Start the frontend

In a separate terminal:

```bash
cd ..
# To use real backend, set VITE_USE_MOCK_API=false in .env first
npm run dev
```

### 10. Test the API

Open: http://localhost:8000/docs

---

## Switching Frontend Between Mock and Real Backend

Edit the root `.env` file:

```env
# Mock mode (default — uses synthetic data, no backend needed)
VITE_USE_MOCK_API=true

# Real backend mode
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests cover:
- Deadline calculation logic
- Days-remaining computation
- Risk scoring rules
- OCR field extraction (regex)
- File validation

No live database is required for most tests (pure logic).

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, route registration
│   ├── core/
│   │   ├── config.py            # Pydantic Settings (env vars)
│   │   ├── database.py          # Supabase client singleton
│   │   └── security.py          # JWT verification, auth dependencies
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py          # POST /login, GET /me, POST /logout
│   │       ├── cases.py         # CRUD + forward + flag
│   │       ├── documents.py     # Upload, list, download
│   │       ├── ocr.py           # POST /ocr/process
│   │       ├── dashboard.py     # GET /dashboard/metrics
│   │       ├── alerts.py        # Alerts CRUD
│   │       └── other.py         # Departments, audit, search, risk,
│   │                            #   legal opinions, workflow, simulation
│   ├── schemas/
│   │   └── __init__.py          # All Pydantic request/response models
│   ├── services/
│   │   ├── case_service.py      # Case CRUD business logic
│   │   ├── document_service.py  # Upload + OCR pipeline
│   │   ├── ocr_service.py       # PyMuPDF + Tesseract + field extraction
│   │   ├── deadline_service.py  # All date/deadline calculations
│   │   ├── risk_service.py      # Rule-based risk scoring engine
│   │   └── alert_service.py     # Data-driven alert generation
│   └── core/
├── tests/
│   └── test_core.py             # pytest test suite
├── schema.sql                   # Complete PostgreSQL schema
├── seed.py                      # Demo data generator
├── requirements.txt
├── .env.example
└── README.md
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/v1/auth/login | Authenticate → JWT + user profile |
| POST | /api/v1/auth/logout | Sign out |
| GET | /api/v1/auth/me | Get current user (session restore) |
| GET | /api/v1/dashboard/metrics | Real-time dashboard statistics |
| GET | /api/v1/cases | List cases (with filters) |
| POST | /api/v1/cases | Create new case |
| GET | /api/v1/cases/{id} | Case detail + events + documents |
| PUT | /api/v1/cases/{id} | Update case fields |
| POST | /api/v1/cases/{id}/forward | Forward to officer/stage |
| PATCH | /api/v1/cases/{id}/status | Update case status |
| POST | /api/v1/cases/{id}/flag | Toggle review flag |
| DELETE | /api/v1/cases/{id} | Delete case (admin only) |
| GET | /api/v1/cases/{id}/movements | Case movement history |
| POST | /api/v1/documents/upload | Upload document to Supabase Storage |
| GET | /api/v1/documents | List documents |
| GET | /api/v1/documents/{id} | Document detail |
| GET | /api/v1/documents/{id}/download | Download file |
| POST | /api/v1/documents/{id}/ocr | Run OCR on stored document |
| POST | /api/v1/ocr/process | OCR a file (preview, not stored) |
| GET | /api/v1/alerts | List alerts |
| PUT | /api/v1/alerts/{id}/read | Mark alert as read |
| POST | /api/v1/alerts/refresh | Regenerate alerts from database |
| GET | /api/v1/departments | Department list |
| GET | /api/v1/users | Officer/user list |
| GET | /api/v1/audit-logs | Audit log register |
| GET | /api/v1/search | Cross-entity full-text search |
| GET | /api/v1/risk/cases | High-risk cases |
| GET | /api/v1/risk/predictions/{id} | Risk prediction with attribution |
| POST | /api/v1/{case_id}/legal-opinion | Request legal opinion |
| GET | /api/v1/{case_id}/legal-opinion | Get legal opinion |
| PUT | /api/v1/legal-opinions/{id} | Update legal opinion |
| GET | /api/v1/workflow/process-map | Workflow process map |
| GET | /api/v1/simulation/scenarios | Simulation scenario options |
| POST | /api/v1/simulation/run | Run policy simulation |
| GET | /api/v1/analytics/performance | Performance metrics |

---

## Security Checklist

- [x] No secrets hardcoded — all from environment variables
- [x] `SUPABASE_SERVICE_ROLE_KEY` is backend-only, never sent to frontend
- [x] JWT verified using Supabase JWT secret on every protected endpoint
- [x] File type and size validated before upload
- [x] Input validated via Pydantic schemas
- [x] CORS configured to allow only known origins
- [x] No passwords logged
- [x] Role checks implemented via `require_role()` dependency

---

## What Is Real vs Demo

| Feature | Status |
|---------|--------|
| Authentication | Real — Supabase Auth |
| Database | Real — Supabase PostgreSQL |
| Document storage | Real — Supabase Storage |
| OCR (digital PDF) | Real — PyMuPDF |
| OCR (scanned) | Real — Tesseract (must install) |
| Field extraction | Real — regex-based, not ML |
| Risk scoring | Real — deterministic rule-based engine |
| Deadline engine | Real — calculated from DB fields |
| Alert generation | Real — generated from live DB state |
| Simulation | Rule-based projection, NOT ML/AI |
| Seed data | Demo only — labelled [DEMO] |

---

## What Can Be Replaced by ML/LLM Later

| Current | Future Replacement |
|---------|-------------------|
| Regex field extraction | Google Document AI / Azure Form Recognizer |
| Rule-based risk scoring | Trained classification model |
| Deterministic simulation | Monte Carlo / Agent-based simulation |
| Tesseract OCR | Google Vision API / AWS Textract |

---

## Deployment (Render / Railway / Fly.io)

1. Push `backend/` to a Git repository
2. Create a new Web Service on Render
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env.example`
6. Update `CORS_ORIGINS` to include your Netlify frontend URL

---

## Known Limitations (SIH Prototype)

1. Tesseract requires a separate system installation (not auto-installed by pip)
2. OCR field extraction is regex-based — accuracy depends on document formatting
3. Simulation projections are rule-based estimates, not trained predictions
4. No email/SMS notification system (alerts are in-app only)
5. File movement history does not auto-calculate durationDays between stages
6. No background task scheduler (alert refresh must be triggered manually or via cron)
