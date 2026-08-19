# GOIP — API Integration Checklist & Contract Verification

This document audits and maps every frontend API invocation (`src/services/api/realApi.ts`) to its corresponding FastAPI backend route (`backend/app/api/routes/*.py`) and underlying PostgreSQL table.

---

## 1. Complete API Contract Matrix

| # | HTTP Method | Endpoint Path | Frontend Service Function | Backend Route Handler | DB Table / Storage | Auth Header | Status |
|---|---|---|---|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/login` | `authService.signIn()` | `app.api.routes.auth.login` | `auth.users`, `users` | No | **READY** |
| 2 | `POST` | `/api/v1/auth/logout` | `authService.signOut()` | `app.api.routes.auth.logout` | `auth.users` | Bearer Token | **READY** |
| 3 | `GET` | `/api/v1/auth/me` | `authService.getCurrentUser()` | `app.api.routes.auth.get_me` | `users` | Bearer Token | **READY** |
| 4 | `GET` | `/api/v1/dashboard/metrics` | `dashboardService.getMetrics()` | `app.api.routes.dashboard.get_dashboard_metrics` | `cases`, `departments` | Bearer Token | **READY** |
| 5 | `GET` | `/api/v1/cases` | `casesService.getCases()` | `app.api.routes.cases.list_cases` | `cases` | Bearer Token | **READY** |
| 6 | `POST` | `/api/v1/cases` | `casesService.createCase()` | `app.api.routes.cases.create_case` | `cases`, `audit_logs`, `alerts` | Bearer Token | **READY** |
| 7 | `GET` | `/api/v1/cases/{case_id}` | `casesService.getCaseById()` | `app.api.routes.cases.get_case` | `cases`, `case_movements`, `documents`, `legal_opinions` | Bearer Token | **READY** |
| 8 | `PUT` | `/api/v1/cases/{case_id}` | `casesService.updateCase()` | `app.api.routes.cases.update_case` | `cases` | Bearer Token | **READY** |
| 9 | `POST` | `/api/v1/cases/{case_id}/forward` | `casesService.forwardCase()` | `app.api.routes.cases.forward_case` | `cases`, `case_movements`, `audit_logs` | Bearer Token | **READY** |
| 10 | `PATCH` | `/api/v1/cases/{case_id}/status` | `casesService.updateStatus()` | `app.api.routes.cases.update_status` | `cases`, `audit_logs` | Bearer Token | **READY** |
| 11 | `POST` | `/api/v1/cases/{case_id}/flag` | `casesService.toggleFlagForReview()` | `app.api.routes.cases.toggle_flag` | `cases` | Bearer Token | **READY** |
| 12 | `DELETE` | `/api/v1/cases/{case_id}` | `(Admin management)` | `app.api.routes.cases.delete_case` | `cases` | Bearer (Admin) | **READY** |
| 13 | `GET` | `/api/v1/cases/{case_id}/movements` | `(Timeline view)` | `app.api.routes.other.get_movements` | `case_movements` | Bearer Token | **READY** |
| 14 | `POST` | `/api/v1/ocr/process` | `ocrService.processDocument()` | `app.api.routes.ocr.process_ocr` | Memory / OCR Engine | Bearer Token | **READY** |
| 15 | `POST` | `/api/v1/documents/upload` | `documentsService.uploadDocument()` | `app.api.routes.documents.upload_document` | `gov-documents` bucket, `documents` table | Bearer Token | **READY** |
| 16 | `GET` | `/api/v1/documents` | `documentsService.getDocuments()` | `app.api.routes.documents.list_documents` | `documents` | Bearer Token | **READY** |
| 17 | `GET` | `/api/v1/documents/{document_id}` | `documentsService.getDocumentById()` | `app.api.routes.documents.get_document` | `documents` | Bearer Token | **READY** |
| 18 | `GET` | `/api/v1/documents/{document_id}/download` | `documentsService.downloadDocument()` | `app.api.routes.documents.download_document` | `gov-documents` bucket | Bearer Token | **READY** |
| 19 | `GET` | `/api/v1/documents/{document_id}/status` | `(Polling hook)` | `app.api.routes.documents.get_document_status` | `documents` | Bearer Token | **READY** |
| 20 | `POST` | `/api/v1/documents/{document_id}/ocr` | `(Trigger stored OCR)` | `app.api.routes.documents.run_ocr_on_document` | `documents`, `gov-documents` | Bearer Token | **READY** |
| 21 | `GET` | `/api/v1/risk/cases` | `riskService.getRiskCases()` | `app.api.routes.other.get_risk_cases` | `cases` (Risk Level = HIGH) | Bearer Token | **READY** |
| 22 | `GET` | `/api/v1/risk/ranked-cases` | `(Priority Case Queue)` | `app.api.routes.other.get_ranked_cases` | `cases`, `legal_opinions` | Bearer Token | **READY** |
| 23 | `GET` | `/api/v1/risk/predictions/{case_id}` | `riskService.getRiskPrediction()` | `app.api.routes.other.get_risk_prediction` | `cases`, `legal_opinions` | Bearer Token | **READY** |
| 24 | `GET` | `/api/v1/risk/intelligence/{case_id}` | `(Intelligence Report)` | `app.api.routes.other.get_case_intelligence_detail` | `cases`, `legal_opinions`, `case_movements` | Bearer Token | **READY** |
| 25 | `GET` | `/api/v1/departments` | `departmentService.getDepartments()` | `app.api.routes.other.list_departments` | `departments`, `cases` | Bearer Token | **READY** |
| 26 | `GET` | `/api/v1/departments/officers` | `departmentService.getOfficers()` | `app.api.routes.other.list_officers` | `users` | Bearer Token | **READY** |
| 27 | `GET` | `/api/v1/users` | `(Officer Selector)` | `app.api.routes.other.list_users` | `users` | Bearer Token | **READY** |
| 28 | `GET` | `/api/v1/audit-logs` | `auditService.getAuditLogs()` | `app.api.routes.other.list_audit_logs` | `audit_logs` | Bearer Token | **READY** |
| 29 | `GET` | `/api/v1/search` | `casesService.search()` | `app.api.routes.other.search` | `cases`, `documents` | Bearer Token | **READY** |
| 30 | `GET` | `/api/v1/workflow/process-map` | `workflowService.getProcessMap()` | `app.api.routes.other.get_process_map` | `cases` | Bearer Token | **READY** |
| 31 | `GET` | `/api/v1/workflow/stages/{stage_id}` | `workflowService.getNodeDetail()` | `app.api.routes.other.get_stage_detail` | `cases` | Bearer Token | **READY** |
| 32 | `GET` | `/api/v1/simulation/scenarios` | `simulationService.getScenarios()` | `app.api.routes.other.get_scenarios` | Static Simulation Definitions | Bearer Token | **READY** |
| 33 | `POST` | `/api/v1/simulation/run` | `simulationService.runSimulation()` | `app.api.routes.other.run_simulation` | `cases` (Rule-based simulation) | Bearer Token | **READY** |
| 34 | `GET` | `/api/v1/analytics/performance` | `analyticsService.getPerformanceMetrics()` | `app.api.routes.other.get_performance` | `cases` | Bearer Token | **READY** |
| 35 | `POST` | `/api/v1/{case_id}/legal-opinion` | `(Request Legal Opinion)` | `app.api.routes.other.request_legal_opinion` | `legal_opinions` | Bearer Token | **READY** |
| 36 | `GET` | `/api/v1/{case_id}/legal-opinion` | `(Get Legal Opinion)` | `app.api.routes.other.get_legal_opinion` | `legal_opinions` | Bearer Token | **READY** |
| 37 | `PUT` | `/api/v1/legal-opinions/{opinion_id}` | `(Update Opinion)` | `app.api.routes.other.update_legal_opinion` | `legal_opinions` | Bearer Token | **READY** |
| 38 | `GET` | `/api/v1/alerts` | `(Alerts Bell & Widget)` | `app.api.routes.alerts.list_alerts` | `alerts` | Bearer Token | **READY** |
| 39 | `PUT` | `/api/v1/alerts/{alert_id}/read` | `(Dismiss Alert)` | `app.api.routes.alerts.mark_alert_read` | `alerts` | Bearer Token | **READY** |
| 40 | `POST` | `/api/v1/alerts/refresh` | `(Global Alert Scan)` | `app.api.routes.alerts.trigger_alert_refresh` | `cases`, `alerts` | Bearer Token | **READY** |
| 41 | `GET` | `/health` | `(Health Check)` | `app.main.health_check` | Server Status | No | **READY** |

---

## 2. Testing Endpoints via PowerShell / cURL

### 1. Health Check
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing
```

### 2. Login
```powershell
$body = @{ email = "director.operations@goip.gov.in"; password = "your-password-here" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $auth.token
```

### 3. Fetch Dashboard Metrics
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/dashboard/metrics" -Headers $headers
```

### 4. Fetch Ranked Cases (Case Intelligence Engine)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/risk/ranked-cases" -Headers $headers
```
