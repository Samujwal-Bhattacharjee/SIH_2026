# -*- coding: utf-8 -*-
"""
Demo Data Seed Script (Idempotent)
==================================
Generates realistic government litigation records for demonstration.
Fully idempotent: safe to run multiple times without duplicating or crashing.

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
from datetime import datetime, timedelta, timezone, date
from typing import Dict, Any, List, Set, Tuple

# Add backend root to path
sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))  # Ensure .env is found

from dotenv import load_dotenv
load_dotenv()

from app.core.database import get_supabase
from app.services.deadline_service import calculate_deadline

supabase = get_supabase()

# Set deterministic random seed for reproducible demo data
random.seed(42)

# ============================================================
# STATS TRACKER
# ============================================================
class SeedStats:
    def __init__(self):
        self.stats: Dict[str, Dict[str, int]] = {
            "departments": {"inserted": 0, "skipped": 0},
            "cases": {"inserted": 0, "skipped": 0},
            "case_movements": {"inserted": 0, "skipped": 0},
            "alerts": {"inserted": 0, "skipped": 0},
            "audit_logs": {"inserted": 0, "skipped": 0},
            "documents": {"inserted": 0, "skipped": 0},
            "legal_opinions": {"inserted": 0, "skipped": 0},
            "case_actions": {"inserted": 0, "skipped": 0},
            "users": {"inserted": 0, "skipped": 0},
        }

    def record_inserted(self, entity: str, count: int = 1):
        if entity in self.stats:
            self.stats[entity]["inserted"] += count

    def record_skipped(self, entity: str, count: int = 1):
        if entity in self.stats:
            self.stats[entity]["skipped"] += count

    def get_summary(self) -> Dict[str, Dict[str, int]]:
        return self.stats


stats = SeedStats()

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
    ("Writ Appeal - Land Acquisition Compensation Challenge",      "WA",  90),
    ("Writ Petition - Building Plan Regularisation",               "WP",  60),
    ("Civil Appeal - Revenue Dispute",                             "CA",  120),
    ("Contempt Petition - Municipal Services Compliance",          "CP",  30),
    ("Public Interest Litigation - Forest Encroachment",           "PIL", 90),
    ("Original Application - Service Matter (Promotion)",          "OA",  90),
    ("Writ Petition - Environmental Clearance",                    "WP",  60),
    ("Review Petition - Land Title Dispute",                       "RP",  30),
    ("Civil Revision Petition - Tenancy Dispute",                  "CRP", 90),
    ("Special Leave Petition - Road Alignment Dispute",            "SLP", 60),
]


def random_date(days_ago_min: int, days_ago_max: int) -> str:
    """Generate a random past date within the given range."""
    delta = random.randint(days_ago_min, days_ago_max)
    dt = datetime.now(timezone.utc) - timedelta(days=delta)
    return dt.date().isoformat()


# ============================================================
# 1. DEPARTMENTS SEEDING (Idempotent on code & name)
# ============================================================
def seed_departments():
    print("Checking & seeding departments...")
    # Fetch existing departments to prevent duplicate key errors
    res = supabase.table("departments").select("id, code, name").execute()
    existing_depts = res.data or []
    existing_codes = {d["code"] for d in existing_depts if d.get("code")}
    existing_names = {d["name"] for d in existing_depts if d.get("name")}

    for dept in DEMO_DEPARTMENTS:
        if dept["code"] in existing_codes or dept["name"] in existing_names:
            stats.record_skipped("departments")
        else:
            supabase.table("departments").insert(dept).execute()
            existing_codes.add(dept["code"])
            existing_names.add(dept["name"])
            stats.record_inserted("departments")

    print(f"  [OK] Departments: {stats.stats['departments']['inserted']} inserted, {stats.stats['departments']['skipped']} skipped (already present)")


# ============================================================
# 2. CASES & RELATED WORKFLOW DATA SEEDING (Idempotent on file_number)
# ============================================================
def seed_cases(count: int = 40):
    print(f"Checking & seeding up to {count} demo cases and related records...")

    # Query all existing records to ensure global idempotency
    existing_cases_res = supabase.table("cases").select("id, file_number, current_stage, created_at, assigned_officer, limitation_deadline").execute()
    existing_cases = existing_cases_res.data or []
    cases_by_fn: Dict[str, Dict[str, Any]] = {c["file_number"]: c for c in existing_cases if c.get("file_number")}

    existing_movements_res = supabase.table("case_movements").select("id, case_id, to_stage").execute()
    existing_movements: Set[Tuple[str, str]] = {
        (m["case_id"], m["to_stage"]) for m in (existing_movements_res.data or []) if m.get("case_id") and m.get("to_stage")
    }

    existing_alerts_res = supabase.table("alerts").select("id, case_id, type").execute()
    existing_alerts: Set[Tuple[str, str]] = {
        (a["case_id"], a["type"]) for a in (existing_alerts_res.data or []) if a.get("case_id") and a.get("type")
    }

    existing_logs_res = supabase.table("audit_logs").select("id, file_number, action").execute()
    existing_logs: Set[Tuple[str, str]] = {
        (l["file_number"], l["action"]) for l in (existing_logs_res.data or []) if l.get("file_number") and l.get("action")
    }

    for i in range(count):
        dept = DEMO_DEPARTMENTS[i % len(DEMO_DEPARTMENTS)]
        subject, prefix, limit_days = CASE_SUBJECTS[i % len(CASE_SUBJECTS)]
        year = 2026 if i % 4 != 0 else 2025
        seq = 1000 + (i * 137) % 8900
        case_number = f"{prefix} {seq}/{year}"
        file_number = f"GFT/{dept['code']}/2026/{i+1:06d}"

        days_ago = ((i * 11) % 160) + 10
        received_dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
        received_date = received_dt.date().isoformat()
        order_date = (received_dt - timedelta(days=(i % 20) + 5)).date().isoformat()

        limitation_deadline = calculate_deadline(received_date, limit_days)
        created_at = received_dt.isoformat()

        deadline_date = date.fromisoformat(limitation_deadline)
        today = date.today()
        days_remaining = (deadline_date - today).days

        if days_remaining < 0:
            status = "OVERDUE"
            stage = "Legal Review" if i % 2 == 0 else "Officer Review"
        elif days_remaining <= 7:
            status = "AT_RISK"
            stage = "Legal Review" if i % 2 == 0 else "Document Verification"
        elif days_remaining <= 30:
            status = "UNDER_PROCESSING"
            stage = "Officer Review" if i % 2 == 0 else "Document Verification"
        else:
            status = STATUSES[i % 5]
            stage = STAGES[i % 5]

        if i % 10 == 0 and i > 0:
            status = "DISPOSED"
            stage = "Closure"

        officer = OFFICERS[i % len(OFFICERS)]
        court = COURTS[i % len(COURTS)]

        # Check if case already exists
        if file_number in cases_by_fn:
            existing_case = cases_by_fn[file_number]
            case_id = existing_case["id"]
            stats.record_skipped("cases")
            # Use existing stage and officer for movement/alert checks
            stage = existing_case.get("current_stage") or stage
            officer = existing_case.get("assigned_officer") or officer
            created_at = existing_case.get("created_at") or created_at
            limitation_deadline = existing_case.get("limitation_deadline") or limitation_deadline
            if limitation_deadline:
                days_remaining = (date.fromisoformat(limitation_deadline) - today).days
        else:
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
            res = supabase.table("cases").insert(case_row).execute()
            if res.data:
                case_id = res.data[0]["id"]
                cases_by_fn[file_number] = res.data[0]
                stats.record_inserted("cases")
            else:
                continue

        # Case Movement idempotency check
        if stage != "Application Received":
            if (case_id, stage) in existing_movements:
                stats.record_skipped("case_movements")
            else:
                supabase.table("case_movements").insert({
                    "case_id": case_id,
                    "from_stage": "Application Received",
                    "to_stage": stage,
                    "assigned_to": officer,
                    "remarks": "[DEMO] Forwarded during initial processing.",
                    "started_at": created_at,
                    "status": "FORWARDED",
                }).execute()
                existing_movements.add((case_id, stage))
                stats.record_inserted("case_movements")

        # Alerts idempotency check
        if days_remaining < 0:
            if (case_id, "OVERDUE") in existing_alerts:
                stats.record_skipped("alerts")
            else:
                supabase.table("alerts").insert({
                    "case_id": case_id,
                    "type": "OVERDUE",
                    "severity": "CRITICAL",
                    "message": f"[DEMO] Limitation deadline has passed by {abs(days_remaining)} day(s).",
                    "due_date": limitation_deadline,
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
                existing_alerts.add((case_id, "OVERDUE"))
                stats.record_inserted("alerts")
        elif days_remaining <= 7:
            if (case_id, "DEADLINE_7D") in existing_alerts:
                stats.record_skipped("alerts")
            else:
                supabase.table("alerts").insert({
                    "case_id": case_id,
                    "type": "DEADLINE_7D",
                    "severity": "HIGH",
                    "message": f"[DEMO] Critical: Only {days_remaining} day(s) remaining.",
                    "due_date": limitation_deadline,
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
                existing_alerts.add((case_id, "DEADLINE_7D"))
                stats.record_inserted("alerts")

        # Audit Log idempotency check
        if (file_number, "FILE_REGISTERED") in existing_logs:
            stats.record_skipped("audit_logs")
        else:
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
            existing_logs.add((file_number, "FILE_REGISTERED"))
            stats.record_inserted("audit_logs")

    print(f"  [OK] Cases: {stats.stats['cases']['inserted']} inserted, {stats.stats['cases']['skipped']} skipped")
    print(f"  [OK] Case Movements: {stats.stats['case_movements']['inserted']} inserted, {stats.stats['case_movements']['skipped']} skipped")
    print(f"  [OK] Alerts: {stats.stats['alerts']['inserted']} inserted, {stats.stats['alerts']['skipped']} skipped")
    print(f"  [OK] Audit Logs: {stats.stats['audit_logs']['inserted']} inserted, {stats.stats['audit_logs']['skipped']} skipped")


# ============================================================
# 3. DEMO DOCUMENTS SEEDING (Idempotent on case_id & file_name)
# ============================================================
def seed_documents():
    print("Checking & seeding demo documents...")
    existing_docs_res = supabase.table("documents").select("id, case_id, file_name").execute()
    existing_docs: Set[Tuple[str, str]] = {
        (d["case_id"], d["file_name"]) for d in (existing_docs_res.data or []) if d.get("case_id") and d.get("file_name")
    }

    # Fetch cases in Document Verification or Legal Review
    cases_res = supabase.table("cases").select("id, file_number, department, title").execute()
    cases = cases_res.data or []

    # Seed sample court order & affidavit documents for first 5 cases
    for case in cases[:5]:
        case_id = case["id"]
        doc_name = f"Court_Order_{case.get('file_number', '001').replace('/', '_')}.pdf"

        if (case_id, doc_name) in existing_docs:
            stats.record_skipped("documents")
        else:
            sample_doc = {
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "file_name": doc_name,
                "storage_path": f"demo-orders/{doc_name}",
                "file_url": f"https://example.gov.in/docs/{doc_name}",
                "file_type": "application/pdf",
                "file_size": 245760,
                "document_type": "Court Order",
                "page_count": 3,
                "ocr_status": "COMPLETED",
                "extracted_text": (
                    f"IN THE HIGH COURT OF KARNATAKA AT BENGALURU\n"
                    f"IN THE MATTER OF: {case.get('title', 'Demo Case')}\n"
                    f"ORDER DATED: 2026-02-10\n"
                    f"The respondent department is directed to file counter-affidavit within limitation period."
                ),
                "extracted_fields": [
                    {"key": "court", "label": "Court Name", "value": "High Court of Karnataka", "confidence": 0.95, "isExtracted": True},
                    {"key": "caseNumber", "label": "Case Number", "value": case.get("file_number", ""), "confidence": 0.92, "isExtracted": True},
                    {"key": "limitationDays", "label": "Limitation Period", "value": "90", "confidence": 0.88, "isExtracted": True}
                ],
                "uploaded_by": "System Seeder",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            supabase.table("documents").insert(sample_doc).execute()
            existing_docs.add((case_id, doc_name))
            stats.record_inserted("documents")

    print(f"  [OK] Documents: {stats.stats['documents']['inserted']} inserted, {stats.stats['documents']['skipped']} skipped")


# ============================================================
# 4. LEGAL OPINIONS SEEDING (Idempotent on case_id)
# ============================================================
def seed_legal_opinions():
    print("Checking & seeding demo legal opinions...")
    existing_opinions_res = supabase.table("legal_opinions").select("id, case_id").execute()
    existing_case_ids: Set[str] = {o["case_id"] for o in (existing_opinions_res.data or []) if o.get("case_id")}

    # Fetch cases currently in Legal Review
    cases_res = supabase.table("cases").select("id, file_number, assigned_officer, limitation_deadline").eq("current_stage", "Legal Review").execute()
    legal_cases = cases_res.data or []

    for case in legal_cases:
        case_id = case["id"]
        if case_id in existing_case_ids:
            stats.record_skipped("legal_opinions")
        else:
            opinion_row = {
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "assigned_to": case.get("assigned_officer") or "Standing Counsel, High Court",
                "requested_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
                "due_date": case.get("limitation_deadline") or (date.today() + timedelta(days=10)).isoformat(),
                "status": "REQUESTED",
                "remarks": "[DEMO] Referral for legal vetting and draft counter statement.",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            supabase.table("legal_opinions").insert(opinion_row).execute()
            existing_case_ids.add(case_id)
            stats.record_inserted("legal_opinions")

    print(f"  [OK] Legal Opinions: {stats.stats['legal_opinions']['inserted']} inserted, {stats.stats['legal_opinions']['skipped']} skipped")


# ============================================================
# 5. CASE ACTIONS SEEDING (Idempotent on case_id & action_type)
# ============================================================
def seed_case_actions():
    print("Checking & seeding demo case actions...")
    existing_actions_res = supabase.table("case_actions").select("id, case_id, action_type").execute()
    existing_actions: Set[Tuple[str, str]] = {
        (a["case_id"], a["action_type"]) for a in (existing_actions_res.data or []) if a.get("case_id") and a.get("action_type")
    }

    cases_res = supabase.table("cases").select("id").limit(5).execute()
    sample_cases = cases_res.data or []

    for case in sample_cases:
        case_id = case["id"]
        action_type = "INITIAL_SCRUTINY_PASSED"
        if (case_id, action_type) in existing_actions:
            stats.record_skipped("case_actions")
        else:
            supabase.table("case_actions").insert({
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "action_type": action_type,
                "remarks": "[DEMO] Initial file scrutiny passed without objections.",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            existing_actions.add((case_id, action_type))
            stats.record_inserted("case_actions")

    print(f"  [OK] Case Actions: {stats.stats['case_actions']['inserted']} inserted, {stats.stats['case_actions']['skipped']} skipped")


# ============================================================
# MAIN ENTRYPOINT
# ============================================================
def main():
    print("=" * 70)
    print("GOIP Government File Tracking System -- Idempotent Demo Data Seeder")
    print("NOTE: All data generated is DEMO DATA for SIH prototype.")
    print("=" * 70)

    # 1. Departments
    seed_departments()

    # 2. Cases & Workflow (Movements, Alerts, Audit Logs)
    seed_cases(40)

    # 3. Documents
    seed_documents()

    # 4. Legal Opinions
    seed_legal_opinions()

    # 5. Case Actions
    seed_case_actions()

    # Verify final counts from Supabase
    print("=" * 70)
    print("SEEDING SUMMARY & DATABASE VERIFICATION:")
    print("=" * 70)
    print(f"{'Table Name':<20} | {'Inserted':<10} | {'Skipped':<10} | {'Current Total in DB':<20}")
    print("-" * 70)

    summary = stats.get_summary()
    for table_name, counts in summary.items():
        try:
            db_res = supabase.table(table_name).select("id", count="exact").execute()
            total_db = db_res.count if db_res.count is not None else len(db_res.data or [])
        except Exception:
            total_db = "N/A"
        print(f"{table_name:<20} | {counts['inserted']:<10} | {counts['skipped']:<10} | {str(total_db):<20}")

    print("=" * 70)
    print("Status: SUCCESS - Seed completed without exceptions.")
    print("Integrity: Existing data preserved; no duplicate key violations.")
    print("=" * 70)


if __name__ == "__main__":
    main()
