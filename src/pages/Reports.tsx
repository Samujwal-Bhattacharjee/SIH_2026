import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Building2,
  Search,
  Filter,
} from 'lucide-react';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';

type ReportType =
  | 'COMPLIANCE_SUMMARY'
  | 'TENDER_ASSESSMENT'
  | 'EXCEPTION_ANALYSIS'
  | 'SOURCE_REPORT'
  | 'OFFICER_REVIEW';

interface TenderSummaryRecord {
  id: string;
  tenderNumber: string;
  title: string;
  department: string;
  biddersCount: number;
  verifiedCount: number;
  pendingCount: number;
  exceptionsCount: number;
  avgCompliance: number;
  highRiskCount: number;
  status: string;
}

interface BidderAssessmentRecord {
  id: string;
  tenderNumber: string;
  bidderName: string;
  legalEntity: string;
  complianceScore: number;
  verifiedRequirements: string;
  exceptionsCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: string;
}

interface ExceptionRecord {
  id: string;
  tenderNumber: string;
  bidderName: string;
  category: string;
  finding: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceAdapter: string;
  recommendation: string;
}

interface SourceVerificationRecord {
  id: string;
  sourceName: string;
  category: string;
  sourceType: string;
  adapterStatus: 'Sandbox / Mock' | 'Demo Adapter';
  validatedRecords: number;
  exceptionsDetected: number;
  avgLatency: string;
}

interface OfficerReviewRecord {
  id: string;
  tenderNumber: string;
  bidderName: string;
  officerName: string;
  designation: string;
  department: string;
  aiRecommendation: string;
  officerDecision: 'Qualified' | 'Disqualified' | 'Pending Review';
  decisionDate: string;
  reviewNotes: string;
}

const TENDER_SUMMARIES: TenderSummaryRecord[] = [
  {
    id: '1',
    tenderNumber: 'GEM/2026/B/418207',
    title: 'Supply and Installation of Network Infrastructure for Government Administrative Offices',
    department: 'Department of Administrative Reforms',
    biddersCount: 2,
    verifiedCount: 1,
    pendingCount: 0,
    exceptionsCount: 1,
    avgCompliance: 87,
    highRiskCount: 1,
    status: 'Evaluation in Progress',
  },
  {
    id: '2',
    tenderNumber: 'GEM/2026/B/392015',
    title: 'Procurement of Cloud Computing & Datacenter Storage Services',
    department: 'Ministry of Electronics & Information Technology',
    biddersCount: 3,
    verifiedCount: 2,
    pendingCount: 1,
    exceptionsCount: 0,
    avgCompliance: 94,
    highRiskCount: 0,
    status: 'Under Verification',
  },
  {
    id: '3',
    tenderNumber: 'GEM/2026/B/401928',
    title: 'Supply of High-Speed Secure Optical Network Terminals',
    department: 'Department of Telecommunications',
    biddersCount: 2,
    verifiedCount: 1,
    pendingCount: 1,
    exceptionsCount: 1,
    avgCompliance: 78,
    highRiskCount: 1,
    status: 'Exceptions Under Review',
  },
  {
    id: '4',
    tenderNumber: 'GEM/2026/B/420119',
    title: 'Enterprise Document Management & OCR Digitization System',
    department: 'Department of Personnel & Training',
    biddersCount: 3,
    verifiedCount: 3,
    pendingCount: 0,
    exceptionsCount: 0,
    avgCompliance: 96,
    highRiskCount: 0,
    status: 'Evaluation Completed',
  },
];

