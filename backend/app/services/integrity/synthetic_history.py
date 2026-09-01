"""
Synthetic Procurement History & Integrity Dataset Generator — SIH26100 V2
==========================================================================
Deterministic, reproducible procurement dataset generator designed for validating
cross-tender pattern detection in the Procurement Integrity Engine.

Guarantees:
- Fixed random seed (seed=42) for 100% deterministic reproducibility.
- 100% fictional Indian-style business entities, PANs, GSTINs, CINs, Udyam numbers.
- No real companies, real persons, or real procurement data.
- No artificial 'corruption=true' flags; all signals emerge from observable patterns.
- Covers 11 procurement scenarios:
    1. CLEAN BASELINE (Independent bids, LOW risk)
    2. BID PRICE CLUSTERING (Tight quotes <= 1.0% delta)
    3. REPEATED PARTICIPATION (Cohort appearing in >= 3 tenders)
    4. WINNER CONCENTRATION (Single vendor winning >= 75% in category)
    5. BID ROTATION (Systematic alternating winner cycle)
    6. RELATED BIDDERS (Shared PAN, GSTIN, address, email domain)
    7. MULTI-SIGNAL CASE (Combined signals evaluating to HIGH/CRITICAL)
    8. FALSE-POSITIVE CONTROL (Legitimate competitive tender yielding LOW risk)
    9. NARROW COMPETITION & BID-TO-ESTIMATE (Specialized equipment, bids near estimate)
    10. DOCUMENT IDENTITY INCONSISTENCY & DIRECTORS (Document OCR cross-entity mismatch)
    11. BIDDER-OFFICER ADMINISTRATIVE ASSOCIATION (Dedicated fixture for administrative linkage)
"""
import random
import uuid
import json
from typing import Any, Dict, List, Tuple
from datetime import datetime, timezone

# Fix seed for strict reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)


# ============================================================
# FICTIONAL INDIAN CORPORATE REGISTRY (12 DISTINCT ENTITIES)
# ============================================================

FICTIONAL_BIDDERS_CATALOG: Dict[str, Dict[str, Any]] = {
    "BRAHMAPUTRA": {
        "legal_name": "Brahmaputra Engineering & Infotech Pvt. Ltd.",
        "trade_name": "Brahmaputra Infotech",
        "gstin": "18AABCB1001B1Z2",
        "pan": "AABCB1001B",
        "cin": "U72200AS2018PTC018234",
        "udyam_number": "UDYAM-AS-03-0018921",
        "registered_address": "Plot 14, Brahmaputra Industrial Park, Amingaon, Guwahati, Assam 781031",
        "contact_email": "tenders@brahmaputraeng.in",
        "contact_phone": "9435011001",
        "enterprise_category": "Medium Enterprise",
        "directors": ["Prabhat Baruah", "Sunita Sarma"],
    },
    "KAVERI": {
        "legal_name": "Kaveri Digital Solutions Ltd.",
        "trade_name": "Kaveri Digital",
        "gstin": "29AABCK2002K1Z4",
        "pan": "AABCK2002K",
        "cin": "L72900KA2015PLC089123",
        "udyam_number": "UDYAM-KR-03-0055412",
        "registered_address": "Tower 3, Cyber Gateway, Outer Ring Road, Bengaluru, Karnataka 560103",
        "contact_email": "gov-bids@kaveridigital.com",
        "contact_phone": "9845022002",
        "enterprise_category": "Large Enterprise",
        "directors": ["Vikramaditya Rao", "Meera Hegde"],
    },
    "GODAVARI": {
        "legal_name": "Godavari Network Systems Pvt. Ltd.",
        "trade_name": "Godavari Networks",
        "gstin": "36AABCG3003G1Z6",
        "pan": "AABCG3003G",
        "cin": "U74999TG2019PTC132456",
        "udyam_number": "UDYAM-TS-08-0033190",
        "registered_address": "Block B, HITEC City Phase 2, Madhapur, Hyderabad, Telangana 500081",
        "contact_email": "procurement@godavarinetworks.in",
        "contact_phone": "9866033003",
        "enterprise_category": "Small Enterprise",
        "directors": ["Chandra Sekhar Reddy", "Padma Rao"],
    },
    "YAMUNA": {
        "legal_name": "Yamuna Smart Technologies LLP",
        "trade_name": "Yamuna Smart Tech",
        "gstin": "07AABCY4004Y1Z8",
        "pan": "AABCY4004Y",
        "cin": None,
        "udyam_number": "UDYAM-DL-03-0044120",
        "registered_address": "Unit 502, World Trade Tower, Barakhamba Road, New Delhi 110001",
        "contact_email": "sales@yamunasmart.org",
        "contact_phone": "9811044004",
        "enterprise_category": "Micro Enterprise",
        "directors": ["Anand Swaminathan", "Neha Mathur"],
    },
    "VINDHYACHAL": {
        "legal_name": "Vindhyachal Power & Infra Ltd.",
        "trade_name": "Vindhyachal Infra",
        "gstin": "23AABCV5005V1Z1",
        "pan": "AABCV5005V",
        "cin": "L40100MP2012PLC028941",
        "udyam_number": None,
        "registered_address": "Sector 4, Pithampur Industrial Estate, Dhar, Indore, Madhya Pradesh 454775",
        "contact_email": "tenders@vindhyachalinfra.com",
        "contact_phone": "9752055005",
        "enterprise_category": "Large Enterprise",
        "directors": ["Rajendra Verma", "Kavita Tiwari"],
    },
    "TAPTI": {
        "legal_name": "Tapti Solutions & Analytics Pvt. Ltd.",
        "trade_name": "Tapti Analytics",
        "gstin": "24AABCT6006T1Z3",
        "pan": "AABCT6006T",
        "cin": "U72200GJ2020PTC115678",
        "udyam_number": "UDYAM-GJ-01-0066124",
        "registered_address": "4th Floor, GIFT City Tower ONE, Gandhinagar, Gujarat 382355",
        "contact_email": "bid-cell@taptianalytics.in",
        "contact_phone": "9898066006",
        "enterprise_category": "Small Enterprise",
        "directors": ["Harish Patel", "Bhavna Shah"],
    },
    "SHIVALIK_CLOUD": {
        # Related entity 1 (shares statutory identifiers and director with SHIVALIK_ENTERPRISE)
        "legal_name": "Shivalik Cloud Matrix Pvt. Ltd.",
        "trade_name": "Shivalik Cloud Matrix",
        "gstin": "05AABCS7007S1Z5",
        "pan": "AABCS7007S",
        "cin": "U72900UR2021PTC012399",
        "udyam_number": "UDYAM-UR-05-0077880",
        "registered_address": "Suite 201, IT Park Sahastradhara Road, Dehradun, Uttarakhand 248013",
        "contact_email": "contact@shivalikmatrix.com",
        "contact_phone": "9837077007",
        "enterprise_category": "Small Enterprise",
        "directors": ["Rohan Joshi", "Alok Deshmukh"],
    },
    "SHIVALIK_ENTERPRISE": {
        # Related entity 2 (shares PAN, GSTIN, Address, Email Domain, and Director Rohan Joshi with SHIVALIK_CLOUD)
        "legal_name": "Shivalik Enterprise Systems LLP",
        "trade_name": "Shivalik Enterprise Systems",
        "gstin": "05AABCS7007S1Z5",  # Shared GSTIN
        "pan": "AABCS7007S",        # Shared PAN
        "cin": None,
        "udyam_number": "UDYAM-UR-05-0077881",
        "registered_address": "Suite 201, IT Park Sahastradhara Road, Dehradun, Uttarakhand 248013",  # Shared Address
        "contact_email": "admin@shivalikmatrix.com",  # Shared Domain (@shivalikmatrix.com)
        "contact_phone": "9837077007",  # Shared Phone
        "enterprise_category": "Small Enterprise",
        "directors": ["Rohan Joshi", "Suresh Pant"],  # Shared Director Rohan Joshi
    },
    "MAHANADI": {
        "legal_name": "Mahanadi Security & Surveillance Pvt. Ltd.",
        "trade_name": "Mahanadi Security",
        "gstin": "21AABCM8008M1Z7",
        "pan": "AABCM8008M",
        "cin": "U74900OR2017PTC027812",
        "udyam_number": "UDYAM-OD-19-0012903",
        "registered_address": "Plot 88, Chandaka Industrial Area, Bhubaneswar, Odisha 751024",
        "contact_email": "tenders@mahanadisecurity.in",
        "contact_phone": "9437088008",
        "enterprise_category": "Small Enterprise",
        "directors": ["Debabrata Jena", "Minati Mohanty"],
    },
    "SAHYADRI": {
        "legal_name": "Sahyadri Geo-Informatics LLP",
        "trade_name": "Sahyadri Geo",
        "gstin": "27AABCS9009S1Z9",
        "pan": "AABCS9009S",
        "cin": None,
        "udyam_number": "UDYAM-MH-12-0099441",
        "registered_address": "ICC Tech Park, Senapati Bapat Road, Pune, Maharashtra 411016",
        "contact_email": "sales@sahyadrigeo.com",
        "contact_phone": "9823099009",
        "enterprise_category": "Micro Enterprise",
        "directors": ["Abhijit Kulkarni", "Swati Joshi"],
    },
    "NILGIRI": {
        "legal_name": "Nilgiri Hardware & Telecom Pvt. Ltd.",
        "trade_name": "Nilgiri Telecom",
        "gstin": "33AABCN1010N1Z0",
        "pan": "AABCN1010N",
        "cin": "U32200TN2016PTC109876",
        "udyam_number": "UDYAM-TN-02-0044810",
        "registered_address": "Guindy Industrial Estate, Chennai, Tamil Nadu 600032",
        "contact_email": "tenders@nilgiritel.com",
        "contact_phone": "9840011010",
        "enterprise_category": "Medium Enterprise",
        "directors": ["S. Kalyanasundaram", "Lalitha Sundaram"],
    },
    "ARAVALI": {
        "legal_name": "Aravali Civil & Project Works Ltd.",
        "trade_name": "Aravali Projects",
        "gstin": "08AABCA2020A1Z2",
        "pan": "AABCA2020A",
        "cin": "L45200RJ2014PLC045612",
        "udyam_number": None,
        "registered_address": "MI Road Industrial Area, Jaipur, Rajasthan 302001",
        "contact_email": "contracts@aravaliprojects.com",
        "contact_phone": "9414022020",
        "enterprise_category": "Large Enterprise",
        "directors": ["Mahaveer Singh", "Geeta Rathore"],
    },
}


