"""
Synthetic Case Document Generator (SIH26100)
============================================
Generates synthetic demonstration PDF documents for the dormant case fixture system:

1. JBMD Case (FB-CASE-JBMD-001):
   - Complete document submission (GST, PAN, Turnover, OEM, Blacklisting)
   - Bid status: NOT_EVALUATED
   - Decision-traceability gap: Reason field absent in procurement record
   - Contains intentional decoy declared score to test score decoupling

2. NDMC/CCS Case (FB-CASE-NDMC-001):
   - Claimed turnover: INR 128,00,00,000 (128 Crore)
   - Verified turnover: INR 28,00,00,000 (28 Crore)
   - Cross-source discrepancy: INR 100,00,00,000 (100 Crore)
   - Clear synthetic disclaimers: NOT AN OFFICIAL GOVERNMENT RECORD

All data is 100% SYNTHETIC for demonstration purposes.
"""
import os
import fitz  # PyMuPDF


def generate_jbmd_case_pdf() -> bytes:
    """Generate the synthetic JBMD case demonstration PDF."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # Standard A4

    # Header banner
    page.draw_rect(fitz.Rect(30, 25, 565, 55), color=(0.1, 0.3, 0.6), fill=(0.93, 0.95, 0.98))
    page.insert_text(
        (40, 45),
        "FAIRBID DEMONSTRATION PLATFORM — CASE ACTIVATION TRIGGER",
        fontsize=10,
        fontname="helv",
        color=(0.1, 0.25, 0.55),
    )

    # Synthetic disclaimer banner
    page.draw_rect(fitz.Rect(30, 60, 565, 80), color=(0.8, 0.4, 0.0), fill=(1.0, 0.96, 0.88))
    page.insert_text(
        (40, 74),
        "SYNTHETIC DEMONSTRATION DOCUMENT — NOT AN OFFICIAL GOVERNMENT RECORD",
        fontsize=8.5,
        fontname="helv",
        color=(0.7, 0.3, 0.0),
    )

    # Title & Case Reference Box
    page.draw_rect(fitz.Rect(30, 90, 565, 140), color=(0.7, 0.7, 0.7), fill=(0.98, 0.98, 0.98))
    page.insert_text((40, 110), "Procurement Compliance Assessment Report", fontsize=15, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((40, 130), "Case Key: FB-CASE-JBMD-001", fontsize=12, fontname="helv", color=(0.0, 0.35, 0.7))
    page.insert_text((350, 130), "Tender Ref: SYNTH/JBMD/2026/001", fontsize=10, fontname="helv", color=(0.3, 0.3, 0.3))

    # Entity Details
    y = 160
    page.insert_text((40, y), "1. ENTITY INFORMATION", fontsize=11, fontname="helv", color=(0.1, 0.3, 0.6))
    page.draw_line((40, y + 3), (565, y + 3), color=(0.1, 0.3, 0.6), width=0.5)

    y += 20
    entity_info = [
        ("Legal Entity Name:", "JBMD Enterprises Pvt. Ltd."),
        ("Trade Name:", "JBMD Enterprises"),
        ("GSTIN:", "07AABCJ7001J1Z3 (State: Delhi)"),
        ("Permanent Account Number (PAN):", "AABCJ7001J"),
        ("Corporate Identity Number (CIN):", "U74999DL2014PTC271234"),
        ("Udyam Registration:", "UDYAM-DL-03-0071234 (Medium Enterprise)"),
        ("Registered Address:", "Block C, Nehru Place Business Centre, New Delhi 110019"),
    ]
    for label, val in entity_info:
        page.insert_text((45, y), label, fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
        page.insert_text((220, y), val, fontsize=9, fontname="helv", color=(0.0, 0.0, 0.0))
        y += 16

    # Submitted Documents
    y += 10
    page.insert_text((40, y), "2. SUBMITTED DOCUMENTATION — COMPLETION AUDIT", fontsize=11, fontname="helv", color=(0.1, 0.3, 0.6))
    page.draw_line((40, y + 3), (565, y + 3), color=(0.1, 0.3, 0.6), width=0.5)

    y += 20
    doc_table = [
        ("GST Registration Certificate", "VERIFIED", "Active registration, state code 07 (Delhi)"),
        ("PAN Card", "VERIFIED", "AABCJ7001J matches GSTIN 07AABCJ7001J1Z3"),
        ("Turnover Certificate (CA Certified)", "VERIFIED", "FY 2024-25 turnover INR 9,50,00,000 exceeds INR 5 Cr threshold"),
        ("OEM Authorization Letter", "VERIFIED", "Ref: OEM-HP-2026-JBMD-001, valid through 31/12/2027"),
        ("Non-Blacklisting Declaration", "VERIFIED", "Valid non-debarment affidavit submitted"),
        ("Udyam MSME Certificate", "VERIFIED", "UDYAM-DL-03-0071234 verified"),
        ("Make in India Local Content", "VERIFIED", "Class-I local supplier (>50% local content)"),
    ]
    for doc_name, stat, remark in doc_table:
        page.insert_text((45, y), doc_name, fontsize=8.5, fontname="helv", color=(0.1, 0.1, 0.1))
        page.insert_text((250, y), f"[{stat}]", fontsize=8.5, fontname="helv", color=(0.0, 0.5, 0.2))
        page.insert_text((310, y), remark[:45], fontsize=8, fontname="helv", color=(0.35, 0.35, 0.35))
        y += 15

    # Evaluation Status & Decision Traceability Gap
    y += 10
    page.insert_text((40, y), "3. PROCUREMENT RECORD & DECISION TRACEABILITY", fontsize=11, fontname="helv", color=(0.1, 0.3, 0.6))
    page.draw_line((40, y + 3), (565, y + 3), color=(0.1, 0.3, 0.6), width=0.5)

    y += 20
    page.draw_rect(fitz.Rect(40, y - 5, 565, y + 70), color=(0.8, 0.2, 0.2), fill=(1.0, 0.95, 0.95))
    page.insert_text((50, y + 10), "OBSERVED PROCUREMENT RECORD STATUS:", fontsize=9.5, fontname="helv", color=(0.7, 0.1, 0.1))
    page.insert_text((50, y + 25), "Recorded Bid Status: NOT_EVALUATED", fontsize=10, fontname="helv", color=(0.8, 0.1, 0.1))
    page.insert_text((50, y + 40), "Recorded Reason / Administrative Justification: [ABSENT / NOT RECORDED]", fontsize=10, fontname="helv", color=(0.8, 0.1, 0.1))
    page.insert_text((50, y + 55), "Bidder Clarification Request: Submitted — No response recorded on file", fontsize=9, fontname="helv", color=(0.4, 0.1, 0.1))

    # Decoy declared score to test score decoupling (Test 7)
    y += 90
    page.draw_rect(fitz.Rect(40, y - 5, 565, y + 40), color=(0.7, 0.7, 0.7), fill=(0.95, 0.95, 0.95))
    page.insert_text((50, y + 10), "DECLARED DOCUMENT FIELDS (FOR TESTING SCORE INDEPENDENCE):", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))
    page.insert_text((50, y + 25), "Document Declared Score: 86/100 | Declared Risk Tier: HIGH RISK (DECOY FIELD)", fontsize=8.5, fontname="helv", color=(0.4, 0.4, 0.4))

    # Footer
    page.draw_line((30, 800), (565, 800), color=(0.7, 0.7, 0.7), width=0.5)
    page.insert_text(
        (40, 815),
        "FairBid Procurement Integrity Demonstration System • Synthetic Benchmark Dataset • Activation: FB-CASE-JBMD-001",
        fontsize=7.5,
        fontname="helv",
        color=(0.5, 0.5, 0.5),
    )

    return doc.tobytes()


def generate_ndmc_case_pdf() -> bytes:
    """Generate the synthetic NDMC/CCS turnover discrepancy demonstration PDF."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # Standard A4

    # Header banner
    page.draw_rect(fitz.Rect(30, 25, 565, 55), color=(0.6, 0.1, 0.1), fill=(0.98, 0.93, 0.93))
    page.insert_text(
        (40, 45),
        "FAIRBID DEMONSTRATION PLATFORM — CROSS-SOURCE VERIFICATION REVIEW",
        fontsize=10,
        fontname="helv",
        color=(0.6, 0.1, 0.1),
    )

    # Synthetic disclaimer banner
    page.draw_rect(fitz.Rect(30, 60, 565, 80), color=(0.8, 0.4, 0.0), fill=(1.0, 0.96, 0.88))
    page.insert_text(
        (40, 74),
        "SYNTHETIC FAIRBID DEMONSTRATION — NOT AN OFFICIAL GOVERNMENT RECORD — NOT A REAL VERIFICATION",
        fontsize=7.5,
        fontname="helv",
        color=(0.7, 0.3, 0.0),
    )

    # Title & Case Reference Box
    page.draw_rect(fitz.Rect(30, 90, 565, 140), color=(0.7, 0.7, 0.7), fill=(0.98, 0.98, 0.98))
    page.insert_text((40, 110), "Financial Turnover Verification Audit Report", fontsize=15, fontname="helv", color=(0.1, 0.1, 0.1))
    page.insert_text((40, 130), "Case Key: FB-CASE-NDMC-001", fontsize=12, fontname="helv", color=(0.8, 0.2, 0.0))
    page.insert_text((350, 130), "Tender Ref: SYNTH/NDMC/2026/001", fontsize=10, fontname="helv", color=(0.3, 0.3, 0.3))

    # Entity Details
    y = 160
    page.insert_text((40, y), "1. BIDDER IDENTIFICATION", fontsize=11, fontname="helv", color=(0.1, 0.3, 0.6))
    page.draw_line((40, y + 3), (565, y + 3), color=(0.1, 0.3, 0.6), width=0.5)

    y += 20
    entity_info = [
        ("Legal Entity Name:", "CCS Computers Pvt. Ltd."),
        ("Trade Name:", "CCS Computers"),
        ("GSTIN:", "07AABCC8008C1Z9 (State: Delhi)"),
        ("Permanent Account Number (PAN):", "AABCC8008C"),
        ("Corporate Identity Number (CIN):", "U72200DL2010PTC205678"),
        ("Registered Address:", "Floor 4, Bhikaji Cama Place, New Delhi 110066"),
        ("Tender Title:", "NDMC IT Equipment Procurement (SYNTH/NDMC/2026/001)"),
    ]
    for label, val in entity_info:
        page.insert_text((45, y), label, fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
        page.insert_text((220, y), val, fontsize=9, fontname="helv", color=(0.0, 0.0, 0.0))
        y += 16

    # Cross-Source Turnover Discrepancy (Material Exception)
    y += 10
    page.insert_text((40, y), "2. CROSS-SOURCE FINANCIAL VERIFICATION AUDIT", fontsize=11, fontname="helv", color=(0.7, 0.1, 0.1))
    page.draw_line((40, y + 3), (565, y + 3), color=(0.7, 0.1, 0.1), width=0.5)

    y += 20
    # Big discrepancy highlight box
    page.draw_rect(fitz.Rect(40, y - 5, 565, y + 120), color=(0.85, 0.15, 0.15), fill=(1.0, 0.94, 0.94))
    page.insert_text((50, y + 12), "CRITICAL EXCEPTION: MATERIAL FINANCIAL DISCREPANCY DETECTED", fontsize=11, fontname="helv", color=(0.8, 0.0, 0.0))

    page.insert_text((50, y + 32), "Claimed Annual Turnover (FY 2024-25):", fontsize=9.5, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text((320, y + 32), "INR 128,00,00,000 (128 Crore)", fontsize=10.5, fontname="helv", color=(0.0, 0.0, 0.0))

    page.insert_text((50, y + 50), "Verified Annual Turnover (Simulated Record):", fontsize=9.5, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text((320, y + 50), "INR 28,00,00,000 (28 Crore)", fontsize=10.5, fontname="helv", color=(0.0, 0.0, 0.0))

    page.insert_text((50, y + 70), "Calculated Discrepancy Delta:", fontsize=10, fontname="helv", color=(0.7, 0.0, 0.0))
    page.insert_text((320, y + 70), "INR 100,00,00,000 (100 Crore Delta)", fontsize=11, fontname="helv", color=(0.85, 0.0, 0.0))

    page.insert_text((50, y + 90), "Discrepancy Severity:", fontsize=9.5, fontname="helv", color=(0.3, 0.3, 0.3))
    page.insert_text((320, y + 90), "CRITICAL — MATERIAL EXCEPTION (457% Variance)", fontsize=10, fontname="helv", color=(0.85, 0.0, 0.0))

    page.insert_text((50, y + 107), "Verification Source:", fontsize=8.5, fontname="helv", color=(0.4, 0.4, 0.4))
    page.insert_text((320, y + 107), "Simulated Authorized Verification Source", fontsize=8.5, fontname="helv", color=(0.4, 0.4, 0.4))

    # Audit Note
    y += 140
    page.insert_text((40, y), "3. AUDIT RECOMMENDATION & PROCEDURAL ACTION", fontsize=11, fontname="helv", color=(0.1, 0.3, 0.6))
    page.draw_line((40, y + 3), (565, y + 3), color=(0.1, 0.3, 0.6), width=0.5)

    y += 20
    notes = [
        "1. Material inconsistency between bidder-submitted CA turnover certificate and authorized source record.",
        "2. Mandatory requirement REQ-TURNOVER marked NON_COMPLIANT pending clarification.",
        "3. Requirement of GFR Rule 173: Procurement officer review required prior to commercial opening.",
        "4. Action: Issue formal query to bidder and requisition certified ROC/MCA annual filings.",
    ]
    for n in notes:
        page.insert_text((45, y), n, fontsize=8.5, fontname="helv", color=(0.2, 0.2, 0.2))
        y += 16

    # Decoy score field for testing (Test 7)
    y += 20
    page.draw_rect(fitz.Rect(40, y - 5, 565, y + 35), color=(0.7, 0.7, 0.7), fill=(0.95, 0.95, 0.95))
    page.insert_text((50, y + 10), "DECLARED DOCUMENT FIELDS (FOR TESTING SCORE INDEPENDENCE):", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))
    page.insert_text((50, y + 23), "Document Declared Score: 12/100 | Declared Status: SUSPENDED (DECOY FIELD)", fontsize=8.5, fontname="helv", color=(0.4, 0.4, 0.4))

    # Footer
    page.draw_line((30, 800), (565, 800), color=(0.7, 0.7, 0.7), width=0.5)
    page.insert_text(
        (40, 815),
        "FairBid Procurement Integrity Demonstration System • Synthetic Benchmark Dataset • Activation: FB-CASE-NDMC-001",
        fontsize=7.5,
        fontname="helv",
        color=(0.5, 0.5, 0.5),
    )

    return doc.tobytes()


def generate_case_pdf(case_key: str) -> bytes:
    """Generate synthetic PDF by case key ('FB-CASE-JBMD-001' or 'FB-CASE-NDMC-001')."""
    key = (case_key or "").upper().strip()
    if "JBMD" in key:
        return generate_jbmd_case_pdf()
    elif "NDMC" in key:
        return generate_ndmc_case_pdf()
    else:
        raise ValueError(f"Unknown demo case key: '{case_key}'. Supported: FB-CASE-JBMD-001, FB-CASE-NDMC-001")


def save_demo_documents(output_dir: str) -> dict[str, str]:
    """Pre-generate demo PDFs to the specified directory for tests / UI upload."""
    os.makedirs(output_dir, exist_ok=True)
    jbmd_path = os.path.join(output_dir, "FairBid_Case_JBMD_001.pdf")
    ndmc_path = os.path.join(output_dir, "FairBid_Case_NDMC_001.pdf")

    with open(jbmd_path, "wb") as f:
        f.write(generate_jbmd_case_pdf())

    with open(ndmc_path, "wb") as f:
        f.write(generate_ndmc_case_pdf())

    return {
        "FB-CASE-JBMD-001": jbmd_path,
        "FB-CASE-NDMC-001": ndmc_path,
    }


if __name__ == "__main__":
    demo_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "demo_documents")
    paths = save_demo_documents(demo_dir)
    print(f"Generated demo case documents: {paths}")
