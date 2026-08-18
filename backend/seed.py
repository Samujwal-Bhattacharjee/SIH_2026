# -*- coding: utf-8 -*-
"""
Demo Data Seed Script
======================
Generates ~40 realistic government litigation records for demonstration.

NOTE: This data is DEMO DATA only — not real government information.
NOTE: Department names, officer names, and case numbers are fictional.

Usage:
    cd backend
    python seed.py

Requirements:
    - .env file must be configured with valid Supabase credentials
    - Run `python -m pip install -r requirements.txt` first
    - The schema.sql must have been run in Supabase already
"""
import sys
import os
import uuid
import random
from datetime import datetime, timedelta, timezone

# Add backend root to path
sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))  # Ensure .env is found

from dotenv import load_dotenv
load_dotenv()

from app.core.database import get_supabase
from app.services.deadline_service import calculate_deadline

supabase = get_supabase()

# ============================================================
# SEED CONFIG
# ============================================================
DEMO_DEPARTMENTS = [
    {"name": "Land Revenue", "name_hi": "भू-राजस्व विभाग", "code": "REV",
     "head_officer": "P. K. Nambiar, IAS", "location": "Room 204, Vikas Soudha, Bengaluru",
     "avg_disposal_days": 14.8, "sla_compliance_pct": 78.4},
    {"name": "Urban Planning", "name_hi": "नगर एवं ग्राम नियोजन विभाग", "code": "URB",
     "head_officer": "Meenakshi Sundaram, IAS", "location": "Room 312, MS Building, Bengaluru",
     "avg_disposal_days": 12.2, "sla_compliance_pct": 84.1},
    {"name": "Social Welfare", "name_hi": "समाज कल्याण विभाग", "code": "SOC",
     "head_officer": "Dr. Anand Kumar, IAS", "location": "Room 108, Dr. Ambedkar Veedhi, Bengaluru",
     "avg_disposal_days": 8.5, "sla_compliance_pct": 91.2},
    {"name": "Public Works", "name_hi": "लोक निर्माण विभाग", "code": "PWD",
     "head_officer": "B. S. Shivakumar, CE", "location": "PWD Annexe, KR Circle, Bengaluru",
     "avg_disposal_days": 18.4, "sla_compliance_pct": 72.0},
    {"name": "Environment & Forests", "name_hi": "पर्यावरण एवं वन विभाग", "code": "ENV",
     "head_officer": "Smt. Vandana Rao, IFS", "location": "Aranya Bhavan, Malleshwaram, Bengaluru",
     "avg_disposal_days": 21.0, "sla_compliance_pct": 69.5},
    {"name": "Health & Family Welfare", "name_hi": "स्वास्थ्य एवं परिवार कल्याण विभाग", "code": "HEALTH",
     "head_officer": "Dr. T. S. Ramesh, IAS", "location": "Arogya Soudha, Magadi Road, Bengaluru",
     "avg_disposal_days": 7.2, "sla_compliance_pct": 93.4},
    {"name": "Finance & Expenditure", "name_hi": "वित्त एवं व्यय विभाग", "code": "FIN",
     "head_officer": "G. V. Subrahmanyam, IAS", "location": "Room 114, Vidhana Soudha, Bengaluru",
     "avg_disposal_days": 11.5, "sla_compliance_pct": 85.0},
    {"name": "Transport & Highways", "name_hi": "परिवहन एवं राजमार्ग विभाग", "code": "TRANS",
     "head_officer": "K. R. Mohan, IAS", "location": "Yeshwantpur, Bengaluru",
     "avg_disposal_days": 16.2, "sla_compliance_pct": 76.5},
]

COURTS = [
    "High Court of Karnataka", "Supreme Court of India",
    "High Court of Karnataka (Division Bench)",
    "District Court, Bengaluru Urban",
    "Karnataka Administrative Tribunal",
]

STAGES = [
    "Application Received", "Document Verification", "Department Assignment",
    "Officer Review", "Legal Review", "Approval", "Closure"
]

STATUSES = ["REGISTERED", "UNDER_SCRUTINY", "FORWARDED", "UNDER_PROCESSING", "PENDING",
            "OVERDUE", "AT_RISK", "APPROVED", "DISPOSED"]

OFFICERS = [
    "Rajeshwar V. Verma, IAS", "K. R. Mohan", "S. N. Hegde", "Adv. M. Sundaram",
    "Anita Deshmukh", "Pradeep K. Rathore", "Dr. T. S. Ramesh", "G. V. Subrahmanyam",
]

CASE_SUBJECTS = [
    ("Writ Appeal — Land Acquisition Compensation Challenge",      "WA",  90),
    ("Writ Petition — Building Plan Regularisation",               "WP",  60),
    ("Civil Appeal — Revenue Dispute",                             "CA",  120),
    ("Contempt Petition — Municipal Services Compliance",          "CP",  30),
    ("Public Interest Litigation — Forest Encroachment",           "PIL", 90),
    ("Original Application — Service Matter (Promotion)",          "OA",  90),
    ("Writ Petition — Environmental Clearance",                    "WP",  60),
    ("Review Petition — Land Title Dispute",                       "RP",  30),
    ("Civil Revision Petition — Tenancy Dispute",                  "CRP", 90),
    ("Special Leave Petition — Road Alignment Dispute",            "SLP", 60),
]


def random_date(days_ago_min: int, days_ago_max: int) -> str:
    """Generate a random past date within the given range."""
    delta = random.randint(days_ago_min, days_ago_max)
    dt = datetime.now(timezone.utc) - timedelta(days=delta)
    return dt.date().isoformat()


