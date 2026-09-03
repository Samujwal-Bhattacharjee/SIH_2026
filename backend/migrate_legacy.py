import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.procurement_store import get_db
from app.services.fairbid_extractor import extract_fairbid_canonical, is_fairbid_document

with get_db() as conn:
    rows = conn.execute("SELECT id, case_id, file_name, extracted_text FROM documents").fetchall()
    migrated = 0
    for r in rows:
        text = r[3] or ""
        if is_fairbid_document(text):
            print(f"Migrating {r[0]} ({r[2]})...")
            canon = extract_fairbid_canonical(text, r[2])
            payload = json.dumps({
                "fields": canon["extracted_fields"],
                "verification_record": canon,
                **canon
            })
            conn.execute(
                "UPDATE documents SET extracted_fields = ?, document_type = ? WHERE id = ?",
                (payload, canon["document"]["document_type"], r[0])
            )
            if canon.get("bidder"):
                b = canon["bidder"]
                conn.execute(
                    "UPDATE bidders SET legal_name = ?, gstin = ?, pan = ?, udyam_number = ?, cin = ? WHERE id = ?",
                    (b.get("bidder_name"), b.get("gstin"), b.get("pan"), b.get("udyam_registration_number"), b.get("cin"), r[1])
                )
            migrated += 1
            print(f"Successfully migrated {r[0]}!")
    print(f"Total migrated: {migrated}")