const BIDDER_ASSESSMENTS: BidderAssessmentRecord[] = [
  {
    id: '1',
    tenderNumber: 'GEM/2026/B/418207',
    bidderName: 'Triveni Infotech Solutions Pvt. Ltd.',
    legalEntity: 'Private Limited Company (CIN: U72200MH2016PTC284910)',
    complianceScore: 87,
    verifiedRequirements: '5 of 6 Verified',
    exceptionsCount: 0,
    riskLevel: 'LOW',
    status: 'Eligible - Under Review',
  },
  {
    id: '2',
    tenderNumber: 'GEM/2026/B/418207',
    bidderName: 'Narmada Systems & Services Pvt. Ltd.',
    legalEntity: 'Private Limited Company (CIN: U72900DL2018PTC331204)',
    complianceScore: 54,
    verifiedRequirements: '3 of 6 Verified',
    exceptionsCount: 2,
    riskLevel: 'HIGH',
    status: 'Exceptions Detected',
  },
  {
    id: '3',
    tenderNumber: 'GEM/2026/B/392015',
    bidderName: 'Bharat Cloud Networks LLP',
    legalEntity: 'Limited Liability Partnership (LLPIN: AAB-4912)',
    complianceScore: 96,
    verifiedRequirements: '6 of 6 Verified',
    exceptionsCount: 0,
    riskLevel: 'LOW',
    status: 'Qualified',
  },
  {
    id: '4',
    tenderNumber: 'GEM/2026/B/392015',
    bidderName: 'Vindhya Datatech Solutions Pvt. Ltd.',
    legalEntity: 'Private Limited Company (CIN: U72300KA2015PTC081290)',
    complianceScore: 92,
    verifiedRequirements: '6 of 6 Verified',
    exceptionsCount: 0,
    riskLevel: 'LOW',
    status: 'Qualified',
  },
  {
    id: '5',
    tenderNumber: 'GEM/2026/B/401928',
    bidderName: 'Yamuna Fiber Optic Communications',
    legalEntity: 'Partnership Firm (Reg: DEL/PF/2019/847)',
    complianceScore: 68,
    verifiedRequirements: '4 of 6 Verified',
    exceptionsCount: 1,
    riskLevel: 'HIGH',
    status: 'Review Required',
  },
];

const EXCEPTIONS_DATA: ExceptionRecord[] = [
  {
    id: '1',
    tenderNumber: 'GEM/2026/B/418207',
    bidderName: 'Narmada Systems & Services Pvt. Ltd.',
    category: 'Legal Entity Name Mismatch',
    finding: 'GST certificate legal name differs from Bidder Incorporation Declaration ("Narmada Systems Ltd" vs "Narmada Systems & Services Pvt Ltd").',
    severity: 'HIGH',
    sourceAdapter: 'GST Mock Adapter',
    recommendation: 'Request official certificate clarification before qualification.',
  },
  {
    id: '2',
    tenderNumber: 'GEM/2026/B/418207',
    bidderName: 'Narmada Systems & Services Pvt. Ltd.',
    category: 'OEM Authorization Validity',
    finding: 'OEM Manufacturer Authorization Form expired on 31-Dec-2025; tender mandates authorization valid through 31-Dec-2026.',
    severity: 'HIGH',
    sourceAdapter: 'OEM Document OCR',
    recommendation: 'Seek revalidated authorization certificate from OEM.',
  },
  {
    id: '3',
    tenderNumber: 'GEM/2026/B/401928',
    bidderName: 'Yamuna Fiber Optic Communications',
    category: 'MSME / Udyam Certificate Missing',
    finding: 'Claimed MSME turnover exemption in bid, but valid Udyam certificate registration was not provided.',
    severity: 'MEDIUM',
    sourceAdapter: 'Udyam Sandbox Adapter',
    recommendation: 'Verify MSME status via Udyam Registration number.',
  },
  {
    id: '4',
    tenderNumber: 'GEM/2026/B/401928',
    bidderName: 'Yamuna Fiber Optic Communications',
    category: 'Annual Turnover Requirement',
    finding: 'Audited balance sheet average annual turnover is INR 1.8 Cr vs required minimum of INR 2.5 Cr.',
    severity: 'HIGH',
    sourceAdapter: 'Financial OCR Extractor',
    recommendation: 'Review financial eligibility criteria compliance.',
  },
];

