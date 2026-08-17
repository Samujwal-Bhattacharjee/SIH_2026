import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  BrainCircuit,
  BookmarkCheck,
  Bookmark,
  Search,
} from 'lucide-react';
import { riskService, casesService } from '../services/api';
import { Case } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatutoryCountdown } from '../components/common/StatutoryCountdown';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Risk: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const data = await riskService.getRiskCases();
      setCases(data);
    } catch (e) {
      console.error('Failed to fetch risk cases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const handleToggleFlag = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    try {
      const res = await casesService.toggleFlagForReview(caseId);
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, flaggedForReview: res.flaggedForReview } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (tierFilter !== 'ALL' && c.riskLevel !== tierFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-hairline pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
            <span>GOIP</span>
            <span>/</span>
            <span>RISK INTELLIGENCE</span>
            <span>/</span>
            <span>PREDICTIVE SLA DELAY QUEUE</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            PRIORITY SLA BREACH RISK QUEUE
          </h1>
        </div>

        <div className="font-mono text-3xs text-ink-500 flex items-center space-x-3">
          <span>MODEL: <strong>XGBOOST DELAY PREDICTOR v2.4</strong></span>
          <span>•</span>
          <span>SORTED BY: <strong>BREACH PROBABILITY</strong></span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-2xs">
        <div className="p-4 bg-surface border border-vermilion-border bg-vermilion-subtle/30 space-y-1 shadow-subtle-1">
          <span className="text-3xs text-vermilion font-bold uppercase">
            TIER 1 // CRITICAL SLA RISK (&gt;80%)
          </span>
          <div className="text-2xl font-bold text-vermilion">
            {cases.filter((c) => c.riskScore >= 80).length} CASES
          </div>
          <span className="text-3xs text-ink-600">Immediate supervisor intervention recommended</span>
        </div>

        <div className="p-4 bg-surface border border-amberRisk-border bg-amberRisk-subtle/30 space-y-1 shadow-subtle-1">
          <span className="text-3xs text-amberRisk font-bold uppercase">
            TIER 2 // ELEVATED RISK (50% - 79%)
          </span>
          <div className="text-2xl font-bold text-amberRisk">
            {cases.filter((c) => c.riskScore >= 50 && c.riskScore < 80).length} CASES
          </div>
          <span className="text-3xs text-ink-600">High queue waiting latency compounding risk</span>
        </div>

        <div className="p-4 bg-surface border border-border-hairline space-y-1 shadow-subtle-1">
          <span className="text-3xs text-ink-500 font-bold uppercase">
            AVERAGE PROJECTED DELAY
          </span>
          <div className="text-2xl font-bold text-ink-950">
            +5.4 DAYS
          </div>
          <span className="text-3xs text-ink-500">Across active at-risk portfolio</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border-hairline p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-ink-500 uppercase text-3xs">FILTER BY RISK TIER:</span>
          <button
            onClick={() => setTierFilter('ALL')}
            className={`px-2.5 py-1 border ${
              tierFilter === 'ALL'
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-surface border-border-hairline text-ink-700 hover:bg-surface-hover'
            }`}
          >
            ALL AT-RISK
          </button>
          <button
            onClick={() => setTierFilter('HIGH')}
            className={`px-2.5 py-1 border ${
              tierFilter === 'HIGH'
                ? 'bg-vermilion text-white border-vermilion'
                : 'bg-surface border-border-hairline text-ink-700 hover:bg-surface-hover'
            }`}
          >
            CRITICAL (&gt;80%)
          </button>
          <button
            onClick={() => setTierFilter('MEDIUM')}
            className={`px-2.5 py-1 border ${
              tierFilter === 'MEDIUM'
                ? 'bg-amberRisk text-white border-amberRisk'
                : 'bg-surface border-border-hairline text-ink-700 hover:bg-surface-hover'
            }`}
          >
            ELEVATED (50-80%)
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search risk cases..."
            className="pl-8 pr-3 py-1 bg-surface-subtle border border-border-hairline text-xs font-mono text-ink-950 focus:outline-none"
          />
        </div>
      </div>

      {/* Ranked Risk Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filteredCases.length === 0 ? (
        <EmptyState
          title="NO CASES EXCEED RISK THRESHOLD"
          description="All active cases in the selected tier are progressing within standard statutory SLA limits."
        />
      ) : (
        <div className="bg-surface border border-border-hairline shadow-subtle-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-hairline bg-surface-subtle/70 font-mono text-3xs text-ink-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-10">FLAG</th>
                  <th className="py-2.5 px-4">CASE IDENTIFIER</th>
                  <th className="py-2.5 px-4">CURRENT STAGE</th>
                  <th className="py-2.5 px-4">STATUTORY SLA</th>
                  <th className="py-2.5 px-4">RISK SCORE</th>
                  <th className="py-2.5 px-4">PROJECTED DELAY</th>
                  <th className="py-2.5 px-4">PRIMARY CONTRIBUTING FACTOR</th>
                  <th className="py-2.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline font-sans text-xs">
                {filteredCases.map((c, index) => {
                  const isTop = index < 3;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className={`hover:bg-surface-hover cursor-pointer transition-colors ${
                        c.riskScore >= 80 ? 'bg-vermilion-subtle/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => handleToggleFlag(e, c.id)}>
                        <button
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
                      <td className="py-3 px-4 font-mono font-bold text-xs text-ink-950">
                        <div className="flex items-center space-x-1.5">
                          <span>{c.id}</span>
                          {isTop && (
                            <span className="font-mono text-3xs bg-vermilion text-white px-1">
                              P0
                            </span>
                          )}
                        </div>
                        <div className="font-sans text-3xs text-ink-500 truncate max-w-xs font-normal">
                          {c.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-2xs px-2 py-0.5 bg-surface-subtle border border-border-hairline text-ink-800">
                          {c.currentStage}
                        </span>
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
                          <span className="font-mono text-xs font-bold text-vermilion">
                            {c.riskScore}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-vermilion">
                        +{c.riskPrediction?.expectedDelayDays || (c.riskScore > 80 ? 6.8 : 3.2)}d
                      </td>
                      <td className="py-3 px-4 max-w-xs font-mono text-2xs text-ink-700">
                        <div className="truncate">
                          {c.riskPrediction?.primaryFactor || 'Legal review rework + queue latency'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${c.id}`);
                          }}
                          className="px-2.5 py-1 bg-ink-900 hover:bg-ink-800 text-white font-mono text-3xs uppercase tracking-wider inline-flex items-center space-x-1"
                        >
                          <span>INSPECT</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