def seed_departments():
    print("Seeding departments...")
    for dept in DEMO_DEPARTMENTS:
        supabase.table("departments").upsert(dept, on_conflict="code").execute()
    print(f"  ✓ {len(DEMO_DEPARTMENTS)} departments seeded")


def seed_cases(count: int = 40):
    print(f"Seeding {count} demo cases...")
    inserted = 0

    for i in range(count):
        dept = random.choice(DEMO_DEPARTMENTS)
        subject, prefix, limit_days = random.choice(CASE_SUBJECTS)
        year = 2025 if random.random() < 0.3 else 2026
        seq = random.randint(100, 9999)
        case_number = f"{prefix} {seq}/{year}"
        file_number = f"GFT/{dept['code']}/2026/{i+1:06d}"

        received_date = random_date(5, 180)
        order_date = random_date(
            int((datetime.now(timezone.utc) - datetime.fromisoformat(received_date).replace(tzinfo=timezone.utc)).days),
            int((datetime.now(timezone.utc) - datetime.fromisoformat(received_date).replace(tzinfo=timezone.utc)).days) + 30
        )

        limitation_deadline = calculate_deadline(received_date, limit_days)
        created_at_dt = datetime.fromisoformat(received_date).replace(tzinfo=timezone.utc)
        created_at = created_at_dt.isoformat()

        # Pick a consistent stage based on deadline proximity
        from datetime import date
        deadline_date = date.fromisoformat(limitation_deadline)
        today = date.today()
        days_remaining = (deadline_date - today).days

        if days_remaining < 0:
            status = "OVERDUE"
            stage = random.choice(["Legal Review", "Officer Review", "Approval"])
        elif days_remaining <= 7:
            status = "AT_RISK"
            stage = random.choice(["Legal Review", "Document Verification"])
        elif days_remaining <= 30:
            status = "UNDER_PROCESSING"
            stage = random.choice(["Officer Review", "Document Verification"])
        else:
            status = random.choice(["REGISTERED", "UNDER_SCRUTINY", "FORWARDED", "UNDER_PROCESSING"])
            stage = random.choice(STAGES[:5])

        # ~10% disposed
        if i % 10 == 0 and i > 0:
            status = "DISPOSED"
            stage = "Closure"

        officer = random.choice(OFFICERS)

        case_row = {
            "id": str(uuid.uuid4()),
            "file_number": file_number,
            "title": f"[DEMO] {subject}",
            "subject": case_number,
            "case_type": "Litigation",
            "department": dept["name"],
            "section": f"{dept['code']} Section",
            "current_stage": stage,
            "status": status,
            "applicant": f"Demo Petitioner {i+1}",
            "assigned_officer": officer,
            "current_desk": f"DESK-{dept['code']}-{random.randint(1,5):02d}",
            "flagged_for_review": random.random() < 0.1,
            "statutory_deadline_days": limit_days,
            "court": random.choice(COURTS),
            "order_date": order_date,
            "received_date": received_date,
            "limitation_days": limit_days,
            "limitation_deadline": limitation_deadline,
            "document_ids": [],
            "created_at": created_at,
            "updated_at": created_at,
        }

        result = supabase.table("cases").insert(case_row).execute()
        if result.data:
            case_id = result.data[0]["id"]

            # Add a movement record for non-initial stages
            if stage != "Application Received":
                supabase.table("case_movements").insert({
                    "case_id": case_id,
                    "from_stage": "Application Received",
                    "to_stage": stage,
                    "assigned_to": officer,
                    "remarks": "[DEMO] Forwarded during initial processing.",
                    "started_at": created_at,
                    "status": "FORWARDED",
                }).execute()

            # Add alert for critical cases
            if days_remaining < 0:
                supabase.table("alerts").insert({
                    "case_id": case_id,
                    "type": "OVERDUE",
                    "severity": "CRITICAL",
                    "message": f"[DEMO] Limitation deadline has passed by {abs(days_remaining)} day(s).",
                    "due_date": limitation_deadline,
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
            elif days_remaining <= 7:
                supabase.table("alerts").insert({
                    "case_id": case_id,
                    "type": "DEADLINE_7D",
                    "severity": "HIGH",
                    "message": f"[DEMO] Critical: Only {days_remaining} day(s) remaining.",
                    "due_date": limitation_deadline,
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }).execute()

            # Add audit log
            supabase.table("audit_logs").insert({
                "officer_id": "seed-script",
                "officer_name": officer,
                "action": "FILE_REGISTERED",
                "file_id": case_id,
                "file_number": file_number,
                "new_state": "REGISTERED",
                "ip_address": "127.0.0.1",
                "terminal_id": "SEED-001",
                "remarks": "[DEMO DATA] Seeded by seed.py",
                "created_at": created_at,
            }).execute()

            inserted += 1

    print(f"  ✓ {inserted} cases seeded")


def main():
    print("=" * 60)
    print("GOIP Government File Tracking System — Demo Data Seeder")
    print("NOTE: All data generated is DEMO DATA for SIH prototype.")
    print("=" * 60)

    seed_departments()
    seed_cases(40)

    print("=" * 60)
    print("Seed complete. The following was created:")
    print(f"  • {len(DEMO_DEPARTMENTS)} departments")
    print(f"  • ~40 litigation cases with varied deadlines")
    print(f"  • Movement records for non-initial-stage cases")
    print(f"  • Alerts for critical/overdue cases")
    print(f"  • Audit log entries")
    print("=" * 60)
    print("⚠  All data is labelled [DEMO] and is NOT real government data.")


if __name__ == "__main__":
    main()
