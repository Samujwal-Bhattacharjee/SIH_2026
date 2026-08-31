"""
Synthetic Procurement History & Integrity Dataset Generator — SIH26100
=======================================================================
Deterministic, reproducible procurement dataset generator designed for validating
cross-tender pattern detection in the Procurement Integrity Engine.

Guarantees:
- Fixed random seed (seed=42) for 100% deterministic reproducibility.
- 100% fictional Indian-style business entities, PANs, GSTINs, CINs, Udyam numbers.
- No real companies, real persons, or real procurement data.
- No artificial 'corruption=true' flags; all signals emerge from observable patterns.
- Covers 8 required procurement scenarios:
    1. CLEAN (Independent bids, LOW risk)
    2. BID PRICE CLUSTERING (Tight quotes <= 1.0% delta)
    3. REPEATED PARTICIPATION (Cohort appearing in >= 3 tenders)
    4. WINNER CONCENTRATION (Single vendor winning >= 75% in category)
    5. BID ROTATION (Systematic A -> B -> C -> A -> B winner cycle)
    6. RELATED BIDDERS (Shared PAN, GSTIN, address, email domain)
    7. MULTI-SIGNAL CASE (Combined signals evaluating to HIGH/CRITICAL)
    8. FALSE-POSITIVE CONTROL (Legitimate competitive tender yielding LOW risk)
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
    },
    "SHIVALIK_CLOUD": {
        # Related entity 1 (shares statutory identifiers with SHIVALIK_ENTERPRISE)
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
    },
    "SHIVALIK_ENTERPRISE": {
        # Related entity 2 (shares PAN, GSTIN, Address, and Email Domain with SHIVALIK_CLOUD)
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
    },
}


# ============================================================
# SYNTHETIC TENDERS DATASET (17 TENDERS)
# ============================================================

SYNTHETIC_TENDERS_SPEC = [
    # ── 1. HISTORICAL TENDERS (Tenders 1 to 9) ──────────────────────────────────
    # Historical IT Tenders 1-5: Structured A -> B -> C -> A -> B winner rotation & repeated cohort
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
        "created_at": "2025-03-01T10:00:00Z",
        "bids": [
            {"bidder_key": "BRAHMAPUTRA", "quote": 46800000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "KAVERI", "quote": 47900000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "GODAVARI", "quote": 48700000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "YAMUNA", "quote": 49500000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },

    # Historical Renewable Energy Tenders 6-9: Dominant incumbent (Vindhyachal won 4/4 = 100%)
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
        "created_at": "2025-07-01T10:00:00Z",
        "bids": [
            {"bidder_key": "VINDHYACHAL", "quote": 189000000.00, "status": "AWARDED", "decision": "QUALIFIED"},
            {"bidder_key": "ARAVALI", "quote": 201000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
            {"bidder_key": "TAPTI", "quote": 208000000.00, "status": "EVALUATED", "decision": "QUALIFIED"},
        ],
    },

    # ── 2. ACTIVE SCENARIO TENDERS (Tenders 10 to 17) ──────────────────────────

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
        "created_at": "2026-08-05T11:00:00Z",
        "bids": [
            # 3 Bids clustered within 0.28% total delta (<= 1.0% threshold)
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
        "created_at": "2026-08-10T09:30:00Z",
        "bids": [
            # Brahmaputra, Kaveri, and Yamuna have jointly co-participated across 5 historical IT tenders
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
        "created_at": "2026-08-12T14:00:00Z",
        "bids": [
            # Vindhyachal has won 4 of 4 historical tenders in Renewable Energy (100% win rate)
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
        "created_at": "2026-08-15T10:00:00Z",
        "bids": [
            # Historical IT tenders show rotation: Kaveri (A) -> Brahmaputra (B) -> Godavari (C) -> Kaveri (A) -> Brahmaputra (B)
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
        "created_at": "2026-08-18T11:30:00Z",
        "bids": [
            # Shivalik Cloud Matrix and Shivalik Enterprise Systems share PAN, GSTIN, Address, and Email Domain
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
        "created_at": "2026-08-20T15:00:00Z",
        "bids": [
            # Combines: Shared PAN/GSTIN (Shivalik entities) + Price Clustering (0.38% spread) + Historical Cohort
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
        "created_at": "2026-08-22T09:00:00Z",
        "bids": [
            # Legitimate competitive bids with healthy > 3.5% margins and distinct corporate entities
            {"bidder_key": "SAHYADRI", "quote": 17200000.00, "status": "UNDER_REVIEW", "decision": None},
            {"bidder_key": "TAPTI", "quote": 17800000.00, "status": "UNDER_REVIEW", "decision": None},  # 3.48% delta
            {"bidder_key": "MAHANADI", "quote": 18500000.00, "status": "UNDER_REVIEW", "decision": None}, # 3.93% delta
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
            "Procurement Division",
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
            b_profile = FICTIONAL_BIDDERS_CATALOG[b_key]
            
            quote = bid_info["quote"]
            b_status = bid_info.get("status", "UNDER_REVIEW")
            b_decision = bid_info.get("decision")
            
            # Risk & Compliance defaults
            compliance_score = 88.0 if b_status in ("AWARDED", "QUALIFIED") else 75.0
            risk_level = "LOW" if b_status in ("AWARDED", "QUALIFIED") else "MEDIUM"

            conn.execute("""
                INSERT INTO bidders (
                    id, tender_id, legal_name, trade_name, gstin, pan, udyam_number, cin,
                    registered_address, contact_email, contact_phone, enterprise_category,
                    status, compliance_score, risk_level, officer_decision, quote_amount,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                compliance_score,
                risk_level,
                b_decision,
                quote,
                t_created,
                now
            ))
            counts["bidders"] += 1

            # 4. Insert Financial & Statutory Verification Documents for Bidder
            doc_specs = [
                (
                    f"DOC-{b_id}-GST",
                    f"{b_key}_GST_Certificate.pdf",
                    "GST Certificate",
                    [
                        {"key": "gstin", "value": b_profile.get("gstin"), "confidence": 0.98, "isExtracted": True},
                        {"key": "legalName", "value": b_profile["legal_name"], "confidence": 0.95, "isExtracted": True},
                        {"key": "pan", "value": b_profile.get("pan"), "confidence": 0.98, "isExtracted": True},
                        {"key": "registeredAddress", "value": b_profile.get("registered_address"), "confidence": 0.92, "isExtracted": True},
                    ]
                ),
                (
                    f"DOC-{b_id}-FIN",
                    f"{b_key}_Commercial_BOQ_Bid.pdf",
                    "Financial Bid Submission",
                    [
                        {"key": "quoteAmount", "value": str(quote), "confidence": 0.99, "isExtracted": True},
                        {"key": "financialBid", "value": f"₹ {quote:,.2f}", "confidence": 0.99, "isExtracted": True},
                        {"key": "legalName", "value": b_profile["legal_name"], "confidence": 0.95, "isExtracted": True},
                        {"key": "gstin", "value": b_profile.get("gstin"), "confidence": 0.98, "isExtracted": True},
                    ]
                ),
            ]

            if b_profile.get("udyam_number"):
                doc_specs.append((
                    f"DOC-{b_id}-UDYAM",
                    f"{b_key}_Udyam_Registration.pdf",
                    "Udyam/MSME Certificate",
                    [
                        {"key": "udyamNumber", "value": b_profile.get("udyam_number"), "confidence": 0.96, "isExtracted": True},
                        {"key": "legalName", "value": b_profile["legal_name"], "confidence": 0.93, "isExtracted": True},
                    ]
                ))

            for d_id, fname, dtype, fields in doc_specs:
                conn.execute("""
                    INSERT INTO documents (id, file_name, file_type, file_size, document_type, ocr_status, extracted_fields, ocr_engine, ocr_confidence, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    d_id,
                    fname,
                    "application/pdf",
                    145000,
                    dtype,
                    "COMPLETED",
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

    return counts
