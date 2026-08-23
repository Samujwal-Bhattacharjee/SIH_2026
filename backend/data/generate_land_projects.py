"""
Land Acquisition Historical Dataset Generator
==============================================
SIH26017 — Ministry of Rural Development
Land Acquisition Delay Prediction

Generates a realistic synthetic dataset of land acquisition projects
for training the ML delay prediction model.

DISCLAIMER: All data is SYNTHETIC and generated programmatically.
No real government project data has been used. The relationships
between features are based on domain knowledge of LARR Act processes.

Usage:
    cd backend
    python data/generate_land_projects.py

Output:
    backend/data/historical_projects.csv
"""
import csv
import random
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Reproducible random seed
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

# Dataset size
NUM_RECORDS = 1200

# ============================================================
# REALISTIC DOMAIN CONSTANTS
# ============================================================
STATES_DISTRICTS = {
    "Maharashtra": ["Nashik", "Pune", "Aurangabad", "Nagpur", "Thane", "Kolhapur", "Solapur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
    "Uttar Pradesh": ["Lucknow", "Agra", "Kanpur", "Varanasi", "Meerut", "Allahabad"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi", "Dharwad"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Berhampur"],
}

LAND_ACQUISITION_STAGES = [
    "Project Initiation",
    "Land Identification",
    "Preliminary Notification",
    "Survey and Verification",
    "Ownership Verification",
    "Objection and Legal Review",
    "Compensation Assessment",
    "Compensation Disbursement",
    "R&R and Rehabilitation",
    "Final Acquisition",
    "Possession and Handover",
]

STAGE_EXPECTED_DAYS = {
    "Project Initiation": 15,
    "Land Identification": 30,
    "Preliminary Notification": 30,
    "Survey and Verification": 45,
    "Ownership Verification": 30,
    "Objection and Legal Review": 60,
    "Compensation Assessment": 60,
    "Compensation Disbursement": 90,
    "R&R and Rehabilitation": 120,
    "Final Acquisition": 30,
    "Possession and Handover": 30,
}

PROJECT_TYPES = [
    "Highway Construction", "Railway Expansion", "Dam / Irrigation",
    "Industrial Corridor", "Power Transmission", "Urban Infrastructure",
    "Defense Installation", "Pipeline Project", "Mining Development",
]


def weighted_bool(true_probability: float) -> bool:
    """Return True with the given probability."""
    return random.random() < true_probability


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def generate_project(project_index: int) -> Dict[str, Any]:
    """
    Generate a single synthetic land acquisition project record.
    
    Relationships encoded (domain knowledge):
    - ownership_conflict=True  → higher delay probability
    - legal_dispute=True       → higher delay probability + longer duration
    - documentation_completeness low → higher delay probability
    - high compensation_pending_days → higher delay probability
    - inter_dept_dependency=True → higher delay probability
    - multiple delayed stages  → higher delay probability
    """
    state = random.choice(list(STATES_DISTRICTS.keys()))
    district = random.choice(STATES_DISTRICTS[state])
    project_type = random.choice(PROJECT_TYPES)
    project_age_days = random.randint(30, 900)

    # Base risk factors — independently distributed
    documentation_completeness = round(random.gauss(82, 18), 1)
    documentation_completeness = clamp(documentation_completeness, 10.0, 100.0)

    # Correlated risk factors
    # Low documentation → more likely to have other issues
    doc_risk_factor = 1.0 - (documentation_completeness / 100.0)

    ownership_conflict = weighted_bool(0.25 + doc_risk_factor * 0.25)
    legal_dispute = weighted_bool(0.15 + (0.35 if ownership_conflict else 0.0))
    inter_dept_dependency = weighted_bool(0.30)
    rr_applicable = weighted_bool(0.65)

    # Compensation pending days
    base_comp_days = random.randint(0, 30)
    if ownership_conflict:
        base_comp_days += random.randint(15, 60)
    if legal_dispute:
        base_comp_days += random.randint(20, 90)
    compensation_pending_days = min(base_comp_days, 180)

    # R&R delay
    rr_delay_days = 0
    if rr_applicable:
        rr_delay_days = random.randint(0, 30)
        if legal_dispute:
            rr_delay_days += random.randint(10, 60)
        rr_delay_days = min(rr_delay_days, 120)

    # Current stage
    stage_idx = random.randint(0, len(LAND_ACQUISITION_STAGES) - 1)
    # Weight earlier stages as more common (active projects)
    stage_idx = min(stage_idx, random.randint(0, len(LAND_ACQUISITION_STAGES) - 1))
    current_stage = LAND_ACQUISITION_STAGES[stage_idx]

    # Previous stage delay
    previous_stage_delay_days = 0
    if stage_idx > 0:
        prev_stage = LAND_ACQUISITION_STAGES[stage_idx - 1]
        expected = STAGE_EXPECTED_DAYS[prev_stage]
        # Delay more likely for complex stages
        delay_factor = 1.5 if (ownership_conflict or legal_dispute) else 1.0
        actual = int(expected * delay_factor * random.gauss(1.0, 0.4))
        actual = max(0, actual)
        previous_stage_delay_days = max(0, actual - expected)

    # Count of delayed stages so far
    number_of_delayed_stages = 0
    for s in LAND_ACQUISITION_STAGES[:stage_idx + 1]:
        exp_d = STAGE_EXPECTED_DAYS[s]
        mult = 1.0
        if ownership_conflict and s in ("Ownership Verification", "Objection and Legal Review"):
            mult = random.gauss(1.6, 0.3)
        elif legal_dispute and s in ("Objection and Legal Review", "Compensation Assessment"):
            mult = random.gauss(1.8, 0.4)
        elif s == "Compensation Disbursement" and compensation_pending_days > 30:
            mult = random.gauss(1.5, 0.3)
        actual_d = int(exp_d * max(0.5, mult))
        if actual_d > exp_d:
            number_of_delayed_stages += 1

    # Pending approvals
    pending_approvals = random.randint(0, 3)
    if inter_dept_dependency:
        pending_approvals += random.randint(1, 3)
    pending_approvals = min(pending_approvals, 8)

    # Parcel data
    total_parcels = random.randint(5, 500)
    completion_ratio = clamp(random.gauss(0.6, 0.3), 0.0, 1.0)
    completed_parcels = int(total_parcels * completion_ratio)
    total_area = round(random.uniform(0.5, 250.0), 2)  # hectares

    # ============================================================
    # TARGET CALCULATION
    # Based on actual risk factors — creates realistic correlations.
    # This is the label the ML model will learn to predict.
    # ============================================================
    delay_score = 0.0

    # Documentation completeness
    if documentation_completeness < 60:
        delay_score += 0.30
    elif documentation_completeness < 80:
        delay_score += 0.15

    # Ownership conflict
    if ownership_conflict:
        delay_score += 0.25

    # Legal dispute
    if legal_dispute:
        delay_score += 0.30

    # Compensation pending
    if compensation_pending_days > 60:
        delay_score += 0.20
    elif compensation_pending_days > 30:
        delay_score += 0.10

    # Inter-department dependency
    if inter_dept_dependency:
        delay_score += 0.10

    # Multiple delayed stages
    delay_score += number_of_delayed_stages * 0.05

    # Previous stage delay
    if previous_stage_delay_days > 30:
        delay_score += 0.15
    elif previous_stage_delay_days > 15:
        delay_score += 0.08

    # Project age
    if project_age_days > 600:
        delay_score += 0.10

    # Add small random noise
    delay_score += random.gauss(0, 0.05)
    delay_score = clamp(delay_score, 0.0, 1.0)

    # Binary label with calibrated threshold
    is_delayed = 1 if delay_score >= 0.35 else 0

    # Estimated delay days (only meaningful for delayed projects)
    if is_delayed:
        base_delay = 15
        base_delay += int(compensation_pending_days * 0.3)
        if legal_dispute:
            base_delay += random.randint(15, 60)
        if ownership_conflict:
            base_delay += random.randint(10, 40)
        base_delay += number_of_delayed_stages * 5
        delay_days = max(7, int(base_delay * random.gauss(1.0, 0.25)))
    else:
        delay_days = 0

    return {
        "project_id": f"LA-{project_index:04d}",
        "state": state,
        "district": district,
        "project_type": project_type,
        "current_stage": current_stage,
        "current_stage_index": stage_idx,
        "project_age_days": project_age_days,
        "total_parcels": total_parcels,
        "completed_parcels": completed_parcels,
        "total_area": total_area,
        "documentation_completeness": documentation_completeness,
        "legal_dispute": int(legal_dispute),
        "ownership_conflict": int(ownership_conflict),
        "compensation_pending_days": compensation_pending_days,
        "pending_approvals": pending_approvals,
        "inter_dept_dependency": int(inter_dept_dependency),
        "rr_delay_days": rr_delay_days,
        "previous_stage_delay_days": previous_stage_delay_days,
        "number_of_delayed_stages": number_of_delayed_stages,
        # Targets (not used as input features)
        "target_delayed": is_delayed,
        "target_delay_days": delay_days,
    }


def generate_dataset(n: int = NUM_RECORDS) -> List[Dict[str, Any]]:
    random.seed(RANDOM_SEED)
    return [generate_project(i + 1000) for i in range(n)]


FIELDNAMES = [
    "project_id", "state", "district", "project_type",
    "current_stage", "current_stage_index", "project_age_days",
    "total_parcels", "completed_parcels", "total_area",
    "documentation_completeness", "legal_dispute", "ownership_conflict",
    "compensation_pending_days", "pending_approvals", "inter_dept_dependency",
    "rr_delay_days", "previous_stage_delay_days", "number_of_delayed_stages",
    "target_delayed", "target_delay_days",
]


def write_csv(records: List[Dict[str, Any]], output_path: str):
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in records:
            writer.writerow({k: row[k] for k in FIELDNAMES})
    print(f"Written {len(records)} records to {output_path}")


if __name__ == "__main__":
    output_dir = os.path.dirname(__file__)
    output_path = os.path.join(output_dir, "historical_projects.csv")

    print(f"Generating {NUM_RECORDS} synthetic land acquisition project records...")
    print(f"Random seed: {RANDOM_SEED} (reproducible)")
    print("NOTE: All data is SYNTHETIC — for prototype/demo only.")
    print()

    records = generate_dataset(NUM_RECORDS)
    write_csv(records, output_path)

    # Print basic statistics
    delayed = sum(1 for r in records if r["target_delayed"] == 1)
    print(f"\nDataset statistics:")
    print(f"  Total records:        {len(records)}")
    print(f"  Delayed projects:     {delayed} ({100*delayed/len(records):.1f}%)")
    print(f"  On-track projects:    {len(records)-delayed} ({100*(len(records)-delayed)/len(records):.1f}%)")
    print(f"\nFeatures generated:")
    for f in FIELDNAMES:
        if not f.startswith("target_"):
            print(f"  - {f}")
    print(f"\nTargets:")
    print(f"  - target_delayed (binary: 0/1)")
    print(f"  - target_delay_days (regression target, 0 if not delayed)")
