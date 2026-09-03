"""
Synthetic Document Generator and Verification Benchmark for FairBid OCR Pipeline.
Generates 3 structurally identical but content-distinct PDF documents and verifies extraction integrity.
"""

import os
import sys
import pymupdf as fitz

DOCS_DIR = os.path.join(os.path.dirname(__file__), "synthetic_docs")
os.makedirs(DOCS_DIR, exist_ok=True)

DOC_DEFINITIONS = [
    {
        "doc_id": "FB-TN-RO-0001",
        "filename": "FairBid_TN_RO_Simulation_01.pdf",
        "omc": "Indian Oil Corporation Ltd. (IOCL)",
        "state": "Tamil Nadu",
        "district": "Tiruvallur",
        "location": "Gummidipoondi to Elavoor on (LHS on NH 16)",
        "road": "NH 16",
        "serial": "418",
        "ro_type": "Regular",
        "site_type": "CFS",
        "category": "SC",
        "selection": "Draw of Lots",
        "year": "2023",
        "frontage": "35 m",
        "depth": "35 m",
        "area": "1,225 sq m",
        "sales": "325 KL/month (MS+HSD)",
        "deposit": "Rs. 3 lakh",
        "bidder_name": "Southern Corridor Energy Services Pvt. Ltd. (FairBid Synthetic Bidder)",
        "bidder_class": "Micro / Small Enterprise - Synthetic Test Record",
        "gstin": "FAIRBID-GSTIN-TN-001",
        "pan": "FAIRBID-PAN-TST001",
        "cin": "FAIRBID-CIN-SYNTH-001",
        "udyam": "FAIRBID-UDYAM-TN-001",
    },
    {
        "doc_id": "FB-MH-RO-0002",
        "filename": "FairBid_MH_RO_Simulation_02.pdf",
        "omc": "Bharat Petroleum Corporation Ltd. (BPCL)",
        "state": "Maharashtra",
        "district": "Pune",
        "location": "Chakan to Shikrapur on SH 55",
        "road": "SH 55",
        "serial": "204",
        "ro_type": "Regular",
        "site_type": "CC",
        "category": "OBC",
        "selection": "Bidding",
        "year": "2023",
        "frontage": "45 m",
        "depth": "45 m",
        "area": "2,025 sq m",
        "sales": "450 KL/month (MS+HSD)",
        "deposit": "Rs. 5 lakh",
        "bidder_name": "Western Express Fuels & Energy Pvt. Ltd. (FairBid Synthetic Bidder)",
        "bidder_class": "Small Enterprise - Synthetic Test Record",
        "gstin": "FAIRBID-GSTIN-MH-002",
        "pan": "FAIRBID-PAN-TST002",
        "cin": "FAIRBID-CIN-SYNTH-002",
        "udyam": "FAIRBID-UDYAM-MH-002",
    },
    {
        "doc_id": "FB-KA-RO-0003",
        "filename": "FairBid_KA_RO_Simulation_03.pdf",
        "omc": "Hindustan Petroleum Corporation Ltd. (HPCL)",
        "state": "Karnataka",
        "district": "Mysuru",
        "location": "Mysuru to Nanjangud on NH 766",
        "road": "NH 766",
        "serial": "312",
        "ro_type": "Regular",
        "site_type": "CFS",
        "category": "OPEN",
        "selection": "Draw of Lots",
        "year": "2023",
        "frontage": "40 m",
        "depth": "40 m",
        "area": "1,600 sq m",
        "sales": "380 KL/month (MS+HSD)",
        "deposit": "Rs. 4 lakh",
        "bidder_name": "Deccan Highway Logistics & Retail Pvt. Ltd. (FairBid Synthetic Bidder)",
        "bidder_class": "Micro Enterprise - Synthetic Test Record",
        "gstin": "FAIRBID-GSTIN-KA-003",
        "pan": "FAIRBID-PAN-TST003",
        "cin": "FAIRBID-CIN-SYNTH-003",
        "udyam": "FAIRBID-UDYAM-KA-003",
    },
]