const SOURCE_RECORDS: SourceVerificationRecord[] = [
  {
    id: '1',
    sourceName: 'GST Verification Service',
    category: 'Taxation & Statutory Registration',
    sourceType: 'GSTIN Cross-Check',
    adapterStatus: 'Sandbox / Mock',
    validatedRecords: 24,
    exceptionsDetected: 1,
    avgLatency: '140ms',
  },
  {
    id: '2',
    sourceName: 'Udyam / MSME Verification',
    category: 'Enterprise Classification',
    sourceType: 'Udyam Certificate & Turnover',
    adapterStatus: 'Sandbox / Mock',
    validatedRecords: 18,
    exceptionsDetected: 1,
    avgLatency: '110ms',
  },
  {
    id: '3',
    sourceName: 'Income Tax PAN Verification',
    category: 'Taxation & Statutory Registration',
    sourceType: 'PAN Entity Status Cross-Check',
    adapterStatus: 'Sandbox / Mock',
    validatedRecords: 24,
    exceptionsDetected: 0,
    avgLatency: '95ms',
  },
  {
    id: '4',
    sourceName: 'MCA21 Corporate Registry',
    category: 'Corporate Legal Existence',
    sourceType: 'CIN & Company Status',
    adapterStatus: 'Sandbox / Mock',
    validatedRecords: 20,
    exceptionsDetected: 0,
    avgLatency: '180ms',
  },
  {
    id: '5',
    sourceName: 'OEM Authorization Validator',
    category: 'Technical Compliance',
    sourceType: 'OCR & Signature Verification',
    adapterStatus: 'Sandbox / Mock',
    validatedRecords: 16,
    exceptionsDetected: 2,
    avgLatency: '210ms',
  },
  {
    id: '6',
    sourceName: 'Debarment & Blacklist Registry',
    category: 'Integrity & Legal Eligibility',
    sourceType: 'GeM / CPPP Debarment Database',
    adapterStatus: 'Sandbox / Mock',
    validatedRecords: 24,
    exceptionsDetected: 0,
    avgLatency: '85ms',
  },
];

const OFFICER_REVIEWS: OfficerReviewRecord[] = [
  {
    id: '1',
    tenderNumber: 'GEM/2026/B/418207',
    bidderName: 'Triveni Infotech Solutions Pvt. Ltd.',
    officerName: 'Rajeshwar V. Verma, IAS',
    designation: 'Joint Secretary (Procurement)',
    department: 'Department of Administrative Reforms',
    aiRecommendation: 'Eligible (Score: 87/100)',
    officerDecision: 'Qualified',
    decisionDate: '18-Aug-2026',
    reviewNotes: 'All mandatory statutory documents, OEM authorizations, and financial records verified. Recommended for commercial bid opening.',
  },
  {
    id: '2',
    tenderNumber: 'GEM/2026/B/418207',
    bidderName: 'Narmada Systems & Services Pvt. Ltd.',
    officerName: 'Rajeshwar V. Verma, IAS',
    designation: 'Joint Secretary (Procurement)',
    department: 'Department of Administrative Reforms',
    aiRecommendation: 'High Risk / Exceptions (Score: 54/100)',
    officerDecision: 'Pending Review',
    decisionDate: '18-Aug-2026',
    reviewNotes: 'Show-cause query issued regarding name discrepancy and expired OEM authorization. Awaiting bidder clarification within 48 hours.',
  },
  {
    id: '3',
    tenderNumber: 'GEM/2026/B/392015',
    bidderName: 'Bharat Cloud Networks LLP',
    officerName: 'Anita Deshmukh',
    designation: 'Deputy Secretary (Technical Evaluation)',
    department: 'Ministry of Electronics & IT',
    aiRecommendation: 'Eligible (Score: 96/100)',
    officerDecision: 'Qualified',
    decisionDate: '17-Aug-2026',
    reviewNotes: 'Meets ISO 27001, Tier-III Datacenter and local content criteria. Qualified for financial round.',
  },
];

