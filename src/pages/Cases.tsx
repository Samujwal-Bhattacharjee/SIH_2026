import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  ArrowUpDown,
  ExternalLink,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { casesService } from '../services/api';
import { Case } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatutoryCountdown } from '../components/common/StatutoryCountdown';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

const DEPARTMENTS = [
  'ALL',
  'Land Revenue',
  'Urban Planning',
  'Social Welfare',
  'Public Works',
  'Environment & Forests',
  'Commerce & Industry',
];

const STAGES = [
  'ALL',
  'Application Received',
  'Document Verification',
  'Department Assignment',
  'Officer Review',
  'Legal Review',
  'Approval',
  'Closure',
];

const RISK_LEVELS = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

export const Cases: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || 'ALL');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'ALL');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || 'ALL');
  const [sortBy, setSortBy] = useState<'riskScore' | 'ageDays' | 'daysRemaining'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await casesService.getCases({
        department: departmentFilter,
        stage: stageFilter,
        riskLevel: riskFilter,
        search: searchQuery,
      });
      setCases(res.cases);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [departmentFilter, stageFilter, riskFilter, searchQuery]);

  const handleToggleFlag = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    try {
      const res = await casesService.toggleFlagForReview(caseId);
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, flaggedForReview: res.flaggedForReview } : c))
      );
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  const handleResetFilters = () => {
    setDepartmentFilter('ALL');
    setStageFilter('ALL');
    setRiskFilter('ALL');
    setSearchQuery('');
  };

  // Sorting
  const sortedCases = [...cases].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'riskScore') diff = b.riskScore - a.riskScore;
    if (sortBy === 'ageDays') diff = b.ageDays - a.ageDays;
    if (sortBy === 'daysRemaining') diff = a.daysRemaining - b.daysRemaining;
    return sortOrder === 'desc' ? diff : -diff;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>CASE INTELLIGENCE</span>
            <span>/</span>
            <span>MASTER REPOSITORY</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            GOVERNMENT CASE WORKFLOW REGISTRY
          </h1>
        </div>

        <div className="font-mono text-3xs text-ink-500 flex items-center space-x-3">
          <span>SHOWING <strong className="text-ink-900">{cases.length}</strong> ACTIVE RECORDS</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-surface border border-border-hairline p-4 space-y-3 shadow-subtle-1 font-mono text-2xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Case ID, applicant, or subject..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface-subtle border border-border-hairline text-ink-950 placeholder:text-ink-400 focus:outline-none focus:border-ink-900"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border-hairline text-ink-950 focus:outline-none focus:border-ink-900"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  DEPARTMENT: {dept.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border-hairline text-ink-950 focus:outline-none focus:border-ink-900"
            >
              {STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  STAGE: {stg.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border-hairline text-ink-950 focus:outline-none focus:border-ink-900"
            >
              {RISK_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  RISK LEVEL: {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(departmentFilter !== 'ALL' || stageFilter !== 'ALL' || riskFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-border-hairline text-3xs">
            <div className="flex items-center space-x-2">
              <span className="text-ink-400">ACTIVE FILTERS:</span>
              {departmentFilter !== 'ALL' && (
                <span className="px-1.5 py-0.5 bg-surface border border-border-hairline">
                  DEPT: {departmentFilter}
                </span>
              )}
              {stageFilter !== 'ALL' && (
                <span className="px-1.5 py-0.5 bg-surface border border-border-hairline">
                  STAGE: {stageFilter}
                </span>
              )}
              {riskFilter !== 'ALL' && (
                <span className="px-1.5 py-0.5 bg-surface border border-border-hairline">
                  RISK: {riskFilter}
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-vermilion hover:underline font-bold"
            >
              RESET ALL
            </button>
          </div>
        )}
      </div>

      {/* Case Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : sortedCases.length === 0 ? (
        <EmptyState
          title="NO CASE RECORDS MATCH FILTERS"
          description="No government files matched your search or department/stage query parameters."
          actionText="RESET FILTERS"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="bg-surface border border-border-hairline shadow-subtle-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-hairline bg-surface-subtle/70 font-mono text-3xs text-ink-500 uppercase tracking-wider select-none">
                  <th className="py-2.5 px-4 w-10">FLAG</th>
                  <th
                    onClick={() => {
                      setSortBy('riskScore');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-4 cursor-pointer hover:text-ink-900"
                  >
                    <div className="flex items-center space-x-1">
                      <span>CASE ID</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4">SUBJECT & APPLICANT</th>
                  <th className="py-2.5 px-4">DEPARTMENT</th>
                  <th className="py-2.5 px-4">CURRENT STAGE</th>
                  <th
                    onClick={() => {
                      setSortBy('ageDays');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-4 cursor-pointer hover:text-ink-900"
                  >
                    <div className="flex items-center space-x-1">
                      <span>AGE</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortBy('daysRemaining');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-4 cursor-pointer hover:text-ink-900"
                  >
                    <div className="flex items-center space-x-1">
                      <span>STATUTORY SLA</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4">RISK</th>
                  <th className="py-2.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline font-sans text-xs">
                {sortedCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className={`hover:bg-surface-hover cursor-pointer transition-colors ${
                      c.flaggedForReview ? 'bg-purple-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4" onClick={(e) => handleToggleFlag(e, c.id)}>
                      <button
                        title={c.flaggedForReview ? 'Flagged for human review' : 'Flag for human review'}
                        className={`p-1 transition-colors ${
                          c.flaggedForReview ? 'text-purple-600' : 'text-ink-300 hover:text-ink-600'
                        }`}
                      >
                        {c.flaggedForReview ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink-950 text-xs">
                      {c.id}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-medium text-ink-900 truncate">{c.title}</div>
                      <div className="font-mono text-3xs text-ink-500 mt-0.5 truncate">
                        {c.applicant} • {c.caseType}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-ink-700">
                      {c.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-2xs px-2 py-0.5 bg-surface-subtle border border-border-hairline text-ink-800">
                        {c.currentStage}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-ink-600">
                      {c.ageDays}d
                    </td>
                    <td className="py-3 px-4">
                      <StatutoryCountdown
                        daysRemaining={c.daysRemaining}
                        statutoryDeadlineDays={c.statutoryDeadlineDays}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <StatusBadge riskLevel={c.riskLevel} />
                        <span className="font-mono text-2xs font-bold text-ink-900">
                          {c.riskScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${c.id}`);
                        }}
                        className="px-2.5 py-1 bg-ink-900 hover:bg-ink-800 text-white font-mono text-3xs uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
                      >
                        <span>INSPECT</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
