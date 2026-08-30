# Procurement Integrity Engine — Backend Foundation (Day 1 / Task 3)

We have implemented the **Procurement Integrity Engine Foundation** for SIH26100 Fair Bid. The engine provides deterministic, evidence-backed decision support for procurement officers without ever making subjective or accusatory conclusions (e.g., avoiding terms like "corruption" or "fraud").

## Key Deliverables

### 1. Integrity Service Layer (`backend/app/services/integrity/`)
- [`models.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/models.py): Data models including `SignalType`, `RiskLevel` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `FindingStatus`, `IntegrityEvidence`, `IntegrityFinding`, `IntegrityAssessment`, and `BidderFeature`.
- [`feature_extractor.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/feature_extractor.py): Normalization for entity names, Indian postal PIN codes, proprietary email domains, monetary values (Lakhs, Crores, commas), and embedded PAN extraction from GSTIN.
- [`bid_analyzer.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/bid_analyzer.py):
  - **Signal A (Bid Price Similarity)**: Detects tight bid price clustering ($\le 1.0\%$ delta threshold) with spread computation and BOQ audit recommendations.
  - **Signal B (Winner Concentration)**: Flags when an entity has won $\ge 75\%$ of evaluated historical tenders (min 4 tenders), calibrated at LOW severity.
  - **Signal C (Repeated Participation)**: Identifies joint co-bidding cohorts across $\ge 3$ historical tenders.
  - **Signal D (Bid Rotation)**: Identifies sequential alternating cycles across $\ge 4$ tenders without consecutive same-winner runs. Gracefully returns empty results on sparse data.
- [`relationship_analyzer.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/relationship_analyzer.py):
  - **Signal E (Related-Bidder Linkages)**: Detects shared statutory identifiers (PAN, GSTIN, CIN, Udyam) and operational linkages (Address, proprietary email domain, phone).
  - **Anti-Double-Counting**: Collapses multi-attribute matches between a bidder pair into a single consolidated finding with all contributing evidence items bundled.
- [`risk_engine.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/risk_engine.py):
  - Configurable weights (`DEFAULT_SIGNAL_WEIGHTS`).
  - Transparent 4-tier risk classification: `LOW` (0–24.9), `MEDIUM` (25–49.9), `HIGH` (50–74.9), `CRITICAL` (75–100).
  - Diminishing returns formula on repeated signals of the same category to prevent score explosion.
  - Entry points: `assess_tender_integrity` and `assess_bidder_integrity`.
- [`__init__.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/integrity/__init__.py): Clean public service boundary.

### 2. Read-Only API Endpoints (`backend/app/api/routes/procurement.py`)
- `GET /api/v1/procurement/tenders/{tender_id}/integrity`
- `GET /api/v1/procurement/bidders/{bidder_id}/integrity`

---

## Verification Results

### Backend Test Suite
```bash
pytest
# 157 passed in 4.75s (146 baseline + 11 new integrity engine tests)
```

### Frontend Build
```bash
npm run build
# ✓ built in 718ms (0 errors)
```

### Graphify
```bash
graphify update .
# Rebuilt: 1644 nodes, 3336 edges, 99 communities (0 import cycles)
```