export const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('COMPLIANCE_SUMMARY');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('2026-Q3');

  const filteredSummaries = departmentFilter === 'ALL'
    ? TENDER_SUMMARIES
    : TENDER_SUMMARIES.filter((t) => t.department === departmentFilter);

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (selectedReport === 'COMPLIANCE_SUMMARY') {
      headers = ['Tender ID', 'Department', 'Bidders', 'Verified', 'Pending', 'Exceptions', 'Avg Compliance %', 'High Risk', 'Status'];
      rows = filteredSummaries.map((t) => [
        t.tenderNumber,
        t.department,
        t.biddersCount,
        t.verifiedCount,
        t.pendingCount,
        t.exceptionsCount,
        `${t.avgCompliance}%`,
        t.highRiskCount,
        t.status,
      ]);
    } else if (selectedReport === 'TENDER_ASSESSMENT') {
      headers = ['Tender ID', 'Bidder Name', 'Legal Entity', 'Compliance Score', 'Verified Requirements', 'Exceptions', 'Risk Level', 'Status'];
      rows = BIDDER_ASSESSMENTS.map((b) => [
        b.tenderNumber,
        b.bidderName,
        b.legalEntity,
        `${b.complianceScore}/100`,
        b.verifiedRequirements,
        b.exceptionsCount,
        b.riskLevel,
        b.status,
      ]);
    } else if (selectedReport === 'EXCEPTION_ANALYSIS') {
      headers = ['Tender ID', 'Bidder Name', 'Category', 'Finding', 'Severity', 'Source Adapter', 'Recommendation'];
      rows = EXCEPTIONS_DATA.map((e) => [
        e.tenderNumber,
        e.bidderName,
        e.category,
        e.finding,
        e.severity,
        e.sourceAdapter,
        e.recommendation,
      ]);
    } else if (selectedReport === 'SOURCE_REPORT') {
      headers = ['Verification Source', 'Category', 'Source Type', 'Adapter Status', 'Validated Records', 'Exceptions Detected', 'Avg Latency'];
      rows = SOURCE_RECORDS.map((s) => [
        s.sourceName,
        s.category,
        s.sourceType,
        s.adapterStatus,
        s.validatedRecords,
        s.exceptionsDetected,
        s.avgLatency,
      ]);
    } else {
      headers = ['Tender ID', 'Bidder Name', 'Officer Name', 'Designation', 'Department', 'AI Recommendation', 'Officer Decision', 'Decision Date', 'Review Notes'];
      rows = OFFICER_REVIEWS.map((o) => [
        o.tenderNumber,
        o.bidderName,
        o.officerName,
        o.designation,
        o.department,
        o.aiRecommendation,
        o.officerDecision,
        o.decisionDate,
        o.reviewNotes,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-3">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-wider text-[#5F6368]">
            Government Procurement Analytics
          </p>
          <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
            Procurement Compliance Reports
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Bid verification, compliance trends, exception analysis and procurement assessment statistics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5 text-[#0B2A4A]" />}
          >
            Print Summary
          </GovButton>
          <GovButton
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </GovButton>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 select-none">
        <button
          onClick={() => setSelectedReport('COMPLIANCE_SUMMARY')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'COMPLIANCE_SUMMARY'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Compliance Summary</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Bidder compliance &amp; stats
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('TENDER_ASSESSMENT')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'TENDER_ASSESSMENT'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Tender Assessment Report</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Tender-wise verification results
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('EXCEPTION_ANALYSIS')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'EXCEPTION_ANALYSIS'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Exception Analysis</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Missing docs &amp; discrepancies
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('SOURCE_REPORT')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'SOURCE_REPORT'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Verification Source Report</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Sandbox adapter audit
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('OFFICER_REVIEW')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'OFFICER_REVIEW'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Officer Review Report</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Decisions &amp; pending reviews
          </span>
        </button>
      </div>

      {/* Main Report View Panel */}
      <GovCard highlightBorder="navy" noPadding>
        {/* Filter Controls Header */}
        <div className="p-4 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div>
              <span className="text-[#5F6368] font-semibold mr-1.5">Department Filter:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#CBD2DE] rounded-[2px] text-xs text-[#202124]"
              >
                <option value="ALL">All Procuring Departments</option>
                <option value="Department of Administrative Reforms">Department of Administrative Reforms</option>
                <option value="Ministry of Electronics & Information Technology">Ministry of Electronics &amp; IT</option>
                <option value="Department of Telecommunications">Department of Telecommunications</option>
                <option value="Department of Personnel & Training">Department of Personnel &amp; Training</option>
              </select>
            </div>

            <div>
              <span className="text-[#5F6368] font-semibold mr-1.5">Procurement Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#CBD2DE] rounded-[2px] text-xs text-[#202124]"
              >
                <option value="2026-Q3">Quarter 3 (Jul - Sep 2026)</option>
                <option value="2026-Q2">Quarter 2 (Apr - Jun 2026)</option>
                <option value="2026-FY">Financial Year 2026-27</option>
              </select>
            </div>
          </div>

          <div className="font-mono text-[#5F6368] text-[11px]">
            Generated on: <strong>22 Aug 2026 19:15 IST</strong> • SIH26100 Prototype
          </div>
        </div>

        {/* 1. Compliance Summary Table */}
        {selectedReport === 'COMPLIANCE_SUMMARY' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#F0F5FA] border border-[#CBD2DE] rounded-[2px]">
                <span className="text-[10px] uppercase font-bold text-[#5F6368]">Total Tenders</span>
                <div className="font-serif text-xl font-bold text-[#0B3558] mt-0.5">04</div>
              </div>
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[2px]">
                <span className="text-[10px] uppercase font-bold text-[#15803D]">Verified Bidders</span>
                <div className="font-serif text-xl font-bold text-[#15803D] mt-0.5">07 / 10</div>
              </div>
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[2px]">
                <span className="text-[10px] uppercase font-bold text-[#D97706]">Exceptions Found</span>
                <div className="font-serif text-xl font-bold text-[#D97706] mt-0.5">02</div>
              </div>
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[2px]">
                <span className="text-[10px] uppercase font-bold text-[#B72025]">High-Risk Bidders</span>
                <div className="font-serif text-xl font-bold text-[#B72025] mt-0.5">02</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Tender</th>
                    <th className="p-2.5 font-semibold">Department</th>
                    <th className="p-2.5 font-semibold text-center">Bidders</th>
                    <th className="p-2.5 font-semibold text-center">Verified</th>
                    <th className="p-2.5 font-semibold text-center">Pending</th>
                    <th className="p-2.5 font-semibold text-center">Exceptions</th>
                    <th className="p-2.5 font-semibold text-center">Avg Compliance</th>
                    <th className="p-2.5 font-semibold text-center">High Risk</th>
                    <th className="p-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {filteredSummaries.map((t, idx) => (
                    <tr key={t.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-[#0B2A4A] block">{t.tenderNumber}</span>
                        <span className="text-[10px] text-[#5F6368] truncate max-w-xs block">{t.title}</span>
                      </td>
                      <td className="p-2.5 text-[#202124]">{t.department}</td>
                      <td className="p-2.5 text-center font-mono font-semibold">{t.biddersCount}</td>
                      <td className="p-2.5 text-center font-mono text-[#15803D] font-bold">{t.verifiedCount}</td>
                      <td className="p-2.5 text-center font-mono text-[#D97706]">{t.pendingCount}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">
                        {t.exceptionsCount}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#0B3558]">
                        {t.avgCompliance}%
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">
                        {t.highRiskCount}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded-[2px] text-[10px] font-semibold">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Tender Assessment Report */}
        {selectedReport === 'TENDER_ASSESSMENT' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Tender ID</th>
                    <th className="p-2.5 font-semibold">Bidder Name &amp; CIN / Entity</th>
                    <th className="p-2.5 font-semibold text-center">Compliance Score</th>
                    <th className="p-2.5 font-semibold text-center">Verified Reqs</th>
                    <th className="p-2.5 font-semibold text-center">Exceptions</th>
                    <th className="p-2.5 font-semibold text-center">Risk Level</th>
                    <th className="p-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {BIDDER_ASSESSMENTS.map((b, idx) => (
                    <tr key={b.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-mono font-bold text-[#0B2A4A]">{b.tenderNumber}</td>
                      <td className="p-2.5">
                        <strong className="block text-[#0B2A4A]">{b.bidderName}</strong>
                        <span className="text-[10px] text-[#5F6368] font-mono">{b.legalEntity}</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-sm text-[#0B3558]">
                        {b.complianceScore}/100
                      </td>
                      <td className="p-2.5 text-center font-mono text-[#15803D]">{b.verifiedRequirements}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">{b.exceptionsCount}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border ${
                            b.riskLevel === 'HIGH'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-green-50 text-green-800 border-green-200'
                          }`}
                        >
                          {b.riskLevel}
                        </span>
                      </td>
                      <td className="p-2.5 text-xs text-[#202124]">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Exception Analysis Table */}
        {selectedReport === 'EXCEPTION_ANALYSIS' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Tender ID</th>
                    <th className="p-2.5 font-semibold">Bidder</th>
                    <th className="p-2.5 font-semibold">Exception Category</th>
                    <th className="p-2.5 font-semibold">Finding &amp; Discrepancy</th>
                    <th className="p-2.5 font-semibold text-center">Severity</th>
                    <th className="p-2.5 font-semibold">Source Adapter</th>
                    <th className="p-2.5 font-semibold">Recommended Officer Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {EXCEPTIONS_DATA.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-mono font-bold text-[#0B2A4A]">{e.tenderNumber}</td>
                      <td className="p-2.5 font-semibold text-[#0B2A4A]">{e.bidderName}</td>
                      <td className="p-2.5 font-bold text-[#B72025]">{e.category}</td>
                      <td className="p-2.5 text-xs text-[#202124] leading-relaxed max-w-sm">{e.finding}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border ${
                            e.severity === 'HIGH'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {e.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-[#5F6368]">{e.sourceAdapter}</td>
                      <td className="p-2.5 text-xs text-[#1E3A8A] bg-[#F0F5FA] font-medium">{e.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Verification Source Report */}
        {selectedReport === 'SOURCE_REPORT' && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[2px] text-xs text-[#1E3A8A] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Sandbox &amp; Demo Adapters Notice:</strong> This prototype executes verification via configured sandbox/mock adapters. Live production portal queries require authorized ministerial credentials and API keys.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Verification Source</th>
                    <th className="p-2.5 font-semibold">Category</th>
                    <th className="p-2.5 font-semibold">Verification Check Type</th>
                    <th className="p-2.5 font-semibold text-center">Adapter Mode</th>
                    <th className="p-2.5 font-semibold text-center">Validated Records</th>
                    <th className="p-2.5 font-semibold text-center">Exceptions Detected</th>
                    <th className="p-2.5 font-semibold text-right">Avg Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {SOURCE_RECORDS.map((s, idx) => (
                    <tr key={s.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-bold text-[#0B2A4A]">{s.sourceName}</td>
                      <td className="p-2.5 text-[#5F6368]">{s.category}</td>
                      <td className="p-2.5 text-[#202124]">{s.sourceType}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] rounded-[2px] text-[10px] font-mono font-bold">
                          {s.adapterStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#15803D]">{s.validatedRecords}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">{s.exceptionsDetected}</td>
                      <td className="p-2.5 text-right font-mono text-[#5F6368]">{s.avgLatency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Officer Review Report */}
        {selectedReport === 'OFFICER_REVIEW' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Tender ID</th>
                    <th className="p-2.5 font-semibold">Bidder</th>
                    <th className="p-2.5 font-semibold">Procurement Officer</th>
                    <th className="p-2.5 font-semibold">AI Recommendation</th>
                    <th className="p-2.5 font-semibold text-center">Officer Decision</th>
                    <th className="p-2.5 font-semibold text-center">Date</th>
                    <th className="p-2.5 font-semibold">Decision Basis / Review Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {OFFICER_REVIEWS.map((o, idx) => (
                    <tr key={o.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-mono font-bold text-[#0B2A4A]">{o.tenderNumber}</td>
                      <td className="p-2.5 font-semibold text-[#0B2A4A]">{o.bidderName}</td>
                      <td className="p-2.5">
                        <strong className="block text-[#0B2A4A]">{o.officerName}</strong>
                        <span className="text-[10px] text-[#5F6368]">{o.designation}</span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-[#5F6368]">{o.aiRecommendation}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border ${
                            o.officerDecision === 'Qualified'
                              ? 'bg-green-50 text-green-800 border-green-200'
                              : o.officerDecision === 'Disqualified'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {o.officerDecision}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-[#5F6368]">{o.decisionDate}</td>
                      <td className="p-2.5 text-xs text-[#202124] leading-relaxed max-w-sm">{o.reviewNotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </GovCard>
    </div>
  );
};
