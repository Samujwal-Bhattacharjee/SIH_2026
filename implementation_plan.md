# Implementation Plan - Procurement Integrity Engine (Backend Foundation)

Build a modular, deterministic, evidence-backed **Procurement Integrity Engine** in FastAPI that detects integrity risk signals (bid price similarity, winner concentration, repeated participation, bid rotation, and related bidders) with full audit-verifiable evidence and non-accusatory decision support for procurement officers.

## User Review Required
> [!NOTE]
> All integrity signals are strictly deterministic, rule-and-evidence based, and framed as **administrative review triggers** rather than accusations or "corruption detection". No generic ML or black-box LLM scoring is used.

## Proposed Changes

### 1. Integrity Module (`backend/app/services/integrity/`)

#### [NEW/UPDATE] [models.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/models.py)
- Define `SignalType` enum: `BID_PRICE_ANOMALY`, `REPEATED_WINNER_PATTERN`, `REPEATED_PARTICIPATION_PATTERN`, `BID_ROTATION_PATTERN`, `RELATED_BIDDER`, `SHARED_ENTITY`, `TENDER_CHANGE_PATTERN`, `CONFLICT_OF_INTEREST`.
- Define `RiskLevel` enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Define `FindingStatus` enum: `OPEN`, `UNDER_REVIEW`, `ACKNOWLEDGED`, `DISMISSED`, `RESOLVED`.
- Define `IntegrityEvidence`: `source_type`, `source_id`, `field`, `value`, `description`, `metadata`.
- Define `IntegrityFinding`: `id`, `tender_id`, `bidder_id`, `related_bidder_ids`, `signal_type`, `severity`, `score_impact`, `confidence`, `title`, `reason`, `evidence`, `recommended_action`, `status`, `detected_at`.
- Define `IntegrityAssessment`: `tender_id`, `bidder_id`, `overall_risk_score`, `risk_level`, `confidence_score`, `findings_count`, `findings`, `contributing_signals`, `summary`, `assessed_at`.
- Define `BidderFeature`: normalized feature vector for bidders.

#### [NEW/UPDATE] [feature_extractor.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/feature_extractor.py)
- Normalize legal names (`normalize_entity_name`) without over-aggressive fuzzy modifications.
- Extract embedded PAN from 15-character GSTIN (`extract_pan_from_gstin`).
- Standardize identifiers, physical addresses, postal codes, and email domains (excluding public providers like gmail, yahoo, gov.in).
- Parse financial quote amounts with Indian notation (Lakhs, Cr, commas).

#### [NEW/UPDATE] [bid_analyzer.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/bid_analyzer.py)
- **SIGNAL A — Suspicious Bid Similarity**: Cluster bidders within configurable delta threshold (default 1.0%), calculate cluster spread, provide BOQ verification recommendation.
- **SIGNAL B — Repeated Winner Concentration**: Flag when vendor won $\ge 75\%$ of historical tenders (min 4 evaluated), low severity, non-accusatory reason.
- **SIGNAL C — Repeated Bid Participation**: Detect joint cohort participation ($\ge 3$ historical tenders), low severity, objective note.
- **SIGNAL D — Bid Rotation**: Identify sequential alternating cycles over $\ge 4$ tenders without consecutive repeats; return empty list gracefully when data is insufficient.

#### [NEW/UPDATE] [relationship_analyzer.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/relationship_analyzer.py)
- **SIGNAL E — Related-Bidder Linkages**: Pairwise evaluation of statutory identifiers (PAN, GSTIN, CIN, Udyam) and operational linkages (Address, proprietary email domain, phone).
- **Anti-Double-Counting Protection**: Collapse multiple matching attributes for a bidder pair into a single consolidated finding with bundled multi-attribute evidence.

#### [NEW/UPDATE] [risk_engine.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/risk_engine.py)
- Configurable weights (`DEFAULT_SIGNAL_WEIGHTS`).
- Transparent 4-tier risk classification: `LOW` (0-24.9), `MEDIUM` (25-49.9), `HIGH` (50-74.9), `CRITICAL` (75-100).
- Anti-double-counting through diminishing returns on repeated signals of the same category.
- Primary entry points: `assess_tender_integrity(tender_id)` and `assess_bidder_integrity(bidder_id)`.

#### [NEW/UPDATE] [__init__.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/__init__.py)
- Export clean public service boundary.

---

### 2. API Routes (`backend/app/api/routes/procurement.py`)

#### [MODIFY] [procurement.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/api/routes/procurement.py)
- Expose `GET /api/v1/procurement/tenders/{tender_id}/integrity` (tender-level assessment).
- Expose `GET /api/v1/procurement/bidders/{bidder_id}/integrity` (bidder-level assessment).

---

### 3. Unit Tests (`backend/tests/test_integrity_engine.py`)

#### [NEW] [test_integrity_engine.py](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/tests/test_integrity_engine.py)
- **Test 1**: Clean dataset $\rightarrow$ `LOW` risk tier ($< 25$), 0 findings.
- **Test 2**: Suspicious bid similarity (A ₹10,00,000, B ₹10,01,000, C ₹10,00,500) $\rightarrow$ `BID_PRICE_ANOMALY` signal.
- **Test 3**: Repeated winner concentration (A wins 8 of 9) $\rightarrow$ `REPEATED_WINNER_PATTERN` signal (low severity).
- **Test 4**: Related bidders (A & B share PAN / GSTIN) $\rightarrow$ `RELATED_BIDDER` with structured evidence.
- **Test 5**: Insufficient data handling $\rightarrow$ no fabricated rotation/concentration signal.
- **Test 6**: Multiple signals $\rightarrow$ proper aggregation and anti-double-counting.
- **Test 7**: Evidence completeness $\rightarrow$ all findings contain reason, evidence, recommended action, confidence.
- **Test 8**: Determinism $\rightarrow$ identical outputs across multiple invocations.
- **Test 9**: API route verification $\rightarrow$ test both integrity endpoints with FastAPI TestClient.

---

## Verification Plan

### Automated Tests
1. Run new integrity engine tests:
   ```bash
   pytest tests/test_integrity_engine.py -v
   ```
2. Run full backend test suite to ensure 0 regressions:
   ```bash
   pytest
   ```
3. Run frontend production build check:
   ```bash
   npm run build
   ```
4. Run Graphify update:
   ```bash
   graphify update .
   ```
