import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import { riskService } from '../services/api';
import { Case } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { StatusBadge } from '../components/common/GovBadge';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';

export const Risk: React.FC = () => {
  const [riskCases, setRiskCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const navigate = useNavigate();

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const data = await riskService.getRiskCases();
      setRiskCases(data);
    } catch (err) {
      console.error('Failed to fetch risk cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const filteredCases =
    riskFilter === 'ALL' ? riskCases : riskCases.filter((c) => c.riskLevel === riskFilter);

  const columns: TableColumn<Case>[] = [
    {
      key: 'fileNumber',
      header: 'File Docket Ref',
      width: '170px',
      sortable: true,
      render: (item) => (
        <Link
          to={`/files/${item.id}`}
          className="font-mono font-bold text-xs text-[#0B2A4A] hover:underline"
        >
          {item.fileNumber || item.id}
        </Link>
      ),
    },
    {
      key: 'subject',
      header: 'Subject Matter',
      render: (item) => (
        <div className="space-y-0.5 max-w-sm">
          <Link
            to={`/files/${item.id}`}
            className="font-semibold text-xs text-[#202124] hover:text-[#0B2A4A] line-clamp-1"
          >
            {item.subject || item.title}
          </Link>
          <div className="text-[11px] text-[#5F6368]">{item.department}</div>
        </div>
      ),
    },
    {
      key: 'currentStage',
      header: 'Current Stage & Officer',
      width: '180px',
      render: (item) => (
        <div>
          <div className="font-semibold text-xs text-[#0B2A4A]">{item.currentStage}</div>
          <div className="text-[11px] text-[#5F6368]">{item.assignedOfficer}</div>
        </div>
      ),
    },
    {
      key: 'ageDays',
      header: 'Days in Stage / Benchmark',
      width: '180px',
      align: 'center',
      render: (item) => {
        const bench = item.riskPrediction?.historicalBaselineDays || 7;
        const excess = item.riskPrediction?.excessPercentage || Math.round(((item.ageDays - bench) / bench) * 100);
        return (
          <div className="text-center font-mono">
            <span className="font-bold text-xs text-[#B72025]">{item.ageDays} Days in Queue</span>
            <span className="text-[11px] text-[#5F6368] block">
              Historical Avg: {bench}d ({excess > 0 ? `+${excess}%` : `${excess}%`})
            </span>
          </div>
        );
      },
    },
    {
      key: 'riskLevel',
      header: 'Risk Rating',
      width: '130px',
      align: 'center',
      render: (item) => <StatusBadge status={item.riskLevel} size="sm" />,
    },
    {
      key: 'reason',
      header: 'Delay Risk Attribution Reason',
      render: (item) => (
        <div className="text-xs text-[#202124] max-w-md space-y-1">
          <p className="line-clamp-2">
            {item.riskPrediction?.primaryFactor || 'Current processing time deviates from historical benchmark.'}
          </p>
          {item.riskPrediction?.recommendedAction && (
            <span className="text-[11px] text-[#0B2A4A] font-semibold block">
              Action: {item.riskPrediction.recommendedAction}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '130px',
      align: 'right',
      render: (item) => (
        <GovButton
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/projects/${item.id}`)}
        >
          Inspect Project
        </GovButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
              Bidder Compliance &amp; Exception Risk Assessment
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-[2px] border border-emerald-300">
              Rule Evaluator (v2.1)
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Identify procurement bidders at high risk of non-compliance based on statutory certificate checks, OEM authorization, and turnover verification.
          </p>
        </div>

        <GovButton
          variant="secondary"
          size="sm"
          onClick={fetchRiskData}
          icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B2A4A]" />}
        >
          Recalculate Risk
        </GovButton>
      </div>

      {/* Filter Tabs & Risk Table */}
      <GovCard noPadding highlightBorder="saffron">
        <div className="p-4 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[#5F6368] font-semibold">Filter by Risk Rating:</span>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-3 py-1 rounded-[2px] font-semibold text-xs transition-colors cursor-pointer ${
                  riskFilter === r
                    ? 'bg-[#0B2A4A] text-white'
                    : 'bg-white border border-[#CBD2DE] text-[#202124] hover:bg-gray-100'
                }`}
              >
                {r === 'ALL' ? 'All Risk Levels' : `${r} Risk`}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs text-[#5F6368]">
            At-Risk Cases: <strong className="text-[#B72025]">{filteredCases.length}</strong>
          </div>
        </div>

        <GovTable
          columns={columns}
          data={filteredCases}
          keyExtractor={(item) => item.id}
          loading={loading}
          pageSize={10}
        />
      </GovCard>
    </div>
  );
};