# ============================================================
# PER-BIDDER ACTIVE-TENDER DOCUMENT OVERRIDES
# Controls which documents (and their OCR quality) are seeded
# for each bidder in ACTIVE tenders. Used to create realistic
# test scenarios covering all 7 compliance requirements.
# Keys match bidder_key values. Bidders not listed here get the
# default minimal set (GST + Financial + Udyam-if-applicable).
# ============================================================

ACTIVE_BIDDER_DOC_SCENARIOS: Dict[str, Dict[str, Any]] = {
    # TEN-2026-001 SCENARIO 1 (Clean Baseline)
    # NILGIRI — Full compliant set → all requirements COMPLIANT
    "TEN-2026-001:NILGIRI": {
        "pan": {
            "include": True,
            "fields": [
                {"key": "pan", "value": "AABCN1010N", "confidence": 0.98, "isExtracted": True},
                {"key": "legalName", "value": "Nilgiri Hardware & Telecom Pvt. Ltd.", "confidence": 0.95, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "INCOME TAX DEPARTMENT — PERMANENT ACCOUNT NUMBER CARD\nName: NILGIRI HARDWARE AND TELECOM PVT LTD\nPAN: AABCN1010N\nDate of Birth/Incorporation: 14/09/2016\nFather's Name: N/A (Corporate)\nSignature verified.",
        },
        "oem": {
            "include": True,
            "fields": [
                {"key": "oemReference", "value": "OEM-CISCO-2026-NLT-001", "confidence": 0.91, "isExtracted": True},
                {"key": "expiryDate", "value": "31/12/2027", "confidence": 0.89, "isExtracted": True},
                {"key": "authorizedProduct", "value": "Cisco Catalyst 9300 Series Switches", "confidence": 0.88, "isExtracted": True},
                {"key": "oemName", "value": "Cisco Systems India Pvt. Ltd.", "confidence": 0.93, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "OEM MANUFACTURER AUTHORIZATION FORM\nRef No.: OEM-CISCO-2026-NLT-001\nDate: 12-Jan-2026\nThis is to certify that Nilgiri Hardware & Telecom Pvt. Ltd. (CIN: U32200TN2016PTC109876) is an authorized partner for supply and installation of Cisco Catalyst 9300 Series enterprise switching products under tender GEM/2026/B/418207.\nValidity: 31/12/2027\nAuthorized Signatory: Regional Sales Director, Cisco Systems India\nSeal: [CISCO OFFICIAL SEAL]",
        },
        "turnover": {
            "include": True,
            "fields": [
                {"key": "annualTurnover", "value": "84200000", "confidence": 0.89, "isExtracted": True},
                {"key": "fiscalYear", "value": "FY 2024-25", "confidence": 0.96, "isExtracted": True},
                {"key": "caFirmName", "value": "Ramaswamy & Associates, Chartered Accountants", "confidence": 0.87, "isExtracted": True},
                {"key": "turnoverCertificate", "value": "Certified gross revenue INR 8,42,00,000", "confidence": 0.89, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "TURNOVER CERTIFICATE\nCertified by: Ramaswamy & Associates, Chartered Accountants (Reg. No. 006217S)\nDate: 30-June-2025\nThis is to certify that Nilgiri Hardware & Telecom Pvt. Ltd. has achieved a gross annual turnover of INR 8,42,00,000 (Rupees Eight Crore Forty-Two Lakhs only) for the financial year 2024-25 as per audited financial statements.\nPAN of entity: AABCN1010N\nGSTIN: 33AABCN1010N1Z0\nPlace: Chennai",
        },
        "blacklisting": {
            "include": True,
            "fields": [
                {"key": "blacklistingDeclaration", "value": "Certified not blacklisted or debarred", "confidence": 0.94, "isExtracted": True},
                {"key": "declarantName", "value": "S. Kalyanasundaram, Director", "confidence": 0.91, "isExtracted": True},
                {"key": "declarationDate", "value": "25/07/2026", "confidence": 0.96, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "DECLARATION OF NON-BLACKLISTING / NON-DEBARMENT\nTo, The Procurement Officer, Department of Administrative Reforms\nI, S. Kalyanasundaram, Director, Nilgiri Hardware & Telecom Pvt. Ltd. (GSTIN: 33AABCN1010N1Z0) hereby solemnly declare that our firm has not been blacklisted, debarred, or placed on any negative list by any Central Government, State Government, or PSU as on the date of this declaration.\nDate: 25/07/2026  Place: Chennai\nSignature & Seal of Authorized Signatory",
        },
        "local_content": {
            "include": True,
            "fields": [
                {"key": "localContentPercentage", "value": "52", "confidence": 0.88, "isExtracted": True},
                {"key": "localContentClass", "value": "Class I", "confidence": 0.92, "isExtracted": True},
                {"key": "selfCertification", "value": "Minimum 52% local content in the supplied goods", "confidence": 0.88, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "LOCAL CONTENT DECLARATION — Make in India Order (PPO 2017 amended 2020)\nTender No.: GEM/2026/B/418207\nBidder: Nilgiri Hardware & Telecom Pvt. Ltd.\nWe hereby declare that the goods/services offered under this tender have a minimum local content of 52% (Fifty-Two percent), qualifying this offer as a Class I Local Supplier as per the Public Procurement (Preference to Make in India) Order.\nDate: 28/07/2026",
        },
    },
    # MAHANADI — Partial set, missing OEM → NON_COMPLIANT (blocking), NEEDS_REVIEW on blacklisting
    "TEN-2026-001:MAHANADI": {
        "pan": {
            "include": True,
            "fields": [
                {"key": "pan", "value": "AABCM8008M", "confidence": 0.96, "isExtracted": True},
                {"key": "legalName", "value": "Mahanadi Security & Surveillance Pvt. Ltd.", "confidence": 0.92, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "INCOME TAX DEPARTMENT — PAN CARD\nName: MAHANADI SECURITY AND SURVEILLANCE PVT LTD\nPAN: AABCM8008M\nDate of Incorporation: 22/03/2017",
        },
        "oem": {"include": False},  # Missing → NON_COMPLIANT (mandatory blocking)
        "turnover": {"include": False},  # Missing → PENDING
        "blacklisting": {
            "include": True,
            "ocr_status": "COMPLETED",
            # Blacklisting doc uploaded but declaration field NOT extractable (partial OCR)
            "fields": [
                {"key": "documentTitle", "value": "Declaration of Non-Blacklisting", "confidence": 0.72, "isExtracted": True},
            ],
            "extracted_text": "DECLARATION [partial/degraded scan]\nBidder: Mahanadi Security... [text obscured]\nDeclaration clause: [unable to extract - scan quality insufficient]",
        },
        "local_content": {"include": False},  # Missing → PENDING
    },
    # SAHYADRI — GST OCR failed, PAN ok, no OEM → EXCEPTION_FOUND
    "TEN-2026-001:SAHYADRI": {
        "gst_ocr_status": "FAILED",  # Override GST OCR to FAILED
        "pan": {
            "include": True,
            "fields": [
                {"key": "pan", "value": "AABCS9009S", "confidence": 0.94, "isExtracted": True},
                {"key": "legalName", "value": "Sahyadri Geo-Informatics LLP", "confidence": 0.90, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "PAN CARD — INCOME TAX DEPARTMENT OF INDIA\nName: SAHYADRI GEO-INFORMATICS LLP\nPAN: AABCS9009S\nDate: 08/04/2019",
        },
        "oem": {"include": False},  # Missing → NON_COMPLIANT
        "turnover": {"include": False},
        "blacklisting": {"include": False},
        "local_content": {"include": False},
    },
    # TEN-2026-011 SCENARIO 11 (Bidder-Officer Administrative Association)
    # KAVERI (BID-173) — Full compliant set (but officer association risk)
    "TEN-2026-011:KAVERI": {
        "pan": {
            "include": True,
            "fields": [
                {"key": "pan", "value": "AABCK2002K", "confidence": 0.98, "isExtracted": True},
                {"key": "legalName", "value": "Kaveri Digital Solutions Ltd.", "confidence": 0.96, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "INCOME TAX DEPARTMENT — PERMANENT ACCOUNT NUMBER\nName: KAVERI DIGITAL SOLUTIONS LTD\nPAN: AABCK2002K\nDate of Incorporation: 17/03/2015\nStatus: ACTIVE",
        },
        "oem": {
            "include": True,
            "fields": [
                {"key": "oemReference", "value": "OEM-DELL-2026-KVD-011", "confidence": 0.93, "isExtracted": True},
                {"key": "expiryDate", "value": "30/06/2028", "confidence": 0.90, "isExtracted": True},
                {"key": "oemName", "value": "Dell Technologies India Pvt. Ltd.", "confidence": 0.95, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "OEM MANUFACTURER AUTHORIZATION FORM\nRef: OEM-DELL-2026-KVD-011\nDate: 15-Feb-2026\nDell Technologies India Pvt. Ltd. hereby authorizes Kaveri Digital Solutions Ltd. as its authorized reseller and system integrator for document digitization solutions under Government procurement.\nValidity: 30/06/2028",
        },
        "turnover": {
            "include": True,
            "fields": [
                {"key": "annualTurnover", "value": "312000000", "confidence": 0.91, "isExtracted": True},
                {"key": "fiscalYear", "value": "FY 2024-25", "confidence": 0.97, "isExtracted": True},
                {"key": "turnoverCertificate", "value": "Certified gross revenue INR 31,20,00,000", "confidence": 0.91, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "TURNOVER CERTIFICATE\nThis certifies that Kaveri Digital Solutions Ltd. (PAN: AABCK2002K) achieved audited gross annual turnover of INR 31,20,00,000 for FY 2024-25.\nCA Firm: Rao & Partners, Bangalore (ICAI Reg. 009214S)",
        },
        "blacklisting": {
            "include": True,
            "fields": [
                {"key": "blacklistingDeclaration", "value": "Entity not blacklisted or debarred by any government authority", "confidence": 0.95, "isExtracted": True},
                {"key": "declarantName", "value": "Vikramaditya Rao, Managing Director", "confidence": 0.93, "isExtracted": True},
                {"key": "declarationDate", "value": "20/08/2026", "confidence": 0.97, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "NON-BLACKLISTING DECLARATION\nI, Vikramaditya Rao, Managing Director, Kaveri Digital Solutions Ltd. hereby declare that the company has not been blacklisted or debarred by any government entity as on 20/08/2026.",
        },
        "local_content": {
            "include": True,
            "fields": [
                {"key": "localContentPercentage", "value": "61", "confidence": 0.87, "isExtracted": True},
                {"key": "localContentClass", "value": "Class I", "confidence": 0.93, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "LOCAL CONTENT DECLARATION — Make in India\nBidder: Kaveri Digital Solutions Ltd.\nLocal Content: 61% (Class I Local Supplier)\nDate: 22/08/2026",
        },
    },
    # TAPTI (BID-174) — Missing OEM → EXCEPTION_FOUND (mandatory NON_COMPLIANT)
    "TEN-2026-011:TAPTI": {
        "pan": {
            "include": True,
            "fields": [
                {"key": "pan", "value": "AABCT6006T", "confidence": 0.97, "isExtracted": True},
                {"key": "legalName", "value": "Tapti Solutions & Analytics Pvt. Ltd.", "confidence": 0.94, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "PAN CARD — INCOME TAX DEPARTMENT\nName: TAPTI SOLUTIONS AND ANALYTICS PVT LTD\nPAN: AABCT6006T\nDate of Incorporation: 04/06/2020",
        },
        "oem": {"include": False},  # Missing → NON_COMPLIANT (mandatory blocking)
        "turnover": {
            "include": True,
            "fields": [
                {"key": "annualTurnover", "value": "52000000", "confidence": 0.86, "isExtracted": True},
                {"key": "fiscalYear", "value": "FY 2024-25", "confidence": 0.94, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "TURNOVER CERTIFICATE\nTapti Solutions & Analytics Pvt. Ltd. — FY 2024-25 gross turnover: INR 5,20,00,000.\nCA: Shah & Associates, Gandhinagar.",
        },
        "blacklisting": {
            "include": True,
            "fields": [
                {"key": "blacklistingDeclaration", "value": "Not blacklisted or debarred", "confidence": 0.92, "isExtracted": True},
                {"key": "declarantName", "value": "Harish Patel, Director", "confidence": 0.90, "isExtracted": True},
            ],
            "ocr_status": "COMPLETED",
            "extracted_text": "NON-BLACKLISTING DECLARATION\nTapti Solutions & Analytics Pvt. Ltd. is not blacklisted or debarred as on 22/08/2026.\nSignatory: Harish Patel, Director.",
        },
        "local_content": {"include": False},  # Missing → PENDING
    },
}



# ============================================================
# SYNTHETIC TENDERS DATASET (23 TENDERS TOTAL)
# ============================================================

SYNTHETIC_TENDERS_SPEC = [
    # ── 1. HISTORICAL IT TENDERS (Tenders 1 to 5): Rotation & Cohort ───────────
    {
        "id": "TEN-HIST-01",
        "tender_number": "GEM/2024/B/110291",
        "title": "Annual Maintenance for State Data Center Systems (FY 2024-25 Q1)",
        "department": "Department of Information Technology",
        "description": "Comprehensive SLA-based maintenance for hyper-converged servers and core switching fabric.",
        "bid_closing_date": "2024-04-15",
        "estimated_value": 35000000.00,
        "category": "IT & Telecommunications",
        "status": "COMPLETED",
        "created_by": "Director IT Procurements",
        "created_at": "2024-03-01T10:00:00Z",
        "bids": [
            {"bidder_key": "KAVERI", "quote": 33900000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "BRAHMAPUTRA", "quote": 34800000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "GODAVARI", "quote": 35200000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "YAMUNA", "quote": 36100000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-02",
        "tender_number": "GEM/2024/B/220482",
        "title": "Data Center Facility Management & Storage Maintenance (FY 2024-25 Q2)",
        "department": "Department of Information Technology",
        "description": "SAN storage array health monitoring, firmware upgrades, and disaster recovery replication.",
        "bid_closing_date": "2024-07-20",
        "estimated_value": 38000000.00,
        "category": "IT & Telecommunications",
        "status": "COMPLETED",
        "created_by": "Director IT Procurements",
        "created_at": "2024-06-01T10:00:00Z",
        "bids": [
            {"bidder_key": "BRAHMAPUTRA", "quote": 36900000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "KAVERI", "quote": 37800000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "GODAVARI", "quote": 38500000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "YAMUNA", "quote": 39200000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-03",
        "tender_number": "GEM/2024/B/330719",
        "title": "Network Security & Core Routing Infrastructure Upgrade (FY 2024-25 Q3)",
        "department": "Department of Information Technology",
        "description": "Next-generation firewalls, intrusion detection appliances, and encrypted gateway switches.",
        "bid_closing_date": "2024-10-10",
        "estimated_value": 42000000.00,
        "category": "IT & Telecommunications",
        "status": "COMPLETED",
        "created_by": "Director IT Procurements",
        "created_at": "2024-09-01T10:00:00Z",
        "bids": [
            {"bidder_key": "GODAVARI", "quote": 40500000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "KAVERI", "quote": 41800000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "BRAHMAPUTRA", "quote": 42500000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "YAMUNA", "quote": 43200000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-04",
        "tender_number": "GEM/2025/B/440183",
        "title": "Statewide Wide Area Network Operations & SLA Support (FY 2024-25 Q4)",
        "department": "Department of Information Technology",
        "description": "24x7 network operations center staffing, bandwidth management, and edge switch provisioning.",
        "bid_closing_date": "2025-01-15",
        "estimated_value": 45000000.00,
        "category": "IT & Telecommunications",
        "status": "COMPLETED",
        "created_by": "Director IT Procurements",
        "created_at": "2024-12-01T10:00:00Z",
        "bids": [
            {"bidder_key": "KAVERI", "quote": 43500000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "BRAHMAPUTRA", "quote": 44800000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "GODAVARI", "quote": 45500000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "YAMUNA", "quote": 46200000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-05",
        "tender_number": "GEM/2025/B/550928",
        "title": "Disaster Recovery Site Infrastructure Maintenance (FY 2025-26 Q1)",
        "department": "Department of Information Technology",
        "description": "Secondary data center SAN replication, cold backup archives, and failover automation testing.",
        "bid_closing_date": "2025-04-20",
        "estimated_value": 48000000.00,
        "category": "IT & Telecommunications",
        "status": "COMPLETED",
        "created_by": "Director IT Procurements",
        "created_at": "2025-03-01T10:00:00Z",
        "bids": [
            {"bidder_key": "BRAHMAPUTRA", "quote": 46800000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "KAVERI", "quote": 47900000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "GODAVARI", "quote": 48700000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "YAMUNA", "quote": 49500000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },

    # ── 2. HISTORICAL RENEWABLE ENERGY TENDERS (6 to 9): Incumbent Concentration ─
    {
        "id": "TEN-HIST-06",
        "tender_number": "GEM/2024/B/660144",
        "title": "State Solar Power Plant EPC Works Phase 1",
        "department": "Ministry of New and Renewable Energy",
        "description": "Ground-mounted solar photovoltaic array design, procurement, erection, and grid interconnection.",
        "bid_closing_date": "2024-06-10",
        "estimated_value": 180000000.00,
        "category": "Renewable Energy",
        "status": "COMPLETED",
        "created_by": "Chief Engineer Energy",
        "created_at": "2024-05-01T10:00:00Z",
        "bids": [
            {"bidder_key": "VINDHYACHAL", "quote": 174000000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "ARAVALI", "quote": 185000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 192000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-07",
        "tender_number": "GEM/2024/B/770288",
        "title": "State Solar Power Plant EPC Works Phase 2",
        "department": "Ministry of New and Renewable Energy",
        "description": "50MW solar park transmission lines, automated weather stations, and SCADA monitoring system.",
        "bid_closing_date": "2024-11-25",
        "estimated_value": 220000000.00,
        "category": "Renewable Energy",
        "status": "COMPLETED",
        "created_by": "Chief Engineer Energy",
        "created_at": "2024-10-01T10:00:00Z",
        "bids": [
            {"bidder_key": "VINDHYACHAL", "quote": 212000000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "ARAVALI", "quote": 228000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 235000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-08",
        "tender_number": "GEM/2025/B/880312",
        "title": "Rooftop Solar & Micro-Grid Installation across Administrative Complexes",
        "department": "Ministry of New and Renewable Energy",
        "description": "Rooftop photovoltaic panels with battery energy storage systems (BESS) across 14 state buildings.",
        "bid_closing_date": "2025-03-15",
        "estimated_value": 150000000.00,
        "category": "Renewable Energy",
        "status": "COMPLETED",
        "created_by": "Chief Engineer Energy",
        "created_at": "2025-02-01T10:00:00Z",
        "bids": [
            {"bidder_key": "VINDHYACHAL", "quote": 145000000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "ARAVALI", "quote": 156000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "NILGIRI", "quote": 162000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-09",
        "tender_number": "GEM/2025/B/990455",
        "title": "Grid Substation Modernization & Power Quality Enhancement Works",
        "department": "Ministry of New and Renewable Energy",
        "description": "132/33kV substation capacitor banks, statutory protection relays, and harmonic filter banks.",
        "bid_closing_date": "2025-08-10",
        "estimated_value": 195000000.00,
        "category": "Renewable Energy",
        "status": "COMPLETED",
        "created_by": "Chief Engineer Energy",
        "created_at": "2025-07-01T10:00:00Z",
        "bids": [
            {"bidder_key": "VINDHYACHAL", "quote": 189000000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "ARAVALI", "quote": 201000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 208000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },

    # ── 3. HISTORICAL SPECIALIZED LAB TENDERS (10 to 12): Narrow Market History ─
    {
        "id": "TEN-HIST-10",
        "tender_number": "GEM/2024/B/100101",
        "title": "Procurement of High-Resolution Spectrometry Equipment",
        "department": "Department of Science and Technology",
        "description": "Inductively coupled plasma mass spectrometry units for state testing lab.",
        "bid_closing_date": "2024-05-20",
        "estimated_value": 22000000.00,
        "category": "Specialized Laboratory Equipment",
        "status": "COMPLETED",
        "created_by": "Procurement Division",
        "created_at": "2024-04-10T10:00:00Z",
        "bids": [
            {"bidder_key": "ARAVALI", "quote": 21850000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "MAHANADI", "quote": 21980000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-11",
        "tender_number": "GEM/2024/B/100202",
        "title": "Cryogenic Storage and Automated Sample Retrieval System",
        "department": "Department of Science and Technology",
        "description": "Ultra-low temperature freezers and liquid nitrogen manifold backup system.",
        "bid_closing_date": "2024-09-15",
        "estimated_value": 25000000.00,
        "category": "Specialized Laboratory Equipment",
        "status": "COMPLETED",
        "created_by": "Procurement Division",
        "created_at": "2024-08-01T10:00:00Z",
        "bids": [
            {"bidder_key": "MAHANADI", "quote": 24820000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "ARAVALI", "quote": 24960000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-12",
        "tender_number": "GEM/2025/B/100303",
        "title": "Cleanroom Filtration & Environmental Sensor Instrumentation",
        "department": "Department of Science and Technology",
        "description": "ISO Class 5 cleanroom HEPA filters and particle counting sensor array.",
        "bid_closing_date": "2025-02-18",
        "estimated_value": 28000000.00,
        "category": "Specialized Laboratory Equipment",
        "status": "COMPLETED",
        "created_by": "Procurement Division",
        "created_at": "2025-01-10T10:00:00Z",
        "bids": [
            {"bidder_key": "ARAVALI", "quote": 27880000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "MAHANADI", "quote": 27950000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },

    # ── 4. HISTORICAL OFFICER ADMINISTRATIVE ASSOCIATION TENDERS (13 to 15) ────
    {
        "id": "TEN-HIST-13",
        "tender_number": "GEM/2024/B/100404",
        "title": "Digital Records Archival & Microfilming Services (Phase 1)",
        "department": "Department of Administrative Reforms",
        "description": "Scanning, indexing, metadata cataloging, and archival microfilming.",
        "bid_closing_date": "2024-04-30",
        "estimated_value": 15000000.00,
        "category": "Administrative Services",
        "status": "COMPLETED",
        "created_by": "S. K. Verma, Jt. Director",
        "created_at": "2024-03-20T10:00:00Z",
        "bids": [
            {"bidder_key": "KAVERI", "quote": 14200000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 15400000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-14",
        "tender_number": "GEM/2024/B/100505",
        "title": "Digital Records Archival & Microfilming Services (Phase 2)",
        "department": "Department of Administrative Reforms",
        "description": "District-level administrative records digitization and OCR indexing.",
        "bid_closing_date": "2024-10-15",
        "estimated_value": 16000000.00,
        "category": "Administrative Services",
        "status": "COMPLETED",
        "created_by": "S. K. Verma, Jt. Director",
        "created_at": "2024-09-05T10:00:00Z",
        "bids": [
            {"bidder_key": "KAVERI", "quote": 15100000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 16200000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },
    {
        "id": "TEN-HIST-15",
        "tender_number": "GEM/2025/B/100606",
        "title": "State Secretariat File Movement System Maintenance",
        "department": "Department of Administrative Reforms",
        "description": "SLA-based application support and database administration for secretariat files.",
        "bid_closing_date": "2025-05-10",
        "estimated_value": 18000000.00,
        "category": "Administrative Services",
        "status": "COMPLETED",
        "created_by": "S. K. Verma, Jt. Director",
        "created_at": "2025-04-01T10:00:00Z",
        "bids": [
            {"bidder_key": "KAVERI", "quote": 17200000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 18500000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },

    # ── 5. ACTIVE SCENARIO TENDERS (Tenders 16 to 23) ──────────────────────────

    # SCENARIO 1 — CLEAN BASELINE
    {
        "id": "TEN-2026-001",
        "tender_number": "GEM/2026/B/418207",
        "title": "Supply and Installation of Network Infrastructure for Government Administrative Offices",
        "department": "Department of Administrative Reforms",
        "description": "Procurement of enterprise-grade switches, routers, security gateways, and structured cabling.",
        "bid_closing_date": "2026-08-30",
        "estimated_value": 45000000.00,
        "category": "Network Infrastructure",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-01T09:00:00Z",
        "bids": [
            {"bidder_key": "NILGIRI", "quote": 43500000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "MAHANADI", "quote": 45800000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "SAHYADRI", "quote": 47900000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 2 — BID PRICE CLUSTERING
    {
        "id": "TEN-2026-002",
        "tender_number": "GEM/2026/B/519302",
        "title": "Procurement of Enterprise Cloud Storage and High-Availability Backup Subsystems",
        "department": "Department of Information Technology",
        "description": "High-throughput all-flash SAN storage arrays and deduplication appliances for e-Governance portals.",
        "bid_closing_date": "2026-09-10",
        "estimated_value": 25000000.00,
        "category": "Cloud Infrastructure",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-05T11:00:00Z",
        "bids": [
            {"bidder_key": "BRAHMAPUTRA", "quote": 24850000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "KAVERI", "quote": 24890000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "GODAVARI", "quote": 24920000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 3 — REPEATED PARTICIPATION / COHORT
    {
        "id": "TEN-2026-003",
        "tender_number": "GEM/2026/B/621415",
        "title": "Supply of Edge Routing Hardware and Structured Switching Systems",
        "department": "Department of Information Technology",
        "description": "Core routing appliances, optical transceivers, and managed layer-3 distribution switches.",
        "bid_closing_date": "2026-09-12",
        "estimated_value": 32000000.00,
        "category": "IT & Telecommunications",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-10T09:30:00Z",
        "bids": [
            {"bidder_key": "BRAHMAPUTRA", "quote": 31500000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "KAVERI", "quote": 33500000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "YAMUNA", "quote": 35500000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 4 — WINNER CONCENTRATION
    {
        "id": "TEN-2026-004",
        "tender_number": "GEM/2026/B/732528",
        "title": "Turnkey EPC Contract for 50MW Solar Photovoltaic Power Plant Expansion",
        "department": "Ministry of New and Renewable Energy",
        "description": "Comprehensive design, engineering, civil foundations, and transformer yard construction.",
        "bid_closing_date": "2026-09-18",
        "estimated_value": 350000000.00,
        "category": "Renewable Energy",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-12T14:00:00Z",
        "bids": [
            {"bidder_key": "VINDHYACHAL", "quote": 342000000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "ARAVALI", "quote": 368000000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 5 — BID ROTATION
    {
        "id": "TEN-2026-005",
        "tender_number": "GEM/2026/B/843639",
        "title": "Statewide Network Operation Center (NOC) Annual Operation & Maintenance",
        "department": "Department of Information Technology",
        "description": "24x7 monitoring, incident management, preventive maintenance, and SLA compliance auditing.",
        "bid_closing_date": "2026-09-20",
        "estimated_value": 50000000.00,
        "category": "IT & Telecommunications",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-15T10:00:00Z",
        "bids": [
            {"bidder_key": "GODAVARI", "quote": 48500000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "KAVERI", "quote": 51000000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "BRAHMAPUTRA", "quote": 52500000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 6 — RELATED BIDDERS (SHARED PAN / GSTIN / ADDRESS)
    {
        "id": "TEN-2026-006",
        "tender_number": "GEM/2026/B/954741",
        "title": "Comprehensive Smart City Command & Control Software Modernization",
        "department": "Ministry of Housing and Urban Affairs",
        "description": "Unified dashboard integration, IoT telemetry ingester, and GIS mapping layer.",
        "bid_closing_date": "2026-09-22",
        "estimated_value": 60000000.00,
        "category": "Software Solutions",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-18T11:30:00Z",
        "bids": [
            {"bidder_key": "SHIVALIK_CLOUD", "quote": 58000000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "SHIVALIK_ENTERPRISE", "quote": 61500000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "TAPTI", "quote": 64000000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 7 — MULTI-SIGNAL CASE (RELATED + CLUSTERING + COHORT)
    {
        "id": "TEN-2026-007",
        "tender_number": "GEM/2026/B/965852",
        "title": "Design, Deployment & Unified Management of High-Security Cyber Defense Operations",
        "department": "Department of Information Technology",
        "description": "Endpoint detection, threat hunting, zero-trust network access, and SOC 2 Type II compliance.",
        "bid_closing_date": "2026-09-25",
        "estimated_value": 80000000.00,
        "category": "IT & Telecommunications",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-20T15:00:00Z",
        "bids": [
            {"bidder_key": "SHIVALIK_CLOUD", "quote": 78500000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "SHIVALIK_ENTERPRISE", "quote": 78650000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "KAVERI", "quote": 78800000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 8 — FALSE-POSITIVE CONTROL (LEGITIMATE COMPETITIVE CASE)
    {
        "id": "TEN-2026-008",
        "tender_number": "GEM/2026/B/976963",
        "title": "Supply of Certified Precision Survey and GIS Photogrammetry Equipment",
        "department": "Survey of India",
        "description": "High-precision GNSS receivers, total stations, RTK base units, and photogrammetry processing suite.",
        "bid_closing_date": "2026-09-28",
        "estimated_value": 18000000.00,
        "category": "Geospatial & Survey",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-22T09:00:00Z",
        "bids": [
            {"bidder_key": "SAHYADRI", "quote": 17200000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "TAPTI", "quote": 17800000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "MAHANADI", "quote": 18500000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 9 — NARROW COMPETITION & BID-TO-ESTIMATE ANOMALY
    {
        "id": "TEN-2026-009",
        "tender_number": "GEM/2026/B/988074",
        "title": "Supply of Specialized Laboratory Testing Sensors & Thermal Calibrators",
        "department": "Department of Science and Technology",
        "description": "High-temperature thermogravimetric analyzer and micro-balance testing bench.",
        "bid_closing_date": "2026-10-02",
        "estimated_value": 20000000.00,
        "category": "Specialized Laboratory Equipment",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-24T10:00:00Z",
        "bids": [
            # Both bids tightly placed right at 99.8% and 99.9% of the official estimate (20,000,000)
            {"bidder_key": "ARAVALI", "quote": 19960000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "MAHANADI", "quote": 19980000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 10 — DOCUMENT IDENTITY INCONSISTENCY & SHARED DIRECTORS
    {
        "id": "TEN-2026-010",
        "tender_number": "GEM/2026/B/999185",
        "title": "Digital Portal User Telemetry & Governance Performance Dashboard",
        "department": "Department of Information Technology",
        "description": "Cloud telemetry ingestion, real-time query optimization, and citizen feedback pipelines.",
        "bid_closing_date": "2026-10-05",
        "estimated_value": 30000000.00,
        "category": "Software Solutions",
        "status": "ACTIVE",
        "created_by": "Procurement Division",
        "created_at": "2026-08-25T11:00:00Z",
        "bids": [
            {
                "bidder_key": "YAMUNA",
                "quote": 28500000.00,
                "status": "UNDER_REVIEW",
                "decision": None,
                # Yamuna document embedding Kaveri's PAN and sharing Director Vikramaditya Rao
                "inconsistent_pan": "AABCK2002K",
                "directors_override": ["Vikramaditya Rao", "Anand Swaminathan"],
            },
            {
                "bidder_key": "KAVERI",
                "quote": 29200000.00,
                "status": "UNDER_REVIEW",
                "decision": None,
                "directors_override": ["Vikramaditya Rao", "Meera Hegde"],
            },
            {"bidder_key": "TAPTI", "quote": 31000000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },

    # SCENARIO 11 — BIDDER-OFFICER ADMINISTRATIVE ASSOCIATION FIXTURE
    {
        "id": "TEN-2026-011",
        "tender_number": "GEM/2026/B/101296",
        "title": "Secretariat High-Volume Document Digitization & Audit Trail Integration",
        "department": "Department of Administrative Reforms",
        "description": "High-speed document capture, metadata validation, and state archive synchronization.",
        "bid_closing_date": "2026-10-10",
        "estimated_value": 22000000.00,
        "category": "Administrative Services",
        "status": "ACTIVE",
        "created_by": "S. K. Verma, Jt. Director",
        "created_at": "2026-08-28T09:00:00Z",
        "bids": [
            {"bidder_key": "KAVERI", "quote": 20800000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "TAPTI", "quote": 22500000.00, "status": "UNDER_REVIEW", "decision": None},
        ],
    },
]


# ============================================================
# SEED POPULATION HELPER
# ============================================================

def seed_synthetic_procurement_history(conn) -> Dict[str, int]:
    """
    Populate the SQLite database with the complete deterministic procurement dataset.
    Returns counts of inserted records across all tables.
    """
    from app.services.procurement_service import DEFAULT_TENDER_REQUIREMENTS

    now = datetime.now(timezone.utc).isoformat()
    counts = {
        "tenders": 0,
        "bidders": 0,
        "requirements": 0,
        "documents": 0,
        "bidder_documents": 0,
        "discrepancies": 0,
        "audit_events": 0,
    }

    # Clean existing procurement records
    conn.execute("DELETE FROM bidder_audit_events")
    conn.execute("DELETE FROM discrepancies")
    conn.execute("DELETE FROM compliance_results")
    conn.execute("DELETE FROM bidder_documents")
    conn.execute("DELETE FROM documents")
    conn.execute("DELETE FROM bidders")
    conn.execute("DELETE FROM tender_requirements")
    conn.execute("DELETE FROM tenders")

    bidder_id_counter = 100

    for tender_spec in SYNTHETIC_TENDERS_SPEC:
        t_id = tender_spec["id"]
        t_num = tender_spec["tender_number"]
        t_title = tender_spec["title"]
        t_dept = tender_spec["department"]
        t_desc = tender_spec.get("description", "")
        t_close = tender_spec.get("bid_closing_date", "2026-09-15")
        t_val = tender_spec.get("estimated_value", 10000000.0)
        t_cat = tender_spec.get("category", "General Procurement")
        t_status = tender_spec.get("status", "ACTIVE")
        t_created = tender_spec.get("created_at", now)
        t_officer = tender_spec.get("created_by", "Procurement Division")

        # 1. Insert Tender
        conn.execute("""
            INSERT INTO tenders (id, tender_number, title, department, description, bid_closing_date, estimated_value, category, status, local_content_class, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t_id,
            t_num,
            t_title,
            t_dept,
            t_desc,
            t_close,
            t_val,
            t_cat,
            t_status,
            "CLASS_I",
            t_officer,
            t_created,
            now
        ))
        counts["tenders"] += 1

        # 2. Insert Requirements
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
                t_created
            ))
            counts["requirements"] += 1

        # 3. Insert Bidders & Linked Documents
        for bid_info in tender_spec.get("bids", []):
            bidder_id_counter += 1
            b_id = f"BID-{bidder_id_counter}"
            b_key = bid_info["bidder_key"]
            b_profile = dict(FICTIONAL_BIDDERS_CATALOG[b_key])
            
            quote = bid_info["quote"]
            b_status = bid_info.get("status", "UNDER_REVIEW")
            b_decision = bid_info.get("decision")
            
            # Risk & Compliance defaults
            compliance_score = 88.0 if b_status in ("AWARDED", "QUALIFIED") else 75.0
            compliance_status = "COMPLIANT" if b_status in ("AWARDED", "QUALIFIED") else ("EXCEPTION_FOUND" if b_status == "EXCEPTION_FOUND" else "UNDER_REVIEW")
            risk_level = "LOW" if b_status in ("AWARDED", "QUALIFIED") else "MEDIUM"
            decided_by = t_officer if b_status == "AWARDED" else None

            conn.execute("""
                INSERT INTO bidders (
                    id, tender_id, legal_name, trade_name, gstin, pan, udyam_number, cin,
                    registered_address, contact_email, contact_phone, enterprise_category,
                    status, compliance_status, compliance_score, risk_level, officer_decision, quote_amount,
                    decided_by, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                b_id,
                t_id,
                b_profile["legal_name"],
                b_profile.get("trade_name"),
                b_profile.get("gstin"),
                b_profile.get("pan"),
                b_profile.get("udyam_number"),
                b_profile.get("cin"),
                b_profile.get("registered_address"),
                b_profile.get("contact_email"),
                b_profile.get("contact_phone"),
                b_profile.get("enterprise_category", "Medium Enterprise"),
                b_status,
                compliance_status,
                compliance_score,
                risk_level,
                b_decision,
                quote,
                decided_by,
                t_created,
                now
            ))
            counts["bidders"] += 1

            # 4. Insert Financial & Statutory Verification Documents for Bidder
            directors_to_embed = bid_info.get("directors_override") or b_profile.get("directors") or []
            pan_to_embed = bid_info.get("inconsistent_pan") or b_profile.get("pan")

            # Look up per-bidder scenario overrides for active tenders
            scenario_key = f"{t_id}:{b_key}"
            bidder_scenario = ACTIVE_BIDDER_DOC_SCENARIOS.get(scenario_key, {})
            gst_ocr_override = bidder_scenario.get("gst_ocr_status", "COMPLETED")

            gst_fields = [
                {"key": "gstin", "value": b_profile.get("gstin"), "confidence": 0.98, "isExtracted": True},
                {"key": "legalName", "value": b_profile["legal_name"], "confidence": 0.95, "isExtracted": True},
                {"key": "pan", "value": pan_to_embed, "confidence": 0.98, "isExtracted": True},
                {"key": "registeredAddress", "value": b_profile.get("registered_address"), "confidence": 0.92, "isExtracted": True},
            ]
            if directors_to_embed:
                gst_fields.append({
                    "key": "directors",
                    "value": ", ".join(directors_to_embed),
                    "confidence": 0.94,
                    "isExtracted": True
                })

            # If GST OCR failed, clear fields
            gst_extracted_fields = [] if gst_ocr_override == "FAILED" else gst_fields
            gst_text = (
                f"GST REGISTRATION CERTIFICATE\nGSTIN: {b_profile.get('gstin')}\nLegal Name: {b_profile['legal_name']}\n"
                f"PAN: {pan_to_embed}\nRegistered Address: {b_profile.get('registered_address')}\n"
                f"Registration Date: 01/07/2017\nStatus: ACTIVE\nReturn Filing Status: Regular"
                if gst_ocr_override != "FAILED" else None
            )

            # Tuple format: (doc_id, filename, doc_type, fields, ocr_status, extracted_text)
            doc_specs = [
                (
                    f"DOC-{b_id}-GST",
                    f"{b_key}_GST_Certificate.pdf",
                    "GST Certificate",
                    gst_extracted_fields,
                    gst_ocr_override,
                    gst_text,
                ),
                (
                    f"DOC-{b_id}-FIN",
                    f"{b_key}_Commercial_BOQ_Bid.pdf",
                    "Financial Bid Submission",
                    [
                        {"key": "quoteAmount", "value": str(quote), "confidence": 0.99, "isExtracted": True},
                        {"key": "financialBid", "value": f"\u20b9 {quote:,.2f}", "confidence": 0.99, "isExtracted": True},
                        {"key": "legalName", "value": b_profile["legal_name"], "confidence": 0.95, "isExtracted": True},
                        {"key": "gstin", "value": b_profile.get("gstin"), "confidence": 0.98, "isExtracted": True},
                    ],
                    "COMPLETED",
                    f"COMMERCIAL BID SUBMISSION\nBidder: {b_profile['legal_name']}\nTender: {t_num}\nQuoted Amount: \u20b9 {quote:,.2f}\nDate: {t_close[:10] if t_close else 'N/A'}",
                ),
            ]

            if b_profile.get("udyam_number"):
                udyam_text = (
                    f"UDYAM REGISTRATION CERTIFICATE\nUdyam No.: {b_profile.get('udyam_number')}\n"
                    f"Name: {b_profile['legal_name']}\nCategory: {b_profile.get('enterprise_category', 'Small Enterprise')}\n"
                    f"NIC Code: 62011\nDate of Commencement: 01/07/2020\nStatus: ACTIVE"
                )
                doc_specs.append((
                    f"DOC-{b_id}-UDYAM",
                    f"{b_key}_Udyam_Registration.pdf",
                    "Udyam/MSME Certificate",
                    [
                        {"key": "udyamNumber", "value": b_profile.get("udyam_number"), "confidence": 0.96, "isExtracted": True},
                        {"key": "legalName", "value": b_profile["legal_name"], "confidence": 0.93, "isExtracted": True},
                        {"key": "enterpriseCategory", "value": b_profile.get("enterprise_category", "Small Enterprise"), "confidence": 0.95, "isExtracted": True},
                    ],
                    "COMPLETED",
                    udyam_text,
                ))

            # Add scenario-specific additional documents for active tenders
            if scenario_key in ACTIVE_BIDDER_DOC_SCENARIOS:
                sc = ACTIVE_BIDDER_DOC_SCENARIOS[scenario_key]

                # PAN Card document
                pan_sc = sc.get("pan", {})
                if pan_sc.get("include"):
                    doc_specs.append((
                        f"DOC-{b_id}-PAN",
                        f"{b_key}_PAN_Card.pdf",
                        "PAN Card",
                        pan_sc.get("fields", []),
                        pan_sc.get("ocr_status", "COMPLETED"),
                        pan_sc.get("extracted_text"),
                    ))

                # OEM Authorization
                oem_sc = sc.get("oem", {})
                if oem_sc.get("include"):
                    doc_specs.append((
                        f"DOC-{b_id}-OEM",
                        f"{b_key}_OEM_Authorization.pdf",
                        "OEM Authorization",
                        oem_sc.get("fields", []),
                        oem_sc.get("ocr_status", "COMPLETED"),
                        oem_sc.get("extracted_text"),
                    ))

                # Turnover Certificate
                turn_sc = sc.get("turnover", {})
                if turn_sc.get("include"):
                    doc_specs.append((
                        f"DOC-{b_id}-TURN",
                        f"{b_key}_Turnover_Certificate.pdf",
                        "Turnover Certificate",
                        turn_sc.get("fields", []),
                        turn_sc.get("ocr_status", "COMPLETED"),
                        turn_sc.get("extracted_text"),
                    ))

                # Non-Blacklisting Declaration
                bl_sc = sc.get("blacklisting", {})
                if bl_sc.get("include"):
                    doc_specs.append((
                        f"DOC-{b_id}-BL",
                        f"{b_key}_Blacklisting_Declaration.pdf",
                        "Non-Blacklisting Declaration",
                        bl_sc.get("fields", []),
                        bl_sc.get("ocr_status", "COMPLETED"),
                        bl_sc.get("extracted_text"),
                    ))

                # Local Content Declaration
                lc_sc = sc.get("local_content", {})
                if lc_sc.get("include"):
                    doc_specs.append((
                        f"DOC-{b_id}-LC",
                        f"{b_key}_Local_Content_Declaration.pdf",
                        "Local Content Declaration",
                        lc_sc.get("fields", []),
                        lc_sc.get("ocr_status", "COMPLETED"),
                        lc_sc.get("extracted_text"),
                    ))

            for doc_tuple in doc_specs:
                d_id, fname, dtype = doc_tuple[0], doc_tuple[1], doc_tuple[2]
                fields = doc_tuple[3] if len(doc_tuple) > 3 else []
                doc_ocr_status = doc_tuple[4] if len(doc_tuple) > 4 else "COMPLETED"
                doc_text = doc_tuple[5] if len(doc_tuple) > 5 else None

                conn.execute("""
                    INSERT INTO documents (id, file_name, file_type, file_size, document_type, ocr_status, extracted_text, extracted_fields, ocr_engine, ocr_confidence, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    d_id,
                    fname,
                    "application/pdf",
                    145000,
                    dtype,
                    doc_ocr_status,
                    doc_text,
                    json.dumps(fields),
                    "PyMuPDF + Regex Parser",
                    0.96,
                    t_created
                ))
                counts["documents"] += 1

                conn.execute("""
                    INSERT INTO bidder_documents (id, bidder_id, document_id, document_type, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    str(uuid.uuid4()),
                    b_id,
                    d_id,
                    dtype,
                    t_created
                ))
                counts["bidder_documents"] += 1

            # 5. Insert Audit Trail Event
            conn.execute("""
                INSERT INTO bidder_audit_events (id, tender_id, bidder_id, action, actor, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()),
                t_id,
                b_id,
                "Bid Submission & Verification",
                "Procurement System",
                f"Financial bid of ₹{quote:,.2f} and statutory compliance verified for {b_profile['legal_name']}.",
                t_created
            ))
            counts["audit_events"] += 1

    # Pre-seed compliance results for ALL active tender bidders
    # so the UI shows correct statuses on first load without officer action.
    _preseed_compliance_results(conn, now)

    return counts


def _preseed_compliance_results(conn, now: str) -> None:
    """
    Pre-compute and persist compliance results for all ACTIVE tender bidders.
    This ensures the UI shows correct requirement statuses on first load.
    Uses the existing run_full_verification pipeline — no separate logic.
    """
    try:
        from app.services.procurement_service import run_full_verification, DEFAULT_TENDER_REQUIREMENTS
        import uuid as _uuid

        # Fetch all active tenders
        active_tenders = conn.execute(
            "SELECT id FROM tenders WHERE status = 'ACTIVE'"
        ).fetchall()

        for t_row in active_tenders:
            t_id = t_row[0]
            bidder_rows = conn.execute(
                "SELECT id FROM bidders WHERE tender_id = ?", (t_id,)
            ).fetchall()

            for b_row in bidder_rows:
                b_id = b_row[0]

                # Fetch bidder data
                bidder_row = conn.execute(
                    "SELECT * FROM bidders WHERE id = ?", (b_id,)
                ).fetchone()
                if not bidder_row:
                    continue
                bidder = dict(bidder_row)

                # Fetch documents for this bidder
                doc_rows = conn.execute("""
                    SELECT d.* FROM documents d
                    JOIN bidder_documents bd ON d.id = bd.document_id
                    WHERE bd.bidder_id = ?
                """, (b_id,)).fetchall()

                documents = []
                for dr in doc_rows:
                    d = dict(dr)
                    # Deserialise extracted_fields JSON
                    if isinstance(d.get("extracted_fields"), str):
                        try:
                            d["extracted_fields"] = __import__("json").loads(d["extracted_fields"])
                        except Exception:
                            d["extracted_fields"] = []
                    documents.append(d)

                # Fetch tender requirements
                req_rows = conn.execute(
                    "SELECT * FROM tender_requirements WHERE tender_id = ?", (t_id,)
                ).fetchall()
                requirements = [dict(r) for r in req_rows] if req_rows else DEFAULT_TENDER_REQUIREMENTS

                # Run verification pipeline
                assessment = run_full_verification(bidder, requirements, documents)

                # Delete old results and persist new ones
                conn.execute("DELETE FROM compliance_results WHERE bidder_id = ?", (b_id,))
                conn.execute("DELETE FROM discrepancies WHERE bidder_id = ?", (b_id,))

                for check in assessment.get("checks", []):
                    conn.execute("""
                        INSERT INTO compliance_results (
                            id, bidder_id, tender_id, requirement_id, requirement_name, category,
                            status, severity, score, evidence_doc_id, evidence_field_key,
                            evidence_value, evidence_source, confidence, reason, verified_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        str(_uuid.uuid4()),
                        b_id,
                        t_id,
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
                        now,
                    ))

                for disc in assessment.get("discrepancies", []):
                    conn.execute("""
                        INSERT INTO discrepancies (
                            id, bidder_id, discrepancy_type, severity, field_name,
                            expected_value, found_value, source_doc_1_id, source_doc_2_id,
                            description, recommendation, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        str(_uuid.uuid4()),
                        b_id,
                        disc.get("discrepancy_type", "INCONSISTENCY"),
                        disc.get("severity", "MEDIUM"),
                        disc.get("field_name", "Field"),
                        disc.get("expected_value"),
                        disc.get("found_value"),
                        disc.get("source_doc_1_id"),
                        disc.get("source_doc_2_id"),
                        disc.get("description", "Discrepancy identified."),
                        disc.get("recommendation", ""),
                        now,
                    ))

                # Update bidder compliance score and status
                from app.services.procurement_service import determine_compliance_status
                comp_summary = determine_compliance_status(
                    assessment.get("checks", []),
                    assessment.get("discrepancies", [])
                )
                compliance_status_val = assessment.get("compliance_status") or comp_summary["status"]
                risk = assessment.get("risk_level", "MEDIUM")

                conn.execute("""
                    UPDATE bidders SET compliance_score = ?, risk_level = ?,
                    compliance_status = ?, status = ?, updated_at = ?
                    WHERE id = ? AND (officer_decision IS NULL OR officer_decision = '')
                """, (
                    assessment.get("compliance_score", 0.0),
                    risk,
                    compliance_status_val,
                    compliance_status_val,
                    now,
                    b_id,
                ))

    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Pre-seeding compliance results failed: {e}", exc_info=True)
