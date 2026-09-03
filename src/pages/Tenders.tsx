import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Upload,
  Search,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { useLanguage } from '../context/LanguageContext';
import { GovPageHeader } from '../components/common/GovPageHeader';
import { useSystem } from '../context/SystemContext';

const DEPARTMENTS = [
  'Public Works Department (PWD)',
  'Highways and Minor Ports Department',
  'Rural Development and Panchayat Raj Department',
  'Municipal Administration and Water Supply Department',
  'Health and Family Welfare Department',
  'School Education Department',
  'Higher Education Department',
  'Energy Department',
  'Transport Department',
  'Industries, Investment Promotion and Commerce Department',
  'Information Technology and Digital Services Department',
  'Revenue and Disaster Management Department',
  'Finance Department',
  'Housing and Urban Development Department',
  'Environment, Climate Change and Forests Department',
  'Agriculture and Farmers Welfare Department',
  'Animal Husbandry, Dairying, Fisheries and Fishermen Welfare Department',
  'Cooperation, Food and Consumer Protection Department',
  'Commercial Taxes and Registration Department',
  'Social Welfare and Women Empowerment Department',
  'Labour Welfare and Skill Development Department',
  'Handlooms, Handicrafts, Textiles and Khadi Department',
  'Tourism Department',
  'Tamil Nadu e-Governance Agency (TNeGA)',
  'Chennai Metropolitan Water Supply and Sewerage Board',
  'Tamil Nadu Generation and Distribution Corporation Limited (TANGEDCO)',
  'Tamil Nadu Civil Supplies Corporation',
  'Chennai Metropolitan Development Authority',
  'Tamil Nadu Road Development Company',
  'Department of Administrative Reforms',
  'Department of Information Technology',
  'Other Government / PSU Organisation',
];

