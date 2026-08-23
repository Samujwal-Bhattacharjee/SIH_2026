"""
Persistent Procurement Store (SIH26100)
========================================
SQLite-backed persistent repository for procurement data that matches the exact
relational schema defined in `procurement_schema.sql`.

Guarantees:
- All writes persist to disk (`backend/procurement.db`).
- Data survives FastAPI restarts, frontend restarts, and browser refreshes.
- Thread-safe connection handling.
- Full JSON serialization for extracted fields and metadata.
"""
import os
import json
import sqlite3
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from contextlib import contextmanager

from app.services.procurement_service import DEFAULT_TENDER_REQUIREMENTS

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "procurement.db")


@contextmanager
def get_db():
    """Provide a transactional scope around a series of operations."""
    conn = sqlite3.connect(DB_PATH, timeout=20.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    """Convert an sqlite3.Row to a standard python dict with JSON deserialization."""
    if row is None:
        return None
    d = dict(row)
    for json_field in ("extracted_fields", "metadata"):
        if json_field in d and d[json_field] is not None:
            if isinstance(d[json_field], str):
                try:
                    d[json_field] = json.loads(d[json_field])
                except Exception:
                    pass
    return d


def rows_to_list(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    """Convert a list of sqlite3.Rows to standard python dicts."""
    return [row_to_dict(r) for r in rows if r is not None]


def init_db():
    """Create all procurement tables if they do not exist, and seed baseline data."""
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS tenders (
            id                  TEXT PRIMARY KEY,
            case_id             TEXT,
            tender_number       TEXT NOT NULL UNIQUE,
            title               TEXT NOT NULL,
            department          TEXT NOT NULL,
            description         TEXT,
            bid_closing_date    TEXT,
            estimated_value     REAL,
            category            TEXT DEFAULT 'General',
            status              TEXT NOT NULL DEFAULT 'ACTIVE',
            local_content_class TEXT DEFAULT 'CLASS_I',
            created_by          TEXT,
            created_at          TEXT NOT NULL,
            updated_at          TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
        CREATE INDEX IF NOT EXISTS idx_tenders_number ON tenders(tender_number);

        CREATE TABLE IF NOT EXISTS tender_requirements (
            id                  TEXT PRIMARY KEY,
            tender_id           TEXT NOT NULL,
            requirement_id      TEXT NOT NULL,
            name                TEXT NOT NULL,
            category            TEXT NOT NULL,
            is_mandatory        INTEGER NOT NULL DEFAULT 1,
            description         TEXT,
            verification_rule   TEXT,
            threshold_value     REAL,
            threshold_unit      TEXT,
            weight              REAL DEFAULT 1.0,
            created_at          TEXT NOT NULL,
            FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tender_req_tender_id ON tender_requirements(tender_id);

        CREATE TABLE IF NOT EXISTS bidders (
            id                  TEXT PRIMARY KEY,
            tender_id           TEXT NOT NULL,
            legal_name          TEXT NOT NULL,
            trade_name          TEXT,
            gstin               TEXT,
            pan                 TEXT,
            udyam_number        TEXT,
            cin                 TEXT,
            registered_address  TEXT,
            contact_email       TEXT,
            contact_phone       TEXT,
            enterprise_category TEXT,
            status              TEXT NOT NULL DEFAULT 'PENDING_DOCUMENTS',
            compliance_score    REAL DEFAULT 0,
            risk_level          TEXT DEFAULT 'MEDIUM',
            officer_decision    TEXT,
            officer_note        TEXT,
            decided_at          TEXT,
            decided_by          TEXT,
            created_at          TEXT NOT NULL,
            updated_at          TEXT NOT NULL,
            FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_bidders_tender_id ON bidders(tender_id);
        CREATE INDEX IF NOT EXISTS idx_bidders_status ON bidders(status);
        CREATE INDEX IF NOT EXISTS idx_bidders_gstin ON bidders(gstin);

        CREATE TABLE IF NOT EXISTS documents (
            id                  TEXT PRIMARY KEY,
            case_id             TEXT,
            file_name           TEXT NOT NULL,
            storage_path        TEXT,
            file_url            TEXT,
            file_type           TEXT NOT NULL,
            file_size           INTEGER NOT NULL DEFAULT 0,
            document_type       TEXT,
            page_count          INTEGER DEFAULT 0,
            ocr_status          TEXT NOT NULL DEFAULT 'PENDING',
            extracted_text      TEXT,
            extracted_fields    TEXT,
            ocr_engine          TEXT,
            ocr_confidence      REAL,
            error_message       TEXT,
            processed_at        TEXT,
            uploaded_by         TEXT,
            created_at          TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bidder_documents (
            id                  TEXT PRIMARY KEY,
            bidder_id           TEXT NOT NULL,
            document_id         TEXT NOT NULL,
            document_type       TEXT,
            is_primary          INTEGER DEFAULT 0,
            created_at          TEXT NOT NULL,
            UNIQUE (bidder_id, document_id),
            FOREIGN KEY (bidder_id) REFERENCES bidders(id) ON DELETE CASCADE,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_bidder_docs_bidder_id ON bidder_documents(bidder_id);

        CREATE TABLE IF NOT EXISTS compliance_results (
            id                  TEXT PRIMARY KEY,
            bidder_id           TEXT NOT NULL,
            tender_id           TEXT NOT NULL,
            requirement_id      TEXT NOT NULL,
            requirement_name    TEXT NOT NULL,
            category            TEXT NOT NULL,
            status              TEXT NOT NULL DEFAULT 'PENDING',
            severity            TEXT NOT NULL DEFAULT 'MEDIUM',
            score               REAL DEFAULT 0,
            evidence_doc_id     TEXT,
            evidence_field_key  TEXT,
            evidence_value      TEXT,
            confidence          REAL,
            reason              TEXT,
            verified_at         TEXT,
            updated_at          TEXT,
            FOREIGN KEY (bidder_id) REFERENCES bidders(id) ON DELETE CASCADE,
            FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_compliance_bidder_id ON compliance_results(bidder_id);

        CREATE TABLE IF NOT EXISTS discrepancies (
            id                  TEXT PRIMARY KEY,
            bidder_id           TEXT NOT NULL,
            discrepancy_type    TEXT NOT NULL,
            severity            TEXT NOT NULL DEFAULT 'MEDIUM',
            field_name          TEXT NOT NULL,
            expected_value      TEXT,
            found_value         TEXT,
            source_doc_1_id     TEXT,
            source_doc_2_id     TEXT,
            description         TEXT NOT NULL,
            recommendation      TEXT,
            is_resolved         INTEGER DEFAULT 0,
            resolved_by         TEXT,
            resolved_at         TEXT,
            created_at          TEXT NOT NULL,
            FOREIGN KEY (bidder_id) REFERENCES bidders(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_discrepancies_bidder_id ON discrepancies(bidder_id);

        CREATE TABLE IF NOT EXISTS bidder_audit_events (
            id                  TEXT PRIMARY KEY,
            tender_id           TEXT,
            bidder_id           TEXT,
            document_id         TEXT,
            action              TEXT NOT NULL,
            actor               TEXT NOT NULL DEFAULT 'System',
            actor_user_id       TEXT,
            description         TEXT,
            metadata            TEXT,
            created_at          TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_bidder_audit_created ON bidder_audit_events(created_at DESC);
        """)

        # Check if database is empty and needs initial seeding
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tenders")
        if cur.fetchone()[0] == 0:
            seed_initial_data(conn)


def seed_initial_data(conn: sqlite3.Connection):
    """Seed baseline tender, requirements, bidders, and audit log."""
    now = datetime.now(timezone.utc).isoformat()
    tender_id = "TEN-2026-001"

    # 1. Tender
    conn.execute("""
        INSERT INTO tenders (id, tender_number, title, department, description, bid_closing_date, estimated_value, category, status, local_content_class, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tender_id,
        "GEM/2026/B/418207",
        "Supply and Installation of Network Infrastructure for Government Administrative Offices",
        "Department of Administrative Reforms",
        "Procurement of enterprise-grade switches, routers, security gateways, and structured cabling.",
        "2026-08-30",
        45000000.00,
        "Network Infrastructure",
        "ACTIVE",
        "CLASS_I",
        now,
        now
    ))

    # 2. Requirements
    for req in DEFAULT_TENDER_REQUIREMENTS:
        conn.execute("""
            INSERT INTO tender_requirements (id, tender_id, requirement_id, name, category, is_mandatory, description, verification_rule, weight, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            tender_id,
            req["requirement_id"],
            req["name"],
            req["category"],
            1 if req.get("is_mandatory", True) else 0,
            req.get("description", ""),
            req.get("verification_rule", ""),
            req.get("weight", 1.0),
            now
        ))

    # 3. Bidders
    bidders_seed = [
        ("BID-001", tender_id, "Triveni Infotech Solutions Pvt. Ltd.", "27AABCT4180Q1ZV", "AABCT4180Q", "UDYAM-MH-19-0042186", "UNDER_REVIEW", 87.0, "LOW"),
        ("BID-002", tender_id, "Narmada Systems & Services Pvt. Ltd.", "33AABCN8821R1Z8", "AABCN8821R", None, "EXCEPTION_FOUND", 54.0, "HIGH"),
        ("BID-003", tender_id, "Vindhya Digital Technologies LLP", "07AABCV3319M1ZS", "AABCV3319M", "UDYAM-DL-02-0084920", "UNDER_REVIEW", 68.0, "MEDIUM"),
    ]
    for b_id, t_id, name, gstin, pan, udyam, st, sc, rk in bidders_seed:
        conn.execute("""
            INSERT INTO bidders (id, tender_id, legal_name, gstin, pan, udyam_number, status, compliance_score, risk_level, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (b_id, t_id, name, gstin, pan, udyam, st, sc, rk, now, now))

    # 4. Seed documents for BID-001 & BID-002
    sample_docs = [
        ("DOC-001-GST", "BID-001", "Triveni_GST_Certificate.pdf", "GST Certificate", [
            {"key": "gstin", "value": "27AABCT4180Q1ZV", "confidence": 0.96, "isExtracted": True},
            {"key": "legalName", "value": "Triveni Infotech Solutions Pvt. Ltd.", "confidence": 0.92, "isExtracted": True},
            {"key": "pan", "value": "AABCT4180Q", "confidence": 0.95, "isExtracted": True},
        ]),
        ("DOC-001-PAN", "BID-001", "Triveni_PAN_Card.pdf", "PAN Card", [
            {"key": "pan", "value": "AABCT4180Q", "confidence": 0.95, "isExtracted": True},
            {"key": "legalName", "value": "Triveni Infotech Solutions Pvt. Ltd.", "confidence": 0.90, "isExtracted": True},
        ]),
        ("DOC-001-UDYAM", "BID-001", "Triveni_Udyam_Registration.pdf", "Udyam/MSME Certificate", [
            {"key": "udyamNumber", "value": "UDYAM-MH-19-0042186", "confidence": 0.94, "isExtracted": True},
            {"key": "legalName", "value": "Triveni Infotech Solutions Pvt. Ltd.", "confidence": 0.91, "isExtracted": True},
        ]),
        ("DOC-002-GST", "BID-002", "Narmada_GSTN_Doc.pdf", "GST Certificate", [
            {"key": "gstin", "value": "33AABCN8821R1Z8", "confidence": 0.96, "isExtracted": True},
            {"key": "legalName", "value": "Narmada Systems Private Limited", "confidence": 0.90, "isExtracted": True},
        ]),
        ("DOC-002-PAN", "BID-002", "PAN_Card_Narmada.pdf", "PAN Card", [
            {"key": "pan", "value": "AABCN8821R", "confidence": 0.95, "isExtracted": True},
            {"key": "legalName", "value": "Narmada Services Limited", "confidence": 0.88, "isExtracted": True},
        ]),
        ("DOC-002-OEM", "BID-002", "Expired_OEM_Letter.pdf", "OEM Authorization", [
            {"key": "oemReference", "value": "MAF/2024/991", "confidence": 0.92, "isExtracted": True},
            {"key": "expiryDate", "value": "31/03/2025", "confidence": 0.95, "isExtracted": True},
        ]),
    ]
    for d_id, b_id, fname, dtype, fields in sample_docs:
        conn.execute("""
            INSERT INTO documents (id, file_name, file_type, file_size, document_type, ocr_status, extracted_fields, ocr_engine, ocr_confidence, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (d_id, fname, "application/pdf", 125000, dtype, "COMPLETED", json.dumps(fields), "PyMuPDF + Regex Parser", 0.95, now))
        conn.execute("""
            INSERT INTO bidder_documents (id, bidder_id, document_id, document_type, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), b_id, d_id, dtype, now))

    # 5. Discrepancies for BID-002
    conn.execute("""
        INSERT INTO discrepancies (id, bidder_id, discrepancy_type, severity, field_name, expected_value, found_value, description, recommendation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        str(uuid.uuid4()),
        "BID-002",
        "NAME_MISMATCH",
        "HIGH",
        "legalName",
        "Narmada Systems Private Limited",
        "Narmada Services Limited",
        "Legal entity name inconsistency between GST certificate and PAN card.",
        "Request clarification from bidder regarding official registered name.",
        now
    ))

    # 6. Audit logs
    audit_seeds = [
        (tender_id, "BID-001", "Tender registered", "Procurement Officer", "GEM/2026/B/418207 created with 7 statutory criteria."),
        (tender_id, "BID-001", "OCR & Verification Completed", "Verification Engine", "GST, PAN, Udyam extracted for Triveni Infotech Solutions Pvt. Ltd."),
        (tender_id, "BID-002", "Discrepancy Flagged", "Cross-Document Engine", "Legal name mismatch and expired OEM authorization detected for Narmada Systems."),
    ]
    for t_id, b_id, act, actor, desc in audit_seeds:
        conn.execute("""
            INSERT INTO bidder_audit_events (id, tender_id, bidder_id, action, actor, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), t_id, b_id, act, actor, desc, now))

    logger.info("Procurement persistent database initialized with baseline data.")


# ============================================================
# TENDER REPOSITORY
# ============================================================

def get_tenders() -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM tenders ORDER BY created_at DESC").fetchall()
        return rows_to_list(rows)


def get_tender_by_id(tender_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        row = conn.execute("SELECT * FROM tenders WHERE id = ? OR tender_number = ?", (tender_id, tender_id)).fetchone()
        return row_to_dict(row)


def create_tender_record(data: Dict[str, Any]) -> Dict[str, Any]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    t_id = data.get("id") or f"TEN-{datetime.now().strftime('%Y%m')}-{datetime.now().microsecond % 9000 + 1000}"
    t_num = data.get("tender_number") or f"GEM/{datetime.now().year}/B/{datetime.now().microsecond % 900000 + 100000}"

    with get_db() as conn:
        conn.execute("""
            INSERT INTO tenders (id, tender_number, title, department, description, bid_closing_date, estimated_value, category, status, local_content_class, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t_id,
            t_num,
            data.get("title", "Procurement Tender"),
            data.get("department", "Department of Administrative Reforms"),
            data.get("description", ""),
            data.get("bid_closing_date", "2026-09-15"),
            data.get("estimated_value", 10000000.00),
            data.get("category", "General Procurement"),
            data.get("status", "ACTIVE"),
            data.get("local_content_class", "CLASS_I"),
            data.get("created_by", ""),
            now,
            now
        ))

        # Add requirements
        for req in DEFAULT_TENDER_REQUIREMENTS:
            conn.execute("""
                INSERT INTO tender_requirements (id, tender_id, requirement_id, name, category, is_mandatory, description, verification_rule, weight, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()),
                t_id,
                req["requirement_id"],
                req["name"],
                req["category"],
                1 if req.get("is_mandatory", True) else 0,
                req.get("description", ""),
                req.get("verification_rule", ""),
                req.get("weight", 1.0),
                now
            ))

    return get_tender_by_id(t_id)


def get_tender_requirements(tender_id: str) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM tender_requirements WHERE tender_id = ? ORDER BY created_at", (tender_id,)).fetchall()
        return rows_to_list(rows)


# ============================================================
# BIDDER REPOSITORY
# ============================================================

def get_bidders(tender_id: Optional[str] = None) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        if tender_id and tender_id != "ALL":
            rows = conn.execute("SELECT * FROM bidders WHERE tender_id = ? ORDER BY created_at", (tender_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM bidders ORDER BY created_at").fetchall()

        bidders = rows_to_list(rows)
        # Hydrate document counts and exception counts
        for b in bidders:
            b_id = b["id"]
            doc_count = conn.execute("SELECT COUNT(*) FROM bidder_documents WHERE bidder_id = ?", (b_id,)).fetchone()[0]
            exc_count = conn.execute("SELECT COUNT(*) FROM discrepancies WHERE bidder_id = ? AND is_resolved = 0", (b_id,)).fetchone()[0]
            b["documents_count"] = doc_count
            b["exceptions_count"] = exc_count
        return bidders


def get_bidder_by_id(bidder_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        row = conn.execute("SELECT * FROM bidders WHERE id = ?", (bidder_id,)).fetchone()
        if not row:
            return None
        b = row_to_dict(row)
        b["documents_count"] = conn.execute("SELECT COUNT(*) FROM bidder_documents WHERE bidder_id = ?", (bidder_id,)).fetchone()[0]
        b["exceptions_count"] = conn.execute("SELECT COUNT(*) FROM discrepancies WHERE bidder_id = ? AND is_resolved = 0", (bidder_id,)).fetchone()[0]
        return b


def create_bidder_record(tender_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM bidders").fetchone()[0]
        bidder_id = data.get("id") or f"BID-{str(count + 1).zfill(3)}"

        conn.execute("""
            INSERT INTO bidders (id, tender_id, legal_name, trade_name, gstin, pan, udyam_number, status, compliance_score, risk_level, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            bidder_id,
            tender_id,
            data.get("legal_name", "Bidder"),
            data.get("trade_name"),
            data.get("gstin"),
            data.get("pan"),
            data.get("udyam_number"),
            data.get("status", "PENDING_DOCUMENTS"),
            data.get("compliance_score", 0.0),
            data.get("risk_level", "MEDIUM"),
            now,
            now
        ))

    return get_bidder_by_id(bidder_id)


def update_bidder_record(bidder_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now

    fields = [f"{k} = ?" for k in updates.keys()]
    values = list(updates.values()) + [bidder_id]

    with get_db() as conn:
        conn.execute(f"UPDATE bidders SET {', '.join(fields)} WHERE id = ?", values)

    return get_bidder_by_id(bidder_id)


# ============================================================
# DOCUMENT REPOSITORY
# ============================================================

def save_document_record(doc: Dict[str, Any]) -> Dict[str, Any]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    doc_id = doc.get("id") or f"DOC-{uuid.uuid4().hex[:8]}"

    fields_json = json.dumps(doc.get("extracted_fields", [])) if isinstance(doc.get("extracted_fields"), (list, dict)) else doc.get("extracted_fields")

    with get_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO documents (id, case_id, file_name, storage_path, file_url, file_type, file_size, document_type, page_count, ocr_status, extracted_text, extracted_fields, ocr_engine, ocr_confidence, error_message, processed_at, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            doc.get("case_id"),
            doc.get("file_name", "uploaded_document"),
            doc.get("storage_path"),
            doc.get("file_url"),
            doc.get("file_type", "application/pdf"),
            doc.get("file_size", 0),
            doc.get("document_type", "Other"),
            doc.get("page_count", 0),
            doc.get("ocr_status", "PENDING"),
            doc.get("extracted_text"),
            fields_json,
            doc.get("ocr_engine"),
            doc.get("ocr_confidence", 0.0),
            doc.get("error_message"),
            doc.get("processed_at"),
            doc.get("uploaded_by", "Officer"),
            doc.get("created_at") or now
        ))

    return get_document_by_id(doc_id)


def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        return row_to_dict(row)


def link_bidder_document(bidder_id: str, doc_id: str, doc_type: str) -> Dict[str, Any]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    link_id = f"LINK-{uuid.uuid4().hex[:8]}"
    with get_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO bidder_documents (id, bidder_id, document_id, document_type, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (link_id, bidder_id, doc_id, doc_type, now))
    return {"id": link_id, "bidder_id": bidder_id, "document_id": doc_id, "document_type": doc_type}


def get_bidder_documents(bidder_id: str) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        rows = conn.execute("""
            SELECT d.*, bd.document_type as linked_doc_type, bd.bidder_id
            FROM documents d
            JOIN bidder_documents bd ON d.id = bd.document_id
            WHERE bd.bidder_id = ?
            ORDER BY d.created_at DESC
        """, (bidder_id,)).fetchall()
        docs = rows_to_list(rows)
        for doc in docs:
            if doc.get("linked_doc_type"):
                doc["document_type"] = doc["linked_doc_type"]
        return docs


def get_all_procurement_documents(tender_id: Optional[str] = None, bidder_id: Optional[str] = None) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        query = """
            SELECT d.*, b.id as bidder_id, b.legal_name as bidder_name, b.tender_id, bd.document_type as linked_doc_type
            FROM documents d
            JOIN bidder_documents bd ON d.id = bd.document_id
            JOIN bidders b ON bd.bidder_id = b.id
        """
        params = []
        conditions = []
        if bidder_id:
            conditions.append("b.id = ?")
            params.append(bidder_id)
        if tender_id:
            conditions.append("b.tender_id = ?")
            params.append(tender_id)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY d.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        docs = rows_to_list(rows)
        for doc in docs:
            if doc.get("linked_doc_type"):
                doc["document_type"] = doc["linked_doc_type"]
        return docs


# ============================================================
# COMPLIANCE & DISCREPANCY REPOSITORY
# ============================================================

def save_compliance_assessment(bidder_id: str, tender_id: str, assessment: Dict[str, Any]):
    """Persist compliance check results and discrepancies in the database."""
    init_db()
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        # 1. Clean previous compliance results and discrepancies for this bidder
        conn.execute("DELETE FROM compliance_results WHERE bidder_id = ?", (bidder_id,))
        conn.execute("DELETE FROM discrepancies WHERE bidder_id = ?", (bidder_id,))

        # 2. Insert compliance check results
        for check in assessment.get("checks", []):
            conn.execute("""
                INSERT INTO compliance_results (id, bidder_id, tender_id, requirement_id, requirement_name, category, status, severity, score, evidence_doc_id, evidence_field_key, evidence_value, confidence, reason, verified_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()),
                bidder_id,
                tender_id,
                check.get("requirement_id", "UNKNOWN"),
                check.get("name") or check.get("requirement_name", "Requirement"),
                check.get("category", "STATUTORY"),
                check.get("status", "PENDING"),
                check.get("severity", "MEDIUM"),
                check.get("score", 0),
                check.get("evidence_doc_id"),
                check.get("evidence_field_key"),
                str(check.get("evidence_value") or ""),
                check.get("confidence", 0.0),
                check.get("reason") or check.get("description", ""),
                now,
                now
            ))

        # 3. Insert discrepancies
        for disc in assessment.get("discrepancies", []):
            conn.execute("""
                INSERT INTO discrepancies (id, bidder_id, discrepancy_type, severity, field_name, expected_value, found_value, source_doc_1_id, source_doc_2_id, description, recommendation, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()),
                bidder_id,
                disc.get("discrepancy_type", "INCONSISTENCY"),
                disc.get("severity", "MEDIUM"),
                disc.get("field_name", "Field"),
                disc.get("expected_value"),
                disc.get("found_value"),
                disc.get("source_doc_1_id"),
                disc.get("source_doc_2_id"),
                disc.get("description", "Discrepancy identified."),
                disc.get("recommendation", ""),
                now
            ))

        # 4. Update bidder score & risk
        risk = assessment.get("risk_level", "MEDIUM")
        status_val = "EXCEPTION_FOUND" if risk in ("HIGH", "CRITICAL") else "UNDER_REVIEW"
        conn.execute("""
            UPDATE bidders
            SET compliance_score = ?, risk_level = ?, status = ?, updated_at = ?
            WHERE id = ?
        """, (
            assessment.get("compliance_score", 0.0),
            risk,
            status_val,
            now,
            bidder_id
        ))


def get_compliance_results(bidder_id: str) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM compliance_results WHERE bidder_id = ? ORDER BY requirement_name", (bidder_id,)).fetchall()
        return rows_to_list(rows)


def get_discrepancies(bidder_id: str) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM discrepancies WHERE bidder_id = ? AND is_resolved = 0", (bidder_id,)).fetchall()
        return rows_to_list(rows)


# ============================================================
# AUDIT TRAIL REPOSITORY
# ============================================================

def log_audit_event(
    action: str,
    actor: str,
    tender_id: Optional[str] = None,
    bidder_id: Optional[str] = None,
    document_id: Optional[str] = None,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    actor_user_id: Optional[str] = None
) -> Dict[str, Any]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    audit_id = f"AUD-{uuid.uuid4().hex[:8]}"

    meta_str = json.dumps(metadata) if metadata else None

    with get_db() as conn:
        conn.execute("""
            INSERT INTO bidder_audit_events (id, tender_id, bidder_id, document_id, action, actor, actor_user_id, description, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            audit_id,
            tender_id,
            bidder_id,
            document_id,
            action,
            actor,
            actor_user_id,
            description or "",
            meta_str,
            now
        ))

    return {
        "id": audit_id,
        "tender_id": tender_id,
        "bidder_id": bidder_id,
        "document_id": document_id,
        "action": action,
        "actor": actor,
        "description": description,
        "created_at": now
    }


def get_audit_trail(tender_id: Optional[str] = None, bidder_id: Optional[str] = None) -> List[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        query = "SELECT * FROM bidder_audit_events"
        params = []
        conds = []
        if bidder_id:
            conds.append("bidder_id = ?")
            params.append(bidder_id)
        if tender_id:
            conds.append("tender_id = ?")
            params.append(tender_id)

        if conds:
            query += " WHERE " + " AND ".join(conds)

        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return rows_to_list(rows)


# ============================================================
# DASHBOARD AGGREGATES
# ============================================================

def get_dashboard_summary() -> Dict[str, Any]:
    init_db()
    with get_db() as conn:
        tenders = rows_to_list(conn.execute("SELECT * FROM tenders").fetchall())
        bidders = get_bidders()
        discrepancies = conn.execute("SELECT COUNT(*) FROM discrepancies WHERE is_resolved = 0").fetchone()[0]

        reviewing_statuses = {"PENDING_DOCUMENTS", "UNDER_REVIEW", "EXCEPTION_FOUND", "Under Review", "Exception Found", "Pending Documents"}
        completed_statuses = {"QUALIFIED", "DISQUALIFIED", "COMPLIANT", "Qualified", "Disqualified"}

        active_tenders = sum(1 for t in tenders if t.get("status") == "ACTIVE")
        under_verification = sum(1 for b in bidders if b.get("status") in reviewing_statuses)
        completed_assessments = sum(1 for b in bidders if b.get("status") in completed_statuses)
        high_risk_bidders = sum(1 for b in bidders if str(b.get("risk_level")).upper() in ("HIGH", "CRITICAL"))
        pending_docs = sum(1 for b in bidders if "PENDING" in str(b.get("status")).upper() or b.get("documents_count", 0) == 0)

        recent_audit = rows_to_list(conn.execute("SELECT * FROM bidder_audit_events ORDER BY created_at DESC LIMIT 5").fetchall())

        return {
            "active_tenders": active_tenders,
            "bids_under_verification": under_verification,
            "completed_assessments": completed_assessments,
            "high_risk_bidders": high_risk_bidders,
            "pending_documents": pending_docs,
            "verification_exceptions": discrepancies,
            "bidders": bidders,
            "recent_audit": recent_audit,
        }
