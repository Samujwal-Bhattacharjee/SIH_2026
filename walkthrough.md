# SIH26100 — Bid Compliance Verification Platform: Walkthrough

## Summary of Accomplishments

We have completed the **AI-Powered Integrated Bid Compliance Verification Platform (SIH26100)** prototype without rewriting working authentication, preserving the government UI language, and implementing the end-to-end evidence-backed compliance verification pipeline.

---

## 1. Pipeline Verification

```
TENDER & BIDDER REGISTRATION
        ↓
DOCUMENT UPLOAD (PDF / PNG / JPEG)
        ↓
OCR / TEXT EXTRACTION (PyMuPDF Tier 1 + Tesseract Tier 2)
        ↓
STRUCTURED FIELD EXTRACTION (GSTIN, PAN, Udyam, CIN, OEM MAF, Expiry, Turnover, Blacklisting)
        ↓
DETERMINISTIC COMPLIANCE VERIFICATION (7 Tender Criteria)
        ↓
CROSS-DOCUMENT VALIDATION (Legal name & GSTIN mismatch detection)
        ↓
WEIGHTED EXPLAINABLE SCORING (Statutory 25%, Technical 20%, Mandatory 20%, Financial 20%, Eligibility 15%)
        ↓
EXPLAINABLE RISK ENGINE (LOW / MEDIUM / HIGH / CRITICAL)
        ↓
ACTIONABLE RECOMMENDATIONS (Rule-based, triggered per failure)
        ↓
OFFICER REVIEW & AUDIT TRAIL (Qualified / Disqualified / Clarification + Immutable Hash Trace)
```

---

## 2. Key Modules Implemented

### A. OCR & Field Extraction Layer
- **`backend/app/services/ocr_service.py`**:
  - `extract_procurement_fields()`: Extracts 15-char GSTIN, 10-char PAN, Udyam MSME numbers, CIN, legal entity names, document dates, expiry dates, OEM authorization references, annual turnover, local content percentages, and non-blacklisting declarations.
  - `classify_document_type()`: Deterministic classifier mapping document text to 15 official certificate types.

### B. Procurement Compliance & Risk Engine
- **`backend/app/services/procurement_service.py`**:
  - `run_compliance_checks()`: Evaluates documents against tender criteria (GST, PAN, Udyam, OEM MAF, Turnover, Blacklisting, Local Content).
  - `run_cross_document_validation()`: Cross-checks legal names and GSTINs across multiple submitted documents to flag inconsistencies.
  - `calculate_compliance_score()`: Weighted, transparent scoring with mandatory failure penalties.
  - `calculate_risk_level()`: Explainable risk level attribution based on compliance results and critical discrepancies.
  - `generate_recommendations()`: Actionable recommendations with clear triggers (e.g., requesting fresh OEM MAF if expired).
  - `run_full_verification()`: Full pipeline execution.

### C. Backend API Routes
- **`backend/app/api/routes/procurement.py`**:
  - `GET /api/v1/procurement/tenders` & `POST /api/v1/procurement/tenders`
  - `GET /api/v1/procurement/tenders/{id}/bidders` & `POST /api/v1/procurement/tenders/{id}/bidders`
  - `POST /api/v1/procurement/bidders/{id}/verify`
  - `GET /api/v1/procurement/bidders/{id}/compliance`
  - `GET /api/v1/procurement/bidders/{id}/risk`
  - `GET /api/v1/procurement/bidders/{id}/recommendations`
  - `POST /api/v1/procurement/bidders/{id}/decision`
  - `GET /api/v1/procurement/audit`
  - `GET /api/v1/procurement/dashboard`

### D. Frontend Pages & Context
- **`src/context/ProcurementContext.tsx`**: State management connecting React components to the real backend with mock fallback.
- **`src/pages/BidderVerification.tsx`**: Evidence checklist, cross-document discrepancy table ("What was found vs Expected"), recommendations, and officer review.
- **`src/pages/ProcurementDocuments.tsx`**: Multi-step OCR processing pipeline (Upload → OCR → Extract → Ready) and structured field table.
- **`src/pages/Tenders.tsx`**: Tender criteria overview, bidder register, and vendor enrollment.
- **`src/pages/ProcurementAuditTrail.tsx`**: Tamper-evident chronological activity log with action filtering.
- **`src/pages/ProcurementDashboard.tsx`**: Executive metrics and attention-required notifications.
- **`src/pages/VerificationSources.tsx`**: 12 configured sandbox/mock adapters with interactive testing.

---

## 3. Test & Build Validation

### Backend Tests
```bash
python -m pytest -v
============================ 142 passed in 22.21s =============================
```
- 15 dedicated procurement compliance tests in `backend/tests/test_procurement.py`.
- 127 core litigation & document tests in existing test suite.

### Frontend Production Build
```bash
npm run build
✓ built in 1.43s (0 errors)
```

---

## 4. Exact Demo Sequence for Judges

1. **Open Dashboard (`/dashboard`)**:
   - Show metrics: Active Tenders, Bids Under Verification, High-Risk Bidders, Exceptions.
   - Show Attention Required alert for *Narmada Systems*.
2. **Open Tender Register (`/tenders`)**:
   - Inspect active tender `GEM/2026/B/418207`.
   - Review the 7 extracted eligibility criteria.
   - Show participating bidders (Triveni Infotech: Score 87 / LOW risk, Narmada Systems: Score 54 / HIGH risk).
3. **Open Bidder Verification (`/verification/BID-002`)**:
   - Click "Run Compliance Verification" to trigger the live evaluation pipeline.
   - Inspect the **Discrepancies Section**: Legal name mismatch between GST certificate and PAN card, Expired OEM letter.
   - Inspect the **Actionable Recommendations**: Clear administrative steps to take.
   - Record an Officer Decision (e.g., *Request Clarification* or *Confirm Qualified*).
4. **Open Document Verification (`/documents`)**:
   - Upload a test certificate (PDF or PNG).
   - Watch live stepper: `1. File Storage → 2. OCR Text Scan → 3. Field Extraction → 4. Evidence Ready`.
   - See extracted GSTIN, PAN, and Udyam numbers populated.
5. **Open Audit Trail (`/audit-trail`)**:
   - Verify that all uploads, extractions, compliance evaluations, and officer decisions are logged chronologically.
6. **Open Verification Sources (`/verification-sources`)**:
   - Show 12 sandbox/mock adapters (GSTN, Udyam, PAN, MCA21, EPFO, ESIC, DigiLocker, etc.) with transparent "Demo/Sandbox" labels.