export const Tenders: React.FC = () => {
  const { bidders, activeTenders, isLiveDatabase, addTender, addBidder, error } = useProcurement();
  const { addAlert } = useSystem();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTenderIndex, setActiveTenderIndex] = useState(0);
  const [fadeTender, setFadeTender] = useState(true);

  // Rotate active tenders every 4.5 seconds if multiple exist
  useEffect(() => {
    if (activeTenders.length <= 1) return;
    const interval = setInterval(() => {
      setFadeTender(false);
      setTimeout(() => {
        setActiveTenderIndex((prev) => (prev + 1) % activeTenders.length);
        setFadeTender(true);
      }, 200);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTenders.length]);

  const safeIndex = activeTenderIndex < activeTenders.length ? activeTenderIndex : 0;
  const currentTender = activeTenders[safeIndex] || {
    tender_number: 'GEM/2026/B/418207',
    title: 'Supply and Installation of Network Infrastructure for Government Administrative Offices',
    department: 'Department of Administrative Reforms',
    bid_closing_date: '2026-08-30',
    estimated_value: 45000000.0,
  };

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [closingDate, setClosingDate] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [bidderGstin, setBidderGstin] = useState('');
  const [bidderPan, setBidderPan] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form validation errors
  const [tenderErrors, setTenderErrors] = useState<{ title?: string; department?: string; closingDate?: string }>({});
  const [bidderErrors, setBidderErrors] = useState<{ name?: string }>({});

  // Loading / success states
  const [tenderLoading, setTenderLoading] = useState(false);
  const [tenderSuccess, setTenderSuccess] = useState(false);
  const [bidderLoading, setBidderLoading] = useState(false);
  const [bidderSuccess, setBidderSuccess] = useState(false);

  const deptRef = useRef<HTMLDivElement>(null);

  // Close dept dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setIsDeptOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredDepts = DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];

  const validateTender = () => {
    const errs: typeof tenderErrors = {};
    if (!title.trim()) errs.title = 'Tender title is required.';
    if (!department) errs.department = 'Please select a department.';
    if (!closingDate) errs.closingDate = 'Bid closing date is required.';
    else if (closingDate < today) errs.closingDate = 'Closing date must be a future date.';
    setTenderErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateBidder = () => {
    const errs: typeof bidderErrors = {};
    if (!bidderName.trim()) errs.name = 'Bidder legal name is required.';
    setBidderErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTender() || tenderLoading || tenderSuccess) return;
    setTenderLoading(true);
    try {
      const tenderTitle = title.trim();
      await addTender(tenderTitle, department, closingDate);
      setActiveTenderIndex(0);
      addAlert({
        type: 'NEW_TENDER',
        title: 'New Tender Registered',
        message: `"${tenderTitle}" — ${department} registered a new tender.`,
        link: '/tenders',
        severity: 'LOW',
        relatedEntityId: tenderTitle,
      });
      setTenderSuccess(true);
      setStatusMessage(`Tender record created: "${tenderTitle}".`);
      setTitle('');
      setDepartment('');
      setDeptSearch('');
      setClosingDate('');
      setTenderErrors({});
      setTimeout(() => setTenderSuccess(false), 2500);
    } catch {
      // error is handled by ProcurementContext and shown via error prop
    } finally {
      setTenderLoading(false);
    }
  };

  const submitBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBidder() || bidderLoading || bidderSuccess) return;
    setBidderLoading(true);
    const name = bidderName.trim();
    try {
      await addBidder(name, bidderGstin.trim() || undefined, bidderPan.trim() || undefined);
      addAlert({
        type: 'NEW_BIDDER',
        title: 'New Bidder Registered',
        message: `New participating bidder "${name}" added.`,
        link: '/verification',
        severity: 'LOW',
        relatedEntityId: name,
      });
      setBidderSuccess(true);
      setStatusMessage(`Participating bidder enrolled: "${name}".`);
      setBidderName('');
      setBidderGstin('');
      setBidderPan('');
      setBidderErrors({});
      setTimeout(() => setBidderSuccess(false), 2500);
    } catch {
      // error is handled by ProcurementContext
    } finally {
      setBidderLoading(false);
    }
  };

  const statutoryRequirements = [
    { id: '1', category: t('page.tenders.catStatutory', 'STATUTORY COMPLIANCE'), name: t('page.tenders.reqGst', 'Valid GST registration'), mandatory: true },
    { id: '2', category: t('page.tenders.catStatutory', 'STATUTORY COMPLIANCE'), name: t('page.tenders.reqPan', 'PAN and Income Tax declaration'), mandatory: true },
    { id: '3', category: t('page.tenders.catGovRec', 'GOVERNMENT RECOGNITION'), name: t('page.tenders.reqUdyam', 'Udyam / MSME registration'), mandatory: false },
    { id: '4', category: t('page.tenders.catTech', 'TECHNICAL ELIGIBILITY'), name: t('page.tenders.reqOem', 'OEM authorization (MAF)'), mandatory: true },
    { id: '5', category: t('page.tenders.catFin', 'FINANCIAL ELIGIBILITY'), name: t('page.tenders.reqTurnover', 'Minimum annual turnover'), mandatory: true },
    { id: '6', category: t('page.tenders.catMandatoryDecl', 'MANDATORY DECLARATION'), name: t('page.tenders.reqDebarment', 'No blacklisting / debarment'), mandatory: true },
    { id: '7', category: t('page.tenders.catPref', 'PREFERENCE ORDER'), name: t('page.tenders.reqLocalContent', 'Local content declaration (Make in India)'), mandatory: false },
  ];

  const filteredBidders = bidders.filter(
    (b) =>
      b.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans pb-10 max-w-7xl mx-auto">
      {/* ── Page Header Strip ────────────────────────────────────────────── */}
      <GovPageHeader
        title={t('page.tenders.title', 'Procurement Tenders')}
        tag={t('page.tenders.tag', 'TENDER SPECIFICATION & ENROLLMENT')}
        subtitle={t('page.tenders.subtitle', 'Active government procurement files, statutory compliance status, and registered bidders.')}
        actions={
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E0854] hover:bg-[#1E053A] text-white rounded-[4px] text-xs font-semibold shadow-xs gov-btn-glossy transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>{t('page.tenders.uploadBidderDocs', 'Upload Bidder Documents')}</span>
          </Link>
        }
      />

      {statusMessage && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3 rounded-[4px] text-xs text-[#15803D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[#15803D] underline cursor-pointer text-xs font-semibold hover:text-[#166534] transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-[4px] text-xs text-[#B72025] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#B72025] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Active Tender Specification Card (Cycling / Rotating) ─────────── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className={`transition-opacity duration-200 ${fadeTender ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                {currentTender.tender_number}
              </span>
              <span className="px-2.5 py-0.5 bg-[#EDE9FE] text-[#6D28D9] rounded-full text-[11px] font-semibold">
                {t('page.tenders.activeTenderBadge', 'Active tender')}
              </span>
              <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded text-[10px] font-medium border border-[#E2E8F0]">
                {isLiveDatabase ? 'Live database record' : 'Sample records'}
              </span>
              {activeTenders.length > 1 && (
                <span className="text-[11px] font-mono font-semibold text-[#475569] ml-1">
                  {safeIndex + 1} / {activeTenders.length}
                </span>
              )}
            </div>

            <h2 className="font-serif font-bold text-base sm:text-lg text-[#0F172A] mt-2 leading-snug">
              {currentTender.title}
            </h2>

            <p className="text-xs text-[#64748B] mt-1">
              {currentTender.department} • Bid closing: {currentTender.bid_closing_date || '30 Aug 2026'}
              {currentTender.estimated_value ? ` • Estimated value: ₹${Number(currentTender.estimated_value).toLocaleString('en-IN')}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTenders.length > 1 && (
              <div className="flex items-center gap-1.5" aria-label="Tender carousel navigation">
                {activeTenders.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFadeTender(false);
                      setTimeout(() => {
                        setActiveTenderIndex(i);
                        setFadeTender(true);
                      }, 150);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === safeIndex ? 'bg-[#2E0854] w-5' : 'bg-gray-300 hover:bg-gray-400 w-2'
                    }`}
                    aria-label={`View tender ${i + 1}`}
                  />
                ))}
              </div>
            )}
            <Link
              to="/documents"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] hover:text-[#2E0854] transition-colors group px-3 py-1.5 rounded-[4px] hover:bg-gray-100"
            >
              <Upload className="w-4 h-4 text-[#0F172A] group-hover:text-[#2E0854] transition-colors" />
              <span>{t('page.tenders.uploadBidderDocs', 'Upload bidder documents')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Structured Eligibility Criteria (7 Requirements) ───────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          {t('page.tenders.structuredCriteria', 'STRUCTURED ELIGIBILITY CRITERIA (7 REQUIREMENTS):')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statutoryRequirements.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#E5E7EB] rounded-[4px] p-4 shadow-2xs hover:border-[#CBD5E1] transition-colors"
            >
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                {req.category}
              </span>
              <strong className="text-xs font-bold text-[#0F172A] block mt-1.5 leading-snug">
                {req.name}
              </strong>
              <span
                className={`text-[11px] font-semibold block mt-2.5 ${
                  req.mandatory ? 'text-[#DC2626]' : 'text-[#4F46E5]'
                }`}
              >
                {req.mandatory ? t('page.tenders.reqMandatory', 'Mandatory') : t('page.tenders.reqOptional', 'Optional / Preference')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two Forms: Create Tender Record & Add Participating Bidder ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Create Tender Record */}
        <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <FileText className="w-4 h-4 text-[#0F172A]" />
            <div>
              <h2 className="font-bold text-sm text-[#0F172A]">
                {t('page.tenders.createTenderRecord', 'Create tender record')}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {t('page.tenders.createTenderDesc', 'Official GeM or CPPP procurement description.')}
              </p>
            </div>
          </div>

          <form onSubmit={submitTender} className="mt-4 space-y-4 text-xs" noValidate>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1" htmlFor="tender-title">
                {t('page.tenders.tenderTitleLabel', 'Tender title *')}
              </label>
              <input
                id="tender-title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (tenderErrors.title) setTenderErrors((prev) => ({ ...prev, title: undefined })); }}
                placeholder={t('page.tenders.tenderTitlePlaceholder', 'Enter procurement tender title')}
                className={`w-full bg-[#F8FAFC] border rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2E0854]/20 focus:border-[#2E0854] transition-colors ${tenderErrors.title ? 'border-[#DC2626]' : 'border-[#CBD5E1]'}`}
              />
              {tenderErrors.title && <p className="text-[#DC2626] text-[11px] mt-1">{tenderErrors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Department searchable dropdown */}
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1" htmlFor="dept-search">
                  {t('page.tenders.departmentLabel', 'Department *')}
                </label>
                <div className="relative" ref={deptRef}>
                  <button
                    type="button"
                    id="dept-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isDeptOpen}
                    onClick={() => setIsDeptOpen((p) => !p)}
                    className={`w-full bg-[#F8FAFC] border rounded-[2px] px-3 py-2 text-xs text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#2E0854]/20 focus:border-[#2E0854] transition-colors cursor-pointer ${tenderErrors.department ? 'border-[#DC2626]' : 'border-[#CBD5E1]'}`}
                  >
                    <span className={department ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>
                      {department || 'Select department…'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] shrink-0 transition-transform duration-200 ${isDeptOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDeptOpen && (
                    <div
                      className="absolute z-30 top-full left-0 right-0 mt-0.5 bg-white border border-[#CBD5E1] rounded-[2px] shadow-lg overflow-hidden"
                      role="listbox"
                      aria-label="Department"
                    >
                      {/* Search within dropdown */}
                      <div className="p-2 border-b border-[#E5E7EB]">
                        <div className="relative">
                          <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="dept-search"
                            autoFocus
                            value={deptSearch}
                            onChange={(e) => setDeptSearch(e.target.value)}
                            placeholder="Search departments…"
                            className="w-full pl-7 pr-2 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] focus:outline-none focus:border-[#2E0854] transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setIsDeptOpen(false);
                              if (e.key === 'Enter' && filteredDepts.length === 1) {
                                setDepartment(filteredDepts[0]);
                                setDeptSearch('');
                                setIsDeptOpen(false);
                                if (tenderErrors.department) setTenderErrors((prev) => ({ ...prev, department: undefined }));
                              }
                            }}
                          />
                        </div>
                      </div>
                      <ul className="max-h-48 overflow-y-auto py-1">
                        {filteredDepts.length > 0 ? filteredDepts.map((dept) => (
                          <li
                            key={dept}
                            role="option"
                            aria-selected={department === dept}
                            onClick={() => {
                              setDepartment(dept);
                              setDeptSearch('');
                              setIsDeptOpen(false);
                              if (tenderErrors.department) setTenderErrors((prev) => ({ ...prev, department: undefined }));
                            }}
                            className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2 hover:bg-[#F3E8FF] transition-colors ${department === dept ? 'bg-[#F3E8FF] text-[#2E0854] font-semibold' : 'text-[#0F172A]'}`}
                          >
                            <span className="leading-snug">{dept}</span>
                            {department === dept && <Check className="w-3 h-3 text-[#2E0854] shrink-0" />}
                          </li>
                        )) : (
                          <li className="px-3 py-3 text-xs text-[#64748B] text-center">No departments match</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                {tenderErrors.department && <p className="text-[#DC2626] text-[11px] mt-1">{tenderErrors.department}</p>}
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1" htmlFor="closing-date">
                  {t('page.tenders.closingDateLabel', 'Bid closing date *')}
                </label>
                <input
                  id="closing-date"
                  type="date"
                  min={today}
                  value={closingDate}
                  onChange={(e) => { setClosingDate(e.target.value); if (tenderErrors.closingDate) setTenderErrors((prev) => ({ ...prev, closingDate: undefined })); }}
                  className={`w-full bg-white border rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2E0854]/20 focus:border-[#2E0854] transition-colors ${tenderErrors.closingDate ? 'border-[#DC2626]' : 'border-[#CBD5E1]'}`}
                />
                {tenderErrors.closingDate && <p className="text-[#DC2626] text-[11px] mt-1">{tenderErrors.closingDate}</p>}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={tenderLoading || tenderSuccess}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-[2px] text-xs font-semibold transition-all duration-150 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2E0854]/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-xs ${
                  tenderSuccess
                    ? 'bg-[#15803D] text-white border border-[#15803D]'
                    : 'bg-[#2E0854] hover:bg-[#1E053A] text-white border border-[#2E0854]'
                }`}
              >
                {tenderLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Tender…</>
                ) : tenderSuccess ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Tender Created</>
                ) : (
                  t('page.tenders.createRecordBtn', 'Create tender record')
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Right Form: Add Participating Bidder */}
        <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Plus className="w-4 h-4 text-[#0F172A]" />
            <div>
              <h2 className="font-bold text-sm text-[#0F172A]">
                {t('page.tenders.addBidderTitle', 'Add participating bidder')}
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {t('page.tenders.addBidderDesc', 'Name must match statutory registration certificates.')}
              </p>
            </div>
          </div>

          <form onSubmit={submitBidder} className="mt-4 space-y-4 text-xs" noValidate>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1" htmlFor="bidder-name">
                {t('page.tenders.bidderNameLabel', 'Bidder legal name *')}
              </label>
              <input
                id="bidder-name"
                value={bidderName}
                onChange={(e) => { setBidderName(e.target.value); if (bidderErrors.name) setBidderErrors({}); }}
                placeholder={t('page.tenders.bidderNamePlaceholder', 'Enter legal business entity name')}
                className={`w-full bg-[#F8FAFC] border rounded-[2px] px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2E0854]/20 focus:border-[#2E0854] transition-colors ${bidderErrors.name ? 'border-[#DC2626]' : 'border-[#CBD5E1]'}`}
              />
              {bidderErrors.name && <p className="text-[#DC2626] text-[11px] mt-1">{bidderErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1" htmlFor="bidder-gstin">
                  {t('page.tenders.gstinLabel', 'GSTIN (15 characters)')}
                </label>
                <input
                  id="bidder-gstin"
                  value={bidderGstin}
                  onChange={(e) => setBidderGstin(e.target.value)}
                  placeholder="27AABCT4180Q1ZV"
                  className="w-full bg-white border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#2E0854]/20 focus:border-[#2E0854] transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1" htmlFor="bidder-pan">
                  {t('page.tenders.panLabel', 'PAN (10 characters)')}
                </label>
                <input
                  id="bidder-pan"
                  value={bidderPan}
                  onChange={(e) => setBidderPan(e.target.value)}
                  placeholder="AABCT4180Q"
                  className="w-full bg-white border border-[#CBD5E1] rounded-[2px] px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#2E0854]/20 focus:border-[#2E0854] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={bidderLoading || bidderSuccess}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-[2px] text-xs font-semibold transition-all duration-150 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B1536]/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-xs ${
                  bidderSuccess
                    ? 'bg-[#15803D] text-white border border-[#15803D]'
                    : 'bg-[#0B1536] hover:bg-[#1E053A] text-white border border-[#0B1536]'
                }`}
              >
                {bidderLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enrolling…</>
                ) : bidderSuccess ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Bidder Enrolled</>
                ) : (
                  t('page.tenders.enrollBidderBtn', 'Enroll participating bidder')
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ── Participating Bidders Register Table ───────────────────────────── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-2xs overflow-hidden">
        {/* Soft Lavender Header Banner */}
        <div className="bg-[#FAF8FD] p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#0F172A]">
              {t('page.tenders.enrolledBiddersTitle', 'Participating bidders register')}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('page.tenders.subtitle', 'Enrolled bidders, document submission status, compliance scores, and evidence links.')}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder={t('page.tenders.searchBidderPlaceholder', 'Search enrolled bidder by name or ID...')}
              className="w-full bg-white border border-[#CBD5E1] rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854] focus:ring-2 focus:ring-[#2E0854]/15 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#475569]">
                <th className="py-3 px-4 font-semibold w-[120px]">{t('page.tenders.thBidderId', 'BIDDER ID & LEGAL ENTITY')}</th>
                <th className="py-3 px-4 font-semibold">{t('page.tenders.thIdentifiers', 'STATUTORY IDENTIFIERS')}</th>
                <th className="py-3 px-4 font-semibold w-[180px]">{t('page.tenders.thEvidence', 'SUBMITTED EVIDENCE')}</th>
                <th className="py-3 px-4 font-semibold w-[140px]">{t('page.bidderVerification.complianceScore', 'COMPLIANCE SCORE')}</th>
                <th className="py-3 px-4 font-semibold w-[120px]">{t('page.bidderVerification.complianceRisk', 'RISK LEVEL')}</th>
                <th className="py-3 px-4 font-semibold w-[140px]">{t('page.bidderVerification.complianceStatus', 'STATUS')}</th>
                <th className="py-3 px-4 font-semibold text-right w-[160px]">{t('page.tenders.thAction', 'OFFICER ACTION')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredBidders.length > 0 ? (
                filteredBidders.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Bidder ID */}
                    <td className="py-3.5 px-4 font-mono text-xs text-[#0F172A]">
                      {b.id}
                    </td>

                    {/* Legal Entity Name */}
                    <td className="py-3.5 px-4">
                      <strong className="text-xs text-[#1E0A45] block font-bold">
                        {b.name}
                      </strong>
                      <span className="text-[11px] block mt-0.5">
                        {b.exceptions > 0 ? (
                          <span className="text-[#DC2626] font-medium">
                            {b.exceptions} {t('page.bidderVerification.exceptions', 'exception(s) detected')}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            {t('page.bidderVerification.verified', 'All statutory requirements verified')}
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Submitted Documents */}
                    <td className="py-3.5 px-4 text-xs text-[#0F172A]">
                      {b.documents || 0} {t('page.bidderVerification.documents', 'files attached')}
                    </td>

                    {/* Compliance Score */}
                    <td className="py-3.5 px-4 font-bold text-sm text-[#0F172A] font-mono">
                      {b.score ? `${Math.round(b.score)}/100` : '—'}
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                        <Check className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>{t('status.lowRisk', 'Low')}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-[2px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                        {b.status === 'UNDER_REVIEW' || b.status === 'Under Review'
                          ? t('status.underReview', 'Under Review')
                          : b.status === 'QUALIFIED' || b.status === 'Qualified'
                          ? t('status.qualified', 'Qualified')
                          : b.status === 'DISQUALIFIED' || b.status === 'Disqualified'
                          ? t('status.disqualified', 'Disqualified')
                          : b.status || t('status.underReview', 'Under Review')}
                      </span>
                    </td>

                    {/* Action Link */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/verification/${b.id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2E0854] hover:text-[#1E053A] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E0854]/30 rounded-[2px]"
                      >
                        <span>{t('page.hub.verifyBidder', 'Open assessment')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                    No participating bidders enrolled yet. Add a bidder above to begin compliance verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Tenders;
