import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Lock,
  Building2,
  FileCheck,
} from 'lucide-react';

interface VerificationSource {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  adapterType: string;
  status: 'Sandbox / Mock' | 'Configured (Demo)';
  verifiedParams: string[];
  lastPing: string;
  sampleIdentifier: string;
}

const VERIFICATION_SOURCES: VerificationSource[] = [
  {
    id: 'gst',
    name: 'Goods & Services Tax Network (GSTN)',
    code: 'GST-SRC-01',
    category: 'Taxation & Statutory Registration',
    description: 'Validates 15-character GSTIN, active taxpayer status, and legal entity name.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['GSTIN Format', 'Active Status', 'State Code', 'Legal Name'],
    lastPing: '24ms',
    sampleIdentifier: '27AABCT4180Q1ZV',
  },
  {
    id: 'udyam',
    name: 'Udyam / MSME Portal',
    code: 'UDYAM-SRC-02',
    category: 'Enterprise Classification',
    description: 'Verifies Micro, Small & Medium enterprise registration and category.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['Udyam Registration Number', 'Enterprise Category', 'NIC Code'],
    lastPing: '18ms',
    sampleIdentifier: 'UDYAM-MH-19-0042186',
  },
  {
    id: 'pan',
    name: 'Income Tax Department (PAN Verification)',
    code: 'PAN-SRC-03',
    category: 'Taxation & Statutory Registration',
    description: 'Cross-verifies 10-character Permanent Account Number and active tax status.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['PAN Number', 'Entity Legal Name', 'Active Status'],
    lastPing: '20ms',
    sampleIdentifier: 'AABCT4180Q',
  },
  {
    id: 'mca',
    name: 'MCA21 Corporate Registry (Ministry of Corporate Affairs)',
    code: 'MCA-SRC-04',
    category: 'Corporate Legal Existence',
    description: 'Validates Corporate Identity Number (CIN/LLPIN), incorporation date, and directors.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['CIN / LLPIN', 'Company Status', 'Paid-up Capital'],
    lastPing: '32ms',
    sampleIdentifier: 'U72200MH2016PTC284910',
  },
  {
    id: 'epfo',
    name: 'Employees’ Provident Fund Organisation (EPFO)',
    code: 'EPFO-SRC-07',
    category: 'Statutory Labour Compliance',
    description: 'Cross-checks establishment code and active monthly return filing compliance.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['Establishment Code', 'Active Return Filing', 'Staff Count Range'],
    lastPing: '28ms',
    sampleIdentifier: 'DL/CPM/0048192/000',
  },
  {
    id: 'esic',
    name: 'Employees’ State Insurance Corporation (ESIC)',
    code: 'ESIC-SRC-08',
    category: 'Statutory Labour Compliance',
    description: 'Verifies 17-digit employer code and monthly contribution compliance status.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['17-digit Employer Code', 'Contribution Status', 'Regional Office'],
    lastPing: '25ms',
    sampleIdentifier: '31000481920000101',
  },
  {
    id: 'oem',
    name: 'OEM Authorization Validator (MAF Verification)',
    code: 'OEM-SRC-11',
    category: 'Technical Compliance',
    description: 'Extracts and verifies Manufacturer Authorization Form validity and tender binding.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['OEM Letter Reference', 'Tender Number Binding', 'Expiry Date'],
    lastPing: '35ms',
    sampleIdentifier: 'OEM-AUTH/26/019',
  },
  {
    id: 'debarment',
    name: 'Central Debarment & Blacklist Register (CPPP / GeM)',
    code: 'DEBAR-SRC-12',
    category: 'Integrity & Legal Eligibility',
    description: 'Cross-references bidder legal name, director DINs, and PAN against debarment orders.',
    adapterType: 'Sandbox / Mock adapter',
    status: 'Sandbox / Mock',
    verifiedParams: ['Debarment Register', 'GeM Incident History', 'Director DIN Cross-Check'],
    lastPing: '12ms',
    sampleIdentifier: 'PAN:AABCT4180Q',
  },
];

export const VerificationSources: React.FC = () => {
  const [testSourceId, setTestSourceId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestAdapter = (source: VerificationSource) => {
    setTestSourceId(source.id);
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      setTestResult({
        id: source.id,
        message: `[Sandbox adapter verified] Queried mock provider for "${source.name}". Synthetic test on identifier ${source.sampleIdentifier} returned VALID.`,
      });
    }, 600);
  };

  return (
    <div className="space-y-4 font-sans pb-8">
      {/* Header */}
      <div className="border-b border-[#D9DDE3] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase font-semibold text-[#475569] tracking-wider block">
            Government Verification Adapters
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] mt-0.5">
            Verification Sources Registry
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Configured statutory databases, registries, and mock/sandbox verification adapters for tender compliance assessment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] rounded-[2px] font-mono text-[11px] font-semibold">
            ENVIRONMENT: DEMO / SANDBOX
          </span>
        </div>
      </div>

      {/* SIH Transparency Notice */}
      <section className="border border-[#BFDBFE] bg-[#EFF6FF] p-3.5 rounded-[2px] text-xs text-[#1E3A8A] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Sandbox architecture statement:</strong> This prototype operates using <strong>sandbox/mock verification adapters</strong>. Direct production integration with live government databases (GSTN, MCA21, EPFO, etc.) requires authorized departmental API keys, VPN tunnels, and production network whitelisting. No live government databases are represented as connected during this demonstration.
        </div>
      </section>

      {/* Official Registry Table */}
      <section className="bg-white border border-[#D9DDE3] rounded-[2px]">
        <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between">
          <h2 className="font-serif font-bold text-sm text-[#0B2A4A]">
            Configured verification adapters ({VERIFICATION_SOURCES.length})
          </h2>
          <span className="text-[11px] text-[#475569] font-mono">
            Protocol: REST / Local Sandbox
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Source identifier &amp; name</th>
                <th>Category</th>
                <th>Verification parameters</th>
                <th>Adapter type</th>
                <th>Status</th>
                <th>Latency</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {VERIFICATION_SOURCES.map((source) => (
                <tr key={source.id}>
                  <td>
                    <span className="font-mono text-[10px] text-[#475569] font-semibold block">
                      {source.code}
                    </span>
                    <strong className="text-xs text-[#202124] block mt-0.5">
                      {source.name}
                    </strong>
                    <span className="text-[11px] text-[#475569] block mt-0.5">
                      {source.description}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[#475569]">{source.category}</span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {source.verifiedParams.map((p, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.2 bg-[#F0F2F5] text-[#202124] rounded-[2px] text-[10px]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="text-[11px] text-[#475569] font-mono">
                      {source.adapterType}
                    </span>
                  </td>
                  <td>
                    <span className="inline-block px-2 py-0.5 bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] rounded-[2px] text-[10px] font-semibold">
                      {source.status}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#15803D] font-semibold">
                    {source.lastPing}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleTestAdapter(source)}
                      disabled={testing && testSourceId === source.id}
                      className="px-2.5 py-1 bg-white hover:bg-[#F0F4F8] text-[#0B2A4A] border border-[#CBD2DE] rounded-[2px] text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${testing && testSourceId === source.id ? 'animate-spin' : ''}`} />
                      <span>{testing && testSourceId === source.id ? 'Testing...' : 'Test adapter'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Test Result Callout */}
      {testResult && (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[2px] text-xs text-[#15803D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-[#15803D] text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationSources;
