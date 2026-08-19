# GOIP — Environment Variables & Configuration Guide

This document outlines all environment variables required across the frontend and backend.
**NEVER commit actual `.env` files or API secrets to version control.**

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable Name | Purpose | Where Used | Required for SIH Demo? | Free / Local Alternative |
|---|---|---|---|---|
| `SUPABASE_URL` | Supabase Project REST API URL | `backend/app/core/database.py`, `backend/app/core/config.py` | **Yes (for live DB demo)** | Local PostgreSQL + Supabase CLI or Mock Mode |
| `SUPABASE_ANON_KEY` | Public client key for Supabase Auth | `backend/app/core/config.py` | **Yes (for live DB demo)** | N/A (Included with free Supabase tier) |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged admin key for backend DB operations & bypassing RLS | `backend/app/core/database.py`, `backend/app/core/config.py` | **Yes (for live DB demo)** | N/A (Included with free Supabase tier) |
| `SUPABASE_JWT_SECRET` | Secret key used to verify Supabase Auth bearer tokens | `backend/app/core/security.py`, `backend/app/core/config.py` | **Yes (for live auth demo)** | Any 32+ character string in local/offline JWT setup |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name for uploaded documents (default: `gov-documents`) | `backend/app/services/document_service.py`, `backend/app/core/config.py` | **Yes (for upload/OCR demo)** | Local file system fallback or Supabase free storage (1GB free) |
| `MAX_UPLOAD_SIZE_MB` | Maximum allowed file upload size in MB (default: `20`) | `backend/app/services/document_service.py`, `backend/app/core/config.py` | Optional (defaults to `20`) | Default fallback built-in |
| `TESSERACT_CMD` | Explicit path to `tesseract.exe` (Windows) or `tesseract` (Linux) | `backend/app/services/ocr_service.py`, `backend/app/core/config.py` | Optional | If in system PATH, leave empty. PyMuPDF handles digital PDFs without Tesseract |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `backend/app/main.py`, `backend/app/core/config.py` | **Yes** | Defaults to `http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173` |
| `APP_NAME` | Display name of FastAPI backend | `backend/app/main.py`, `backend/app/core/config.py` | Optional | Defaults to `GOIP Government File Tracking System` |
| `APP_VERSION` | Application semver string | `backend/app/main.py`, `backend/app/core/config.py` | Optional | Defaults to `1.0.0` |
| `DEBUG` | FastAPI debug mode flag (`true`/`false`) | `backend/app/main.py`, `backend/app/core/config.py` | Optional | Defaults to `true` |
| `LOG_LEVEL` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `backend/app/main.py`, `backend/app/core/config.py` | Optional | Defaults to `INFO` |

### Backend `.env` Template
Save this as `backend/.env`:
```env
# Supabase Project API Credentials
# Get from: https://supabase.com/dashboard -> Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Token Verification Secret
# Get from: Supabase -> Project Settings -> API -> JWT Settings -> JWT Secret
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here

# Application Configuration
APP_NAME=GOIP Government File Tracking System
APP_VERSION=1.0.0
DEBUG=true
LOG_LEVEL=INFO

# Cross-Origin Resource Sharing (Frontend addresses)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173

# Storage Bucket
SUPABASE_STORAGE_BUCKET=gov-documents
MAX_UPLOAD_SIZE_MB=20

# OCR Engine Path (Leave empty if tesseract is in PATH)
# Windows example: TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_CMD=
```

---

## 2. Frontend Environment Variables (`.env`)

| Variable Name | Purpose | Where Used | Required for SIH Demo? | Options / Default |
|---|---|---|---|---|
| `VITE_USE_MOCK_API` | Toggles between offline synthetic mock dataset and real FastAPI backend | `src/services/api/apiClient.ts` | **Yes** | `true` (Mock mode) / `false` (Real FastAPI backend) |
| `VITE_API_BASE_URL` | Base URL of the FastAPI REST backend | `src/services/api/realApi.ts` | **Yes (when `VITE_USE_MOCK_API=false`)** | Default: `http://localhost:8000` |
| `VITE_SUPABASE_URL` | Public Supabase project URL (optional client SDK direct usage) | `src/services/api/realApi.ts` | Optional | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anonymous client key | `src/services/api/realApi.ts` | Optional | `eyJhbGciOiJIUzI1Ni...` |

### Frontend `.env` Template
Save this as `.env` in the root workspace directory:
```env
# Switch between Mock Mode (true) and Real FastAPI Backend (false)
VITE_USE_MOCK_API=false

# Live FastAPI backend URL
VITE_API_BASE_URL=http://localhost:8000

# Optional Direct Client Supabase config
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
