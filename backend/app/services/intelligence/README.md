# Case Intelligence & Risk Engine

Deterministic, transparent, rule-based intelligence layer for government litigation tracking and SLA compliance.

---

## 1. Overview & Architecture

The **Case Intelligence Engine** is a self-contained, modular Python package designed to analyze government cases, track limitation deadlines, detect file stagnation in departments, calculate explainable risk scores, and prioritize cases requiring immediate executive attention.

```
                    Raw Case Data + DB Records
                                ↓
        ┌─────────────────────────────────────────────────┐
        │       app.services.intelligence Package         │
        ├─────────────────────────────────────────────────┤
        │  1. deadline_engine.py      (SLA & Days Left)   │
        │  2. bottleneck_engine.py    (Stage Dwell)       │
        │  3. risk_engine.py          (Points & Reasons)  │
        │  4. recommendation_engine.py(Actionable Advice) │
        │  5. priority_engine.py      (Ranking & Metrics) │
        └─────────────────────────────────────────────────┘
                                ↓
                    CaseIntelligenceResult
                 (Explainable Risk & Actions)
                                ↓
                 FastAPI Backend / REST Routes
                                ↓
                      React / TypeScript UI
```

---

## 2. Core Capabilities

1. **Deadline & Urgency Calculation** — Parses limitation dates, computes exact days remaining, and categorizes cases into `SAFE`, `WATCH`, `HIGH`, `CRITICAL`, `DUE_TODAY`, or `OVERDUE`.
2. **Stagnation & Bottleneck Detection** — Checks how long a file has dwelled at its current stage versus historical baseline days, flagging bottlenecks as `MODERATE` (>7 days) or `CRITICAL` (>15 days).
3. **Transparent Risk Scoring (0–100)** — Uses a deterministic weighted point attribution model. Every score is backed by itemized reasons and a feature contribution breakdown.
4. **Actionable Recommendations** — Generates clear administrative recommendations (e.g. counsel follow-up, condonation of delay filings).
5. **Multi-Factor Priority Sorting** — Sorts cases: `OVERDUE` first → `risk_score DESC` → `days_remaining ASC` → `age_days DESC`.
6. **Executive Dashboard Aggregation** — Computes active queues, SLA at-risk tallies, and primary department bottlenecks.

---

## 3. Risk Scoring Breakdown

| Factor | Description | Weight Contribution |
|---|---|---|
| **Deadline Proximity** | How close the case is to its statutory limitation deadline | 0 – 50 pts |
| **Overdue Bonus** | Severe penalty when deadline has expired | +30 pts |
| **Stage Stagnation** | File dwelling at current desk/stage beyond thresholds | 0 – 20 pts |
| **Legal Opinion Delay** | Pending or overdue counsel advice | 0 – 15 pts |
| **Stage Criticality** | Inherent urgency of stage (e.g. Legal Review = 8, Approval = 6) | 0 – 10 pts |
| **Rework / Forward Frequency** | High forwarding cycles indicating administrative loops | 0 – 5 pts |
| **Maximum Total** | Sum capped at 100 | **100 pts** |

### Risk Level Mapping

| Score Range | Intelligence Engine Level | Frontend `RiskLevel` | Operational Priority |
|---|---|---|---|
| 0 – 29 | `LOW` | `LOW` | `ROUTINE` |
| 30 – 49 | `MEDIUM` | `MEDIUM` | `URGENT` |
| 50 – 69 | `HIGH` | `HIGH` | `URGENT` |
| 70 – 100 | `CRITICAL` | `HIGH` | `IMMEDIATE` |

---

## 4. How Person 1 Integrates This Module

### A. Single Case Intelligence
```python
from app.services.intelligence import compute_case_intelligence

# case_data: dict from Supabase `cases` table
# legal_opinion: optional dict from `legal_opinions` table
# movements: optional list of dicts from `case_movements` table

intel = compute_case_intelligence(
    case_data=case,
    legal_opinion=legal_opinion,
    movements=movements,
)

print(intel.risk_score)          # e.g. 87.0
print(intel.priority)            # e.g. "IMMEDIATE"
print(intel.deadline_status)     # e.g. "CRITICAL"
print(intel.bottleneck_stage)    # e.g. "Legal Review"
print(intel.recommended_action)  # e.g. "URGENT: 6 day(s) remaining..."
print(intel.reasons)             # e.g. ["Statutory limitation deadline is OVERDUE by 2 days", ...]
```

### B. Priority Ranking for Cases List
```python
from app.services.intelligence import rank_cases

# cases: List[dict] fetched from database
ranked_cases = rank_cases(cases)
# Returns list sorted with highest urgency at the top, enriched with intelligence
```

### C. Aggregate Dashboard Intelligence
```python
from app.services.intelligence import aggregate_dashboard_intelligence

summary = aggregate_dashboard_intelligence(cases)
# Returns DashboardIntelligenceSummary with total, at_risk, primary_bottleneck, etc.
```

---

## 5. Changing Thresholds and Configuration

All thresholds and weights are located in [`constants.py`](file:///c:/Users/Samujwal/OneDrive/Desktop/projects/SIH/backend/app/services/intelligence/constants.py):

```python
# To modify warning dwell threshold (default 7 days):
STAGE_WARNING_DAYS = 7

# To modify critical dwell threshold (default 15 days):
STAGE_CRITICAL_DAYS = 15

# To adjust score weights:
WEIGHT_DEADLINE_MAX = 50.0
WEIGHT_OVERDUE_BONUS = 30.0
```

---

## 6. Running Automated Tests

All tests use fixed dates to guarantee 100% deterministic results:

```bash
cd backend
python -m pytest tests/test_intelligence.py -v
```