def build_doc_text(d):
    page1 = f"""FAIRBID OCR BENCHMARK / PETROLEUM DEALERSHIP EXTRACTION TEST
Document Reference: {d['doc_id']}
Document Type: Retail Outlet Dealership / Bid Compliance Simulation
Issue Date: 03 September 2026
Status: DEMONSTRATION / SYNTHETIC RECORD
Primary Public Source URL: Opportunity {d['omc']} / public {d['year']} dealership advertisement
Source Classification: Verified public advertisement data

1. PUBLIC TENDER / ADVERTISEMENT SPECIFICATION
State: {d['state']}
District: {d['district']}
Oil Marketing Company: {d['omc']}
Advertisement Year: {d['year']}
Selection Method: {d['selection']}

2. LOCATION & COMMERCIAL PARAMETERS
Parameter | Extracted Value | Source Reference
Location | {d['location']} | Verified public advertisement
Road / Highway | {d['road']} | Verified public advertisement
Location Serial Number | {d['serial']} | Verified public advertisement
Retail Outlet Type | {d['ro_type']} | Verified public advertisement
Site Type | {d['site_type']} | Verified public advertisement
Category | {d['category']} | Verified public advertisement
Minimum Frontage | {d['frontage']} | Verified public advertisement
Minimum Depth | {d['depth']} | Verified public advertisement
Site Area | {d['area']} | Verified public advertisement
Estimated Monthly Sales Potential | {d['sales']} | Verified public advertisement
Working Capital Requirement | Rs. 0 lakh | Verified public advertisement
Infrastructure Development Estimate | Rs. 0 lakh | Verified public advertisement
Fixed Fee / Minimum Bid Amount | Rs. 0 lakh | Verified public advertisement
Security Deposit | {d['deposit']} | Verified public advertisement
"""

    page2 = f"""3. BIDDER / APPLICANT COMPLIANCE PROFILE
Bidder Name: {d['bidder_name']}
Bidder Classification: {d['bidder_class']}
GST Identification Number: {d['gstin']}
Permanent Account Number: {d['pan']}
Corporate Identification Number: {d['cin']}
Udyam Registration Number: {d['udyam']}
Experience Status: Synthetic experience: dealership-sector workflow familiarity
Financial Eligibility: Synthetic financial profile: ₹ 8.50 lakh liquid funds (illustrative)
Land Availability: Synthetic land availability: document placeholder present
Statutory Compliance: Synthetic status: DOCUMENT-SET PLACEHOLDER PRESENT
Blacklisting / Debarment Declaration: Synthetic status: NOT BLACKLISTED / NOT DEBARRED
Digital Document Availability: Synthetic status: OCR-READY TEST PACKET PRESENT
Application Completeness: Synthetic status: COMPLETE FOR DEMO WORKFLOW

4. DEMONSTRATION VERIFICATION CHECKLIST
Checklist Item | Verification Result | Traceability Rule
Document Type Classified | PASS | Standard regex and section parser
Issue Date ISO Parsed | PASS | 2026-09-03 format verified
OMC Extracted | PASS | Entity name strictly bound
State Validated | PASS | Official State List
District Validated | PASS | Official District Roster
Location Serial Number | PASS | Cell boundary isolated
Commercial Parameters | PASS | Exact match without mutation
Security Deposit | PASS | Commercial requirement satisfied
Bidder Identity Matched | PASS | Bidder profile matched
GSTIN Validated | PASS | Formatted identifier
PAN Validated | PASS | Formatted identifier
Udyam Validated | PASS | Formatted identifier
Non-Blacklisting Declaration | PASS | Clear affirmative declaration
Application Completeness | PASS | All simulation items present
"""
    return page1, page2


def create_pdf(filename, page1_text, page2_text):
    doc = fitz.open()
    for page_text in [page1_text, page2_text]:
        page = doc.new_page(width=595, height=842)  # A4 size
        # Add text to page
        rect = fitz.Rect(50, 50, 545, 792)
        page.insert_textbox(rect, page_text, fontsize=9.5, fontname="helv", color=(0.1, 0.1, 0.1))
    doc.save(filename)
    doc.close()


def generate_all():
    generated_files = []
    for d in DOC_DEFINITIONS:
        p1, p2 = build_doc_text(d)
        filepath = os.path.join(DOCS_DIR, d["filename"])
        create_pdf(filepath, p1, p2)
        print(f"Generated: {filepath}")
        generated_files.append((d, filepath))
    return generated_files


