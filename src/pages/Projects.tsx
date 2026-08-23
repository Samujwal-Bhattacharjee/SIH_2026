import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import {
  Search,
  Download,
  PlusCircle,
  BrainCircuit,
  Filter,
  RefreshCw,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { projectService } from '../services/api';
import { Case } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';
import { inputBaseClasses, selectBaseClasses } from '../components/common/FormField';
import { FileRegisterModal } from '../components/files/FileRegisterModal';

const LA_STAGES: string[] = [
  'ALL',
  'Project Initiation',
  'Land Identification',
  'Preliminary Notification',
  'Survey and Verification',
  'Ownership Verification',
  'Objection and Legal Review',
  'Compensation Assessment',
  'Compensation Disbursement',
  'R&R and Rehabilitation',
  'Final Acquisition',
  'Possession and Handover',
];

const DISTRICTS: string[] = [
  'ALL',
  'Nashik',
  'Pune',
  'Aurangabad',
  'Nagpur',
  'Jaipur',
  'Bengaluru',
  'Lucknow',
  'Ahmedabad',
];

const RISK_LEVELS: string[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const Projects: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [districtFilter, setDistrictFilter] = useState(searchParams.get('district') || 'ALL');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || 'ALL');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjects({
        district: districtFilter,
        stage: stageFilter,
        riskLevel: riskFilter,
        search: searchQuery,
      });
      setProjects(res.projects || []);
    } catch (e) {
      console.error('Failed to fetch land acquisition projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [location.key, districtFilter, stageFilter, riskFilter, searchQuery]);

  const handleResetFilters = () => {
    setDistrictFilter('ALL');
    setStageFilter('ALL');
    setRiskFilter('ALL');
    setSearchQuery('');
  };

  const columns: TableColumn<Case>[] = [
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (p: Case) => (
        <div className="space-y-0.5">
          <Link
            to={`/projects/${p.id}`}
            className="font-mono font-bold text-[#0B2A4A] hover:underline text-xs"
          >
            {p.projectCode || p.fileNumber || p.id}
          </Link>
          <span className="text-[10px] text-[#5F6368] block">
            {p.totalArea ? `${p.totalArea} Ha` : '35 Ha'}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'title',
      header: 'Project Description & Location',
      render: (p: Case) => (
        <div className="max-w-[280px]">
          <Link
            to={`/projects/${p.id}`}
            className="font-semibold text-[#202124] hover:text-[#0B2A4A] line-clamp-1 text-xs"
          >
            {p.title}
          </Link>
          <div className="text-[11px] text-[#5F6368] flex items-center space-x-1.5 mt-0.5">
            <span className="font-medium text-[#0B2A4A]">{p.district || 'Nashik'}</span>
            <span>•</span>
            <span>{p.state || 'Maharashtra'}</span>
            <span>•</span>
            <span>{p.department}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'currentStage',
      header: 'Current Stage',
      render: (p: Case) => (
        <span className="px-2 py-0.5 bg-gray-100 text-[#0B2A4A] font-sans text-xs font-semibold rounded-[2px] border border-gray-300 whitespace-nowrap">
          {p.currentStage}
        </span>
      ),
    },
    {
      key: 'delayProbability',
      header: 'Delay Probability (ML)',
      render: (p: Case) => {
        const prob = p.delayProbability ?? (p.riskScore / 100);
        const probPct = Math.round(prob * 100);
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                probPct >= 80 ? 'bg-red-100 text-red-800 border border-red-300' :
                probPct >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-green-100 text-green-800 border border-green-300'
              }`}>
                {probPct}% P(Delay)
              </span>
            </div>
            {p.predictedDelayDays ? (
              <span className="text-[10px] text-red-700 font-bold block font-mono">
                +{p.predictedDelayDays}d Delay Expected
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'disputeStatus',
      header: 'Dispute / Dwell Status',
      render: (p: Case) => (
        <div className="space-y-0.5 text-[11px]">
          {p.ownershipConflict ? (
            <span className="text-red-700 font-bold block">• Ownership Conflict</span>
          ) : null}
          {p.legalDispute ? (
            <span className="text-red-700 font-bold block">• Court Case Active</span>
          ) : null}
          {p.compensationPendingDays && p.compensationPendingDays > 0 ? (
            <span className="text-amber-700 font-medium block">• Comp. Pending ({p.compensationPendingDays}d)</span>
          ) : null}
          {!p.ownershipConflict && !p.legalDispute && (!p.compensationPendingDays || p.compensationPendingDays === 0) ? (
            <span className="text-emerald-700 font-medium block">✓ Regular Movement</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Case) => (
        <div className="flex items-center space-x-1.5 justify-end">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/projects/${p.id}`)}
          >
            Details
          </GovButton>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
            Tender &amp; Procurement Register
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Procurement dockets and bidder evaluations with real-time compliance assessment.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            New Project
          </GovButton>
        </div>
      </div>

      {/* Filters Card */}
      <GovCard title="Search &amp; Filter Criteria" noPadding>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider mb-1">
              Search Project / Code / District
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, code, survey no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputBaseClasses} pl-8`}
              />
              <Search className="w-3.5 h-3.5 text-[#5F6368] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider mb-1">
              District
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className={selectBaseClasses}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d === 'ALL' ? 'All Districts' : d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider mb-1">
              Acquisition Stage
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className={selectBaseClasses}
            >
              {LA_STAGES.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Stages' : s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider mb-1">
              Risk Classification
            </label>
            <div className="flex items-center space-x-2">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className={selectBaseClasses}
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{r === 'ALL' ? 'All Risk Levels' : r}</option>
                ))}
              </select>
              <GovButton variant="secondary" size="sm" onClick={handleResetFilters}>
                Reset
              </GovButton>
            </div>
          </div>
        </div>
      </GovCard>

      {/* Projects Table */}
      <GovTable
        columns={columns}
        data={projects}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage="No land acquisition projects matched your filter criteria."
      />

      {/* Register Modal */}
      <FileRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCreated={(newCase) => {
          setIsRegisterOpen(false);
          navigate(`/projects/${newCase.id}`);
        }}
      />
    </div>
  );
};
export default Projects;
