# GOIP Backend API Contract Specification
**Version**: 1.0.0-PROD  
**Target Backend**: Python / FastAPI / PostgreSQL / PM4Py / XGBoost / Tesseract OCR  
**Base Path**: `/api/v1`

This document defines the strict REST API contract between the GOIP Frontend and the FastAPI backend. All endpoints, request parameters, JSON payloads, and response structures must conform to this specification.

---

## Table of Contents
1. [Authentication (`/auth`)](#1-authentication)
2. [Dashboard Operations (`/dashboard`)](#2-dashboard-operations)
3. [Case Intelligence (`/cases`)](#3-case-intelligence)
4. [Process Mining & Workflow (`/workflow`)](#4-process-mining--workflow)
5. [Risk Intelligence (`/risk`)](#5-risk-intelligence)
6. [Documents & OCR (`/documents`)](#6-documents--ocr)
7. [What-If Simulation (`/simulation`)](#7-what-if-simulation)
8. [Analytics & Conformance (`/analytics`)](#8-analytics--conformance)
9. [Global Search (`/search`)](#9-global-search)

---

## 1. Authentication

### `POST /auth/login`
Authenticates a state officer or administrator.

- **Request Body**:
```json
{
  "email": "director.operations@goip.gov.in",
  "password": "your-password-here"
}
```

- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_gov_99182",
    "email": "director.operations@goip.gov.in",
    "name": "Rajeshwar V. Verma, IAS",
    "role": "ADMINISTRATOR",
    "department": "Department of Administrative Reforms & Public Grievances",
    "badgeNumber": "GOIP-DIR-2026-A1",
    "sessionExpiry": "2026-08-18T00:00:00.000Z"
  }
}
```

- **Errors**: `401 Unauthorized` (Invalid credentials), `422 Unprocessable Entity`.

---

## 2. Dashboard Operations

### `GET /dashboard/metrics`
Returns aggregated live operational KPIs across state departments.

- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "totalActiveCases": 3238,
  "pendingQueue": 1240,
  "slaAtRiskCount": 173,
  "slaBreachedCount": 48,
  "avgProcessingDays": 31.4,
  "primaryBottleneck": {
    "stage": "Legal Review",
    "severity": "CRITICAL",
    "avgWaitDays": 8.4,
    "baselineDays": 3.1,
    "queueSize": 1240,
    "deviationPct": 170.9,
    "rootCauseDescription": "Disproportionate legal opinion referral volume with 3 standing counsel.",
    "impactedCasesCount": 1240
  },
  "recentHighRiskCases": [ ... ],
  "activeDepartmentsCount": 6,
  "systemDatasetSize": 10482,
  "lastUpdated": "2026-08-17T21:50:00Z"
}
```

---

## 3. Case Intelligence

### `GET /cases`
Retrieves a paginated and filterable list of government case files.

- **Query Parameters**:
  - `department` (string, optional): e.g. `"Land Revenue"`
  - `stage` (string, optional): e.g. `"Legal Review"`
  - `risk_level` (string, optional): `"HIGH" | "MEDIUM" | "LOW"`
  - `status` (string, optional): `"IN_PROGRESS" | "SLA_BREACHED" | "AT_RISK" | "RESOLVED"`
  - `q` (string, optional): Free text search query
  - `page` (int, default: 1), `page_size` (int, default: 25)

- **Response (200 OK)**:
```json
{
  "total": 1,
  "cases": [
    {
      "id": "KA-10482",
      "title": "Sy. No. 142/A Boundary Adjudication & Mutation Appeal",
      "caseType": "Land Title Dispute",
      "department": "Land Revenue",
      "currentStage": "Legal Review",
      "ageDays": 20,
      "statutoryDeadlineDays": 25,
      "daysRemaining": 5,
      "riskScore": 87,
      "riskLevel": "HIGH",
      "status": "AT_RISK",
      "applicant": "G. Manjunath & Co-parceners",
      "assignedOfficer": "Adv. M. Sundaram / AC K. R. Mohan",
      "flaggedForReview": true,
      "createdAt": "2026-07-28T09:30:00Z",
      "updatedAt": "2026-08-17T15:00:00Z",
      "documentIds": ["doc-10482-1", "doc-10482-2"]
    }
  ]
}
```

### `GET /cases/{case_id}`
Returns complete case details, event logs history, and associated documents.

- **Response (200 OK)**:
```json
{
  "id": "KA-10482",
  "title": "Sy. No. 142/A Boundary Adjudication & Mutation Appeal",
  "caseType": "Land Title Dispute",
  "department": "Land Revenue",
  "currentStage": "Legal Review",
  "ageDays": 20,
  "statutoryDeadlineDays": 25,
  "daysRemaining": 5,
  "riskScore": 87,
  "riskLevel": "HIGH",
  "status": "AT_RISK",
  "applicant": "G. Manjunath & Co-parceners",
  "assignedOfficer": "Adv. M. Sundaram / AC K. R. Mohan",
  "flaggedForReview": true,
  "createdAt": "2026-07-28T09:30:00Z",
  "updatedAt": "2026-08-17T15:00:00Z",
  "documentIds": ["doc-10482-1"],
  "events": [
    {
      "id": "ev-1",
      "caseId": "KA-10482",
      "stage": "Application Received",
      "timestamp": "2026-07-28T09:30:00Z",
      "durationDays": 0.5,
      "waitDays": 0.2,
      "officer": "System Intake Desk",
      "status": "COMPLETED",
      "notes": "Initial application submitted through Revenue Portal."
    },
    {
      "id": "ev-5",
      "caseId": "KA-10482",
      "stage": "Legal Review",
      "timestamp": "2026-08-07T10:20:00Z",
      "durationDays": 6.4,
      "waitDays": 5.8,
      "officer": "Adv. M. Sundaram",
      "status": "REWORK_TRIGGERED",
      "isDelayed": true,
      "isRework": true,
      "notes": "Legal opinion requested. File held in queue for 5.8 days."
    }
  ],
  "riskPrediction": {
    "caseId": "KA-10482",
    "riskScore": 87,
    "riskLevel": "HIGH",
    "expectedDelayDays": 6.8,
    "predictedBreachDate": "2026-08-28",
    "statutoryDeadlineDate": "2026-08-22",
    "primaryFactor": "Legal review rework cycle + queue backlog",
    "recommendedAction": "Immediate fast-track escalation of Legal Review queue.",
    "confidenceScore": 0.94,
    "shapAttribution": [
      {
        "factor": "Legal Review Waiting Time",
        "contributionScore": 42,
        "impact": "HIGH",
        "description": "Queue wait time at Legal Review is 8.4 days (170% above baseline)."
      }
    ]
  },
  "documents": [ ... ]
}
```

### `POST /cases/{case_id}/flag`
Toggles human review flag for a specific case.

- **Response (200 OK)**:
```json
{
  "caseId": "KA-10482",
  "flaggedForReview": true
}
```

---

## 4. Process Mining & Workflow

### `GET /workflow/process-map`
Computes and returns the discovered process graph from event logs using PM4Py.

- **Query Parameters**:
  - `department` (string, optional)
  - `date_range` (string, optional)

- **Response (200 OK)**:
```json
{
  "nodes": [
    {
      "id": "n5",
      "stage": "Legal Review",
      "caseCount": 3842,
      "avgDurationDays": 6.8,
      "avgWaitDays": 8.4,
      "queueSize": 1240,
      "isBottleneck": true,
      "bottleneckSeverity": "CRITICAL",
      "deviationFromBaselinePct": 170.9,
      "reworkFrequencyPct": 31.8,
      "historicalBaselineDays": 3.1,
      "officerCapacityPct": 164
    }
  ],
  "edges": [
    {
      "id": "e5-4",
      "source": "n5",
      "target": "n4",
      "caseCount": 822,
      "avgTransitionDays": 4.8,
      "isReworkLoop": true,
      "loopPercentage": 21.4,
      "additionalDelayDays": 4.8
    }
  ],
  "bottlenecks": [ ... ],
  "reworkLoops": [ ... ],
  "metrics": {
    "totalActiveCases": 3238,
    "medianCycleDays": 31.4,
    "reworkRatePct": 26.2,
    "slaComplianceRatePct": 72.8
  }
}
```

---

## 5. Risk Intelligence

### `GET /risk/ranked-cases`
Returns all active cases ranked by XGBoost SLA breach probability.

- **Response (200 OK)**: Array of `Case` objects sorted by `riskScore DESC`.

### `GET /risk/predictions/{case_id}`
Returns the granular ML explanation (SHAP values) for a single case file.

---

## 6. Documents & OCR

### `GET /documents`
List documents with metadata and OCR status.

### `POST /documents/upload`
Accepts `multipart/form-data` with:
- `file`: Binary file (PDF, PNG, JPG)
- `case_id`: Associated Case ID
- `document_type`: Classification

- **Response (201 Created)**:
```json
{
  "id": "doc-up-99212",
  "caseId": "KA-10482",
  "title": "TitleDeed_Mutation_Copy",
  "documentType": "Application Form",
  "fileName": "TitleDeed_Mutation_Copy.pdf",
  "fileUrl": "https://s3.ap-south-1.amazonaws.com/goip-records/...",
  "uploadDate": "2026-08-17T21:55:00Z",
  "uploadedBy": "Rajeshwar V. Verma",
  "status": "READY",
  "ocrStatus": "COMPLETED",
  "metadata": {
    "fileSize": "3.4 MB",
    "fileType": "application/pdf",
    "mimeType": "application/pdf",
    "pageCount": 4,
    "checksum": "sha256:7f8a91c84b238d019f2a"
  },
  "ocrResult": {
    "documentId": "doc-up-99212",
    "extractedText": "GOVERNMENT OF KARNATAKA...",
    "confidenceScore": 0.96,
    "processingTimeMs": 1420,
    "ocrEngine": "Tesseract 5.3",
    "status": "READY",
    "extractedFields": [
      { "key": "Survey Number", "value": "142/A", "confidence": 0.98, "isExtracted": true }
    ]
  }
}
```

### `GET /documents/{doc_id}/download`
Returns binary stream of the document with `Content-Disposition: attachment`.

---

## 7. What-If Simulation

### `POST /simulation/run`
Executes discrete event simulation given a proposed policy intervention and threshold.

- **Request Body**:
```json
{
  "intervention": "ESCALATE_LEGAL_REVIEW_THRESHOLD",
  "threshold": 5
}
```

- **Response (200 OK)**:
```json
{
  "scenarioId": "sim_esc_legal_5d",
  "intervention": "ESCALATE_LEGAL_REVIEW_THRESHOLD",
  "interventionName": "Auto-Escalate Legal Review Beyond 5 Days",
  "thresholdApplied": 5,
  "baseline": {
    "medianCycleDays": 31.4,
    "slaCompliancePct": 72.8,
    "highRiskCasesCount": 173,
    "reworkCasesPct": 26.2,
    "avgLegalWaitDays": 8.4
  },
  "simulated": {
    "medianCycleDays": 24.8,
    "slaCompliancePct": 86.4,
    "highRiskCasesCount": 71,
    "reworkCasesPct": 18.1,
    "avgLegalWaitDays": 4.6
  },
  "difference": {
    "cycleTimeReductionDays": 6.6,
    "slaImprovementPct": 13.6,
    "riskCasesMitigated": 102,
    "legalWaitReductionDays": 3.8
  },
  "summaryExplanation": "Auto-escalating files queued past 5 days reduces average Legal Review wait time from 8.4 to 4.6 days.",
  "stagesComparison": [ ... ],
  "executionTimestamp": "2026-08-17T21:55:00Z"
}
```

---

## 8. Analytics & Conformance

### `GET /analytics/performance`
Returns stage throughput breakdown, discovered variants, and monthly SLA compliance.

---

## 9. Global Search

### `GET /search?q={query}`
Returns unified search results across Case IDs, Case Titles, Applicants, and Documents.