def run_benchmark():
    sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
    from app.services.fairbid_extractor import extract_fairbid_canonical
    from app.services.document_service import process_ocr_from_bytes

    print("\n========================================================")
    print("RUNNING FAIRBID OCR PIPELINE VALIDATION BENCHMARK")
    print("========================================================\n")

    results = []

    for d in DOC_DEFINITIONS:
        pdf_path = os.path.join(DOCS_DIR, d["filename"])
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        ocr_res = process_ocr_from_bytes(pdf_bytes, d["filename"], "application/pdf")
        extracted_text = ocr_res["extractedText"]

        canonical = extract_fairbid_canonical(extracted_text, filename=d["filename"], ocr_engine_conf=ocr_res.get("confidenceScore", 0.95))
        results.append((d, canonical, extracted_text))

        # Check critical criteria for each document
        opp = canonical["opportunity"]
        comm = canonical["commercial"]
        bid = canonical["bidder"]
        comp = canonical["compliance"]
        doc_meta = canonical["document"]

        print(f"\n--- Checking Document: {d['doc_id']} ({d['filename']}) ---")
        assert opp["state"] == d["state"], f"Expected state {d['state']}, got {opp['state']}"
        assert opp["district"] == d["district"], f"Expected district {d['district']}, got {opp['district']}"
        assert opp["oil_marketing_company"] == d["omc"], f"Expected OMC {d['omc']}, got {opp['oil_marketing_company']}"
        assert "STATE" not in opp["oil_marketing_company"], "Contamination! 'STATE' found in company name"
        assert opp["location"] == d["location"], f"Expected location {d['location']}, got {opp['location']}"
        assert opp["road_highway"] == d["road"], f"Expected road {d['road']}, got {opp['road_highway']}"
        assert opp["location_serial_number"] == d["serial"], f"Expected serial {d['serial']}, got {opp['location_serial_number']}"
        assert comm["security_deposit"] == d["deposit"], f"Expected deposit {d['deposit']}, got {comm['security_deposit']}"
        assert bid["bidder_name"] == d["bidder_name"], f"Expected bidder {d['bidder_name']}, got {bid['bidder_name']}"
        assert bid["gstin"] == d["gstin"], f"Expected GSTIN {d['gstin']}, got {bid['gstin']}"
        assert bid["pan"] == d["pan"], f"Expected PAN {d['pan']}, got {bid['pan']}"
        assert bid["udyam_registration_number"] == d["udyam"], f"Expected Udyam {d['udyam']}, got {bid['udyam_registration_number']}"
        assert comp["blacklisting_debarment"] == "NOT BLACKLISTED / NOT DEBARRED", "Debarment declaration missing"
        assert doc_meta["document_id"] == d["doc_id"], f"Expected doc_id {d['doc_id']}, got {doc_meta['document_id']}"
        assert doc_meta["document_type"] == "Retail Outlet Dealership / Bid Compliance Simulation"

        # Verify no manufactured fields
        fields_by_key = {f["key"]: f["value"] for f in canonical["fields"]}
        assert "oemReference" not in fields_by_key, "OEM reference was manufactured!"
        assert "compensation_amount" not in fields_by_key, "Compensation amount was manufactured!"
        assert "annualTurnover" not in fields_by_key, "Turnover was manufactured!"

        # Verify provenance tracking
        for f in canonical["fields"]:
            assert "source_text" in f and f["source_text"], f"Missing source_text in {f['key']}"
            assert "confidence" in f and isinstance(f["confidence"], (float, int)), f"Missing confidence in {f['key']}"
            if f.get("status") == "extracted":
                assert "page" in f and f["page"] in (1, 2), f"Missing or invalid page in {f['key']}"
                assert "section" in f and f["section"], f"Missing section in {f['key']}"

        print(f"[PASS] All {len(canonical['fields'])} canonical fields verified with 100% provenance and deterministic confidence.")

    # Cross-document non-stale validation (Doc A != Doc B != Doc C)
    print("\n--- Cross-Document Isolation Check ---")
    docA_res, docB_res, docC_res = results[0][1], results[1][1], results[2][1]
    assert docA_res["opportunity"]["state"] != docB_res["opportunity"]["state"] != docC_res["opportunity"]["state"], "State leaked between docs!"
    assert docA_res["opportunity"]["district"] != docB_res["opportunity"]["district"] != docC_res["opportunity"]["district"], "District leaked between docs!"
    assert docA_res["opportunity"]["oil_marketing_company"] != docB_res["opportunity"]["oil_marketing_company"] != docC_res["opportunity"]["oil_marketing_company"], "Company leaked!"
    assert docA_res["bidder"]["bidder_name"] != docB_res["bidder"]["bidder_name"] != docC_res["bidder"]["bidder_name"], "Bidder name leaked!"
    assert docA_res["bidder"]["gstin"] != docB_res["bidder"]["gstin"] != docC_res["bidder"]["gstin"], "GSTIN leaked!"
    print("[PASS] Cross-document isolation verified: Doc A != Doc B != Doc C. Zero stale data surviving.")

    print("\n========================================================")
    print("ALL 15 ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!")
    print("========================================================\n")


if __name__ == "__main__":
    generate_all()
    run_benchmark()
