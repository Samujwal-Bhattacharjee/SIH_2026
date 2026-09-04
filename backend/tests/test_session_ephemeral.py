"""
Session-Ephemeral Data Behavior Tests (SIH26100)
Validates DEMO_SESSION_MODE reset mechanism.
All tests use a temp-dir SQLite DB and never touch procurement.db.
"""
import os
import pytest


def _reset(db):
    import app.core.procurement_store as ps
    ps.reset_session_db(db_path=db, enabled=True)
    ps.DB_PATH = db


def _get_tenders(db):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.get_tenders()


def _get_bidders(db, tender_id=None):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.get_bidders(tender_id)


def _create_tender(db, title):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.create_tender_record({"title": title, "department": "Test Dept"})


def _create_bidder(db, tender_id, name):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.create_bidder_record(tender_id, {"legal_name": name})


def _save_document(db):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.save_document_record({
        "file_name": "session_upload.pdf",
        "file_type": "application/pdf",
        "file_size": 1024,
        "document_type": "GST Certificate",
        "ocr_status": "PENDING",
    })


def _update_bidder(db, bidder_id, updates):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.update_bidder_record(bidder_id, updates)


def _get_bidder_by_id(db, bidder_id):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.get_bidder_by_id(bidder_id)


def _get_document_by_id(db, doc_id):
    import app.core.procurement_store as ps
    ps.DB_PATH = db
    return ps.get_document_by_id(doc_id)


class TestSessionEphemeralBehavior:

    def test_baseline_survives_reset(self, tmp_path):
        """After a fresh reset, the original seeded tenders must be present."""
        db = str(tmp_path / "test.db")
        _reset(db)
        tenders = _get_tenders(db)
        assert len(tenders) > 0, "Baseline must have at least one tender after reset."
        assert len(tenders) >= 5, "Expected >= 5 baseline tenders after reset."

    def test_created_tender_is_session_only(self, tmp_path):
        """A tender created during a session must disappear after reset."""
        db = str(tmp_path / "test.db")
        _reset(db)
        baseline_before = {t["id"] for t in _get_tenders(db)}
        assert len(baseline_before) > 0

        sam = _create_tender(db, title="Sam")
        sam_id = sam["id"]
        during = {t["id"] for t in _get_tenders(db)}
        assert sam_id in during, "Tender Sam must exist during session."

        _reset(db)
        after = {t["id"] for t in _get_tenders(db)}
        assert sam_id not in after, "Session tender Sam must be gone after reset."
        assert baseline_before.issubset(after), "Baseline tenders must still exist."

    def test_created_bidder_is_session_only(self, tmp_path):
        """A bidder created during a session must disappear after reset."""
        db = str(tmp_path / "test.db")
        _reset(db)
        tenders = _get_tenders(db)
        assert tenders
        tender_id = tenders[0]["id"]

        bidder = _create_bidder(db, tender_id, name="Session Bidder Corp.")
        bidder_id = bidder["id"]
        assert _get_bidder_by_id(db, bidder_id) is not None

        _reset(db)
        assert _get_bidder_by_id(db, bidder_id) is None, "Session bidder must be gone after reset."

    def test_uploaded_document_is_session_only(self, tmp_path):
        """A document record saved during a session must disappear after reset."""
        db = str(tmp_path / "test.db")
        _reset(db)

        doc = _save_document(db)
        doc_id = doc["id"]
        assert _get_document_by_id(db, doc_id) is not None

        _reset(db)
        assert _get_document_by_id(db, doc_id) is None, "Session document must be gone after reset."

    def test_modifications_are_session_only(self, tmp_path):
        """Modifying a seeded baseline bidder must not persist after reset."""
        db = str(tmp_path / "test.db")
        _reset(db)

        bidders = _get_bidders(db)
        assert bidders
        bidder_id = bidders[0]["id"]
        original_name = bidders[0]["legal_name"]

        _update_bidder(db, bidder_id, {"legal_name": "MODIFIED_IN_SESSION_Corp."})
        modified = _get_bidder_by_id(db, bidder_id)
        assert modified is not None
        assert modified["legal_name"] == "MODIFIED_IN_SESSION_Corp.", "Modification visible during session."

        _reset(db)
        names = [b["legal_name"] for b in _get_bidders(db)]
        assert original_name in names, "Original baseline name must be restored."
        assert "MODIFIED_IN_SESSION_Corp." not in names, "Session modification must NOT persist."

    def test_baseline_is_deterministic(self, tmp_path):
        """Two successive resets must produce identical baseline data."""
        db = str(tmp_path / "test.db")

        _reset(db)
        first_tenders = sorted(t["id"] for t in _get_tenders(db))
        first_bidders = sorted(b["id"] for b in _get_bidders(db))

        _reset(db)
        second_tenders = sorted(t["id"] for t in _get_tenders(db))
        second_bidders = sorted(b["id"] for b in _get_bidders(db))

        assert first_tenders == second_tenders, "Tender IDs must be identical between resets."
        assert first_bidders == second_bidders, "Bidder IDs must be identical between resets."

    def test_no_production_destructive_reset(self, tmp_path):
        """When enabled=False, reset_session_db() must be a strict no-op."""
        import app.core.procurement_store as ps
        db = str(tmp_path / "test.db")
        _reset(db)

        tenders_before = _get_tenders(db)
        assert len(tenders_before) > 0

        sentinel = str(tmp_path / "sentinel.txt")
        with open(sentinel, "w") as f:
            f.write("do_not_delete")

        ps.reset_session_db(db_path=db, enabled=False)

        assert os.path.exists(db), "DB must NOT be deleted when enabled=False"
        ps.DB_PATH = db
        tenders_after = _get_tenders(db)
        assert len(tenders_before) == len(tenders_after), "Data unchanged when enabled=False"
        assert os.path.exists(sentinel)
