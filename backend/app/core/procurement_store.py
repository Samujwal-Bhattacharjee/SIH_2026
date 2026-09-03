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
    result: List[Dict[str, Any]] = []
    for r in rows:
        if r is not None:
            d = row_to_dict(r)
            if d is not None:
                result.append(d)
    return result


def init_db(_force_seed: bool = False):
    """
    Create all procurement tables if they do not exist, and seed baseline data.

    Args:
        _force_seed: When True, always run seed_initial_data() regardless of
                     whether the tenders table is already populated. Used by
                     reset_session_db() after deleting the database file.
    """
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
            compliance_status   TEXT DEFAULT 'PENDING_DOCUMENTS',
            compliance_score    REAL DEFAULT 0,
            risk_level          TEXT DEFAULT 'MEDIUM',
            officer_decision    TEXT,
            officer_note        TEXT,
            quote_amount        REAL,
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
            evidence_source     TEXT,
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

        CREATE TABLE IF NOT EXISTS integrity_finding_reviews (
            id                  TEXT PRIMARY KEY,
            finding_id          TEXT NOT NULL,
            tender_id           TEXT,
            bidder_id           TEXT,
            status              TEXT NOT NULL DEFAULT 'OPEN',
            action              TEXT,
            note                TEXT,
            officer_name        TEXT NOT NULL DEFAULT 'Procurement Officer',
            actor_user_id       TEXT,
            created_at          TEXT NOT NULL,
            updated_at          TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_integrity_reviews_finding ON integrity_finding_reviews(finding_id);
        CREATE INDEX IF NOT EXISTS idx_integrity_reviews_tender ON integrity_finding_reviews(tender_id);
        """)

        # Migration: ensure quote_amount and compliance_status columns exist on bidders table
        try:
            cols = [c[1] for c in conn.execute("PRAGMA table_info(bidders)").fetchall()]
            if cols and "quote_amount" not in cols:
                conn.execute("ALTER TABLE bidders ADD COLUMN quote_amount REAL")
            if cols and "compliance_status" not in cols:
                conn.execute("ALTER TABLE bidders ADD COLUMN compliance_status TEXT DEFAULT 'PENDING_DOCUMENTS'")
            cr_cols = [c[1] for c in conn.execute("PRAGMA table_info(compliance_results)").fetchall()]
            if cr_cols and "evidence_source" not in cr_cols:
                conn.execute("ALTER TABLE compliance_results ADD COLUMN evidence_source TEXT")
        except Exception:
            pass

        # Check if database is empty and needs initial seeding
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tenders")
        count_row = cur.fetchone()
        if _force_seed or (count_row and count_row[0] == 0):
            seed_initial_data(conn)


def seed_initial_data(conn: sqlite3.Connection):
    """Seed synthetic procurement history with realistic multi-scenario data."""
    try:
        from app.services.integrity.synthetic_history import seed_synthetic_procurement_history
        seed_synthetic_procurement_history(conn)
        logger.info("Procurement persistent database initialized with synthetic history dataset.")
    except Exception as e:
        logger.error(f"Error seeding synthetic procurement data: {e}", exc_info=True)


def reset_and_seed_procurement_data() -> Dict[str, int]:
    """Manually reset and reseed the procurement database with synthetic history."""
    init_db()
    with get_db() as conn:
        from app.services.integrity.synthetic_history import seed_synthetic_procurement_history
        return seed_synthetic_procurement_history(conn)


def reset_session_db(db_path: Optional[str] = None, *, enabled: bool = True) -> None:
    """
    SESSION-EPHEMERAL RESET — Core startup routine for DEMO_SESSION_MODE.

    Deletes the SQLite procurement database file and recreates it from the
    pristine deterministic baseline seed.  Every backend startup in
    DEMO_SESSION_MODE calls this so that ALL session-created data
    (tenders, bidders, documents, compliance results, audit events,
    integrity reviews) disappears on restart.

    Safety guarantees:
    - Only touches the local SQLite file — Supabase Postgres is never modified.
    - The pristine seed (synthetic_history.py) is read-only input; it is never
      mutated by this function.
    - Source code, migrations, and configuration files are never touched.
    - When ``enabled`` is False (i.e. DEMO_SESSION_MODE=false in production),
      this function is a strict no-op — it neither deletes nor modifies anything.

    Args:
        db_path:  Path to the SQLite file. Defaults to the standard DB_PATH.
                  Override in tests to use a temp directory.
        enabled:  Pass ``settings.DEMO_SESSION_MODE``. When False, this
                  function does nothing (production safety guard).
    """
    if not enabled:
        logger.info("reset_session_db: DEMO_SESSION_MODE is disabled — skipping ephemeral reset (production mode).")
        return

    # global must be declared before first use of DB_PATH in this function scope
    global DB_PATH
    target = db_path or DB_PATH

    # ── 1. Delete the existing runtime database ──────────────────────────────
    if os.path.exists(target):
        try:
            os.remove(target)
            logger.info(f"reset_session_db: Deleted runtime database at '{target}'.")
        except OSError as exc:
            logger.error(f"reset_session_db: Could not delete '{target}': {exc}")
            raise
    else:
        logger.info(f"reset_session_db: No existing database at '{target}' — starting fresh.")

    # ── 2. Recreate schema + seed baseline ──────────────────────────────────
    # Temporarily swap DB_PATH so init_db() targets the correct file.
    _original_path = DB_PATH
    try:
        DB_PATH = target
        init_db(_force_seed=True)
        logger.info("reset_session_db: Procurement database reset to pristine baseline.")
    finally:
        DB_PATH = _original_path


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

    created = get_tender_by_id(t_id)
    if created is None:
        return {
            "id": t_id,
            "tender_number": t_num,
            "title": data.get("title", "Procurement Tender"),
            "department": data.get("department", "Department of Administrative Reforms"),
            "description": data.get("description", ""),
            "bid_closing_date": data.get("bid_closing_date", "2026-09-15"),
            "estimated_value": data.get("estimated_value", 10000000.00),
            "category": data.get("category", "General Procurement"),
            "status": data.get("status", "ACTIVE"),
            "local_content_class": data.get("local_content_class", "CLASS_I"),
            "created_by": data.get("created_by", ""),
            "created_at": now,
            "updated_at": now,
        }
    return created


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
        # Hydrate document counts, exception counts, and blocking exceptions
        for b in bidders:
            b_id = b["id"]
            doc_row = conn.execute("SELECT COUNT(*) FROM bidder_documents WHERE bidder_id = ?", (b_id,)).fetchone()
            exc_row = conn.execute("SELECT COUNT(*) FROM discrepancies WHERE bidder_id = ? AND is_resolved = 0", (b_id,)).fetchone()
            mand_fail_row = conn.execute("""
                SELECT COUNT(*) FROM compliance_results
                WHERE bidder_id = ? AND status IN ('NON_COMPLIANT', 'EXPIRED', 'UNVERIFIED')
            """, (b_id,)).fetchone()
            crit_disc_row = conn.execute("""
                SELECT COUNT(*) FROM discrepancies
                WHERE bidder_id = ? AND severity = 'CRITICAL' AND is_resolved = 0
            """, (b_id,)).fetchone()
            b["documents_count"] = doc_row[0] if doc_row else 0
            b["exceptions_count"] = exc_row[0] if exc_row else 0
            b["blocking_exceptions_count"] = (mand_fail_row[0] if mand_fail_row else 0) + (crit_disc_row[0] if crit_disc_row else 0)
            if not b.get("compliance_status"):
                b["compliance_status"] = "EXCEPTION_FOUND" if b["blocking_exceptions_count"] > 0 else (b.get("status") if b.get("status") in ("COMPLIANT", "UNDER_REVIEW", "PENDING_DOCUMENTS") else "UNDER_REVIEW")
        return bidders


def get_bidder_by_id(bidder_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        row = conn.execute("SELECT * FROM bidders WHERE id = ?", (bidder_id,)).fetchone()
        if not row:
            return None
        b = row_to_dict(row)
        if b is None:
            return None
        doc_row = conn.execute("SELECT COUNT(*) FROM bidder_documents WHERE bidder_id = ?", (bidder_id,)).fetchone()
        exc_row = conn.execute("SELECT COUNT(*) FROM discrepancies WHERE bidder_id = ? AND is_resolved = 0", (bidder_id,)).fetchone()
        mand_fail_row = conn.execute("""
            SELECT COUNT(*) FROM compliance_results
            WHERE bidder_id = ? AND status IN ('NON_COMPLIANT', 'EXPIRED', 'UNVERIFIED')
        """, (bidder_id,)).fetchone()
        crit_disc_row = conn.execute("""
            SELECT COUNT(*) FROM discrepancies
            WHERE bidder_id = ? AND severity = 'CRITICAL' AND is_resolved = 0
        """, (bidder_id,)).fetchone()
        b["documents_count"] = doc_row[0] if doc_row else 0
        b["exceptions_count"] = exc_row[0] if exc_row else 0
        b["blocking_exceptions_count"] = (mand_fail_row[0] if mand_fail_row else 0) + (crit_disc_row[0] if crit_disc_row else 0)
        if not b.get("compliance_status"):
            b["compliance_status"] = "EXCEPTION_FOUND" if b["blocking_exceptions_count"] > 0 else (b.get("status") if b.get("status") in ("COMPLIANT", "UNDER_REVIEW", "PENDING_DOCUMENTS") else "UNDER_REVIEW")
        return b


def create_bidder_record(tender_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        count_row = conn.execute("SELECT COUNT(*) FROM bidders").fetchone()
        count = count_row[0] if count_row else 0
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

    created = get_bidder_by_id(bidder_id)
    if created is None:
        return {
            "id": bidder_id,
            "tender_id": tender_id,
            "legal_name": data.get("legal_name", "Bidder"),
            "trade_name": data.get("trade_name"),
            "gstin": data.get("gstin"),
            "pan": data.get("pan"),
            "udyam_number": data.get("udyam_number"),
            "status": data.get("status", "PENDING_DOCUMENTS"),
            "compliance_score": data.get("compliance_score", 0.0),
            "risk_level": data.get("risk_level", "MEDIUM"),
            "created_at": now,
            "updated_at": now,
            "documents_count": 0,
            "exceptions_count": 0,
        }
    return created


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

    created = get_document_by_id(doc_id)
    if created is None:
        return {
            "id": doc_id,
            "case_id": doc.get("case_id"),
            "file_name": doc.get("file_name", "uploaded_document"),
            "storage_path": doc.get("storage_path"),
            "file_url": doc.get("file_url"),
            "file_type": doc.get("file_type", "application/pdf"),
            "file_size": doc.get("file_size", 0),
            "document_type": doc.get("document_type", "Other"),
            "page_count": doc.get("page_count", 0),
            "ocr_status": doc.get("ocr_status", "PENDING"),
            "extracted_text": doc.get("extracted_text"),
            "extracted_fields": doc.get("extracted_fields", []),
            "ocr_engine": doc.get("ocr_engine"),
            "ocr_confidence": doc.get("ocr_confidence", 0.0),
            "error_message": doc.get("error_message"),
            "processed_at": doc.get("processed_at"),
            "uploaded_by": doc.get("uploaded_by", "Officer"),
            "created_at": doc.get("created_at") or now,
        }
    return created


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
                INSERT INTO compliance_results (id, bidder_id, tender_id, requirement_id, requirement_name, category, status, severity, score, evidence_doc_id, evidence_field_key, evidence_value, evidence_source, confidence, reason, verified_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                check.get("evidence_source"),
                float(check.get("confidence", 0.0) or 0.0),
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
        from app.services.procurement_service import determine_compliance_status
        comp_summary = determine_compliance_status(
            assessment.get("checks", []),
            assessment.get("discrepancies", [])
        )
        compliance_status_val = assessment.get("compliance_status") or comp_summary["status"]
        risk = assessment.get("risk_level", "MEDIUM")

        # Check if officer has already made a decision
        existing_row = conn.execute("SELECT officer_decision FROM bidders WHERE id = ?", (bidder_id,)).fetchone()
        has_officer_decision = bool(existing_row and existing_row[0])

        if has_officer_decision:
            # Preserve the officer's decision in `status`, while updating objective `compliance_status`
            conn.execute("""
                UPDATE bidders
                SET compliance_score = ?, risk_level = ?, compliance_status = ?, updated_at = ?
                WHERE id = ?
            """, (
                assessment.get("compliance_score", 0.0),
                risk,
                compliance_status_val,
                now,
                bidder_id
            ))
        else:
            # When no officer decision exists, both workflow status and compliance status track compliance_status_val
            conn.execute("""
                UPDATE bidders
                SET compliance_score = ?, risk_level = ?, compliance_status = ?, status = ?, updated_at = ?
                WHERE id = ?
            """, (
                assessment.get("compliance_score", 0.0),
                risk,
                compliance_status_val,
                compliance_status_val,
                now,
                bidder_id
            ))

    return {
        "status": "SAVED",
        "checks_saved": len(assessment.get("checks", [])),
        "discrepancies_saved": len(assessment.get("discrepancies", [])),
        "compliance_status": compliance_status_val,
        "compliance_score": assessment.get("compliance_score", 0.0),
    }


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
# ============================================================
# INTEGRITY FINDING REVIEWS & OFFICER DECISION SUPPORT
# ============================================================

def record_integrity_finding_review(
    finding_id: str,
    status: str,
    tender_id: Optional[str] = None,
    bidder_id: Optional[str] = None,
    action: Optional[str] = None,
    note: Optional[str] = None,
    officer_name: str = "Procurement Officer",
    actor_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Record an officer review action on an integrity finding (OPEN, UNDER_REVIEW, ACKNOWLEDGED, DISMISSED, RESOLVED).
    Persists the review record and logs an immutable audit event using the existing audit system.
    """
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    review_id = f"REV-{finding_id}-{uuid.uuid4().hex[:6]}"
    with get_db() as conn:
        conn.execute("""
            INSERT INTO integrity_finding_reviews (
                id, finding_id, tender_id, bidder_id, status, action, note, officer_name, actor_user_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (review_id, finding_id, tender_id, bidder_id, status, action, note, officer_name, actor_user_id, now, now))

    # Re-use existing audit logging architecture
    audit_action = f"Integrity Finding {status.replace('_', ' ').title()}"
    audit_desc = (
        f"Integrity finding '{finding_id}' marked '{status}' by {officer_name}."
        + (f" Action: {action}." if action else "")
        + (f" Officer note: {note}" if note else "")
    )
    log_audit_event(
        action=audit_action,
        actor=officer_name,
        tender_id=tender_id,
        bidder_id=bidder_id,
        description=audit_desc,
        actor_user_id=actor_user_id,
        metadata={"finding_id": finding_id, "status": status, "action": action, "note": note}
    )
    return {
        "id": review_id,
        "finding_id": finding_id,
        "tender_id": tender_id,
        "bidder_id": bidder_id,
        "status": status,
        "action": action,
        "note": note,
        "officer_name": officer_name,
        "updated_at": now,
    }


def get_integrity_finding_reviews(tender_id: Optional[str] = None, finding_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve recorded officer reviews for findings."""
    init_db()
    with get_db() as conn:
        if finding_id:
            rows = conn.execute("SELECT * FROM integrity_finding_reviews WHERE finding_id = ? ORDER BY updated_at DESC", (finding_id,)).fetchall()
        elif tender_id:
            rows = conn.execute("SELECT * FROM integrity_finding_reviews WHERE tender_id = ? ORDER BY updated_at DESC", (tender_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM integrity_finding_reviews ORDER BY updated_at DESC").fetchall()
        return rows_to_list(rows)


# ============================================================
# DASHBOARD AGGREGATES
# ============================================================

def get_dashboard_summary() -> Dict[str, Any]:
    init_db()
    with get_db() as conn:
        tenders = rows_to_list(conn.execute("SELECT * FROM tenders").fetchall())
        bidders = get_bidders()
        disc_row = conn.execute("SELECT COUNT(*) FROM discrepancies WHERE is_resolved = 0").fetchone()
        discrepancies = disc_row[0] if disc_row else 0

        reviewing_statuses = {"PENDING_DOCUMENTS", "UNDER_REVIEW", "EXCEPTION_FOUND", "Under Review", "Exception Found", "Pending Documents"}
        completed_statuses = {"QUALIFIED", "DISQUALIFIED", "COMPLIANT", "Qualified", "Disqualified"}

        active_tenders = [t for t in tenders if t.get("status") == "ACTIVE"]
        active_tenders_count = len(active_tenders)
        under_verification = sum(1 for b in bidders if b.get("status") in reviewing_statuses)
        completed_assessments = sum(1 for b in bidders if b.get("status") in completed_statuses)
        high_risk_bidders = sum(1 for b in bidders if str(b.get("risk_level")).upper() in ("HIGH", "CRITICAL"))
        pending_docs = sum(1 for b in bidders if "PENDING" in str(b.get("status")).upper() or b.get("documents_count", 0) == 0)

        recent_audit = rows_to_list(conn.execute("SELECT * FROM bidder_audit_events ORDER BY created_at DESC LIMIT 6").fetchall())

        # Real Integrity Dashboard Metrics (computed deterministically from backend state)
        from app.services.integrity.risk_engine import assess_tender_integrity

        integrity_reviews: List[Dict[str, Any]] = []
        for t in active_tenders:
            try:
                res = assess_tender_integrity(t["id"])
                if res.findings_count > 0 or res.risk_level.value in ("HIGH", "CRITICAL", "MEDIUM"):
                    tender_bidders = [b.get("legal_name") for b in get_bidders(t["id"])]
                    integrity_reviews.append({
                        "tender_id": t["id"],
                        "tender_number": t.get("tender_number"),
                        "title": t.get("title"),
                        "department": t.get("department"),
                        "category": t.get("category"),
                        "risk_score": res.overall_risk_score,
                        "risk_level": res.risk_level.value,
                        "findings_count": res.findings_count,
                        "contributing_signals": res.contributing_signals,
                        "summary": res.summary,
                        "bidders": tender_bidders[:3],
                    })
            except Exception as ex:
                logger.warning(f"Dashboard integrity evaluation note for {t.get('id')}: {ex}")

        # Sort integrity reviews by risk_score DESC
        integrity_reviews.sort(key=lambda r: r.get("risk_score", 0), reverse=True)

        integrity_summary = {
            "reviews_requiring_attention": len(integrity_reviews),
            "high_risk_cases": sum(1 for r in integrity_reviews if r.get("risk_level") in ("HIGH", "CRITICAL")),
            "total_findings": sum(r.get("findings_count", 0) for r in integrity_reviews),
        }

        compliance_exceptions = sum(
            1 for b in bidders
            if b.get("compliance_status") == "EXCEPTION_FOUND" or b.get("blocking_exceptions_count", 0) > 0
        )

        return {
            "active_tenders": active_tenders_count,
            "bids_under_verification": under_verification,
            "completed_assessments": completed_assessments,
            "high_risk_bidders": high_risk_bidders,
            "high_compliance_risk_bidders": high_risk_bidders,
            "compliance_exceptions": compliance_exceptions,
            "pending_documents": pending_docs,
            "verification_exceptions": discrepancies,
            "bidders": bidders,
            "recent_audit": recent_audit,
            "integrity_reviews": integrity_reviews,
            "integrity_summary": integrity_summary,
        }
