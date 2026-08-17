import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building2,
  Filter,
  TrendingUp,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { FormField, selectBaseClasses } from '../components/common/FormField';
import { MOCK_DEPARTMENTS, MOCK_PERFORMANCE_METRICS, MOCK_OFFICERS } from '../mock/data';

type ReportType =
  | 'DISPOSAL_REPORT'
  | 'SLA_COMPLIANCE'
  | 'PENDING_AGING'
  | 'OFFICER_WORKLOAD';

export const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('DISPOSAL_REPORT');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('2026-Q3');

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (selectedReport === 'DISPOSAL_REPORT') {
      headers = ['Department', 'Active Files', 'Pending Files', 'Avg Disposal Days', 'SLA Compliance %'];
      rows = MOCK_DEPARTMENTS.map((d) => [d.name, d.activeFilesCount, d.pendingFilesCount, d.avgDisposalDays, `${d.slaCompliancePct}%`]);
    } else if (selectedReport === 'SLA_COMPLIANCE') {
      headers = ['Month', 'On-Time Adherence %', 'At-Risk %', 'Breached %'];
      rows = MOCK_PERFORMANCE_METRICS.slaAdherenceTrends.map((t) => [t.month, `${t.onTimePct}%`, `${t.atRiskPct}%`, `${t.breachedPct}%`]);
    } else if (selectedReport === 'PENDING_AGING') {
      headers = ['Stage', 'Active Scrutiny Days', 'Queue Waiting Days', 'Total Days', 'Pending Files'];
      rows = MOCK_PERFORMANCE_METRICS.stageBreakdown.map((s) => [s.stage, s.activeProcessingDays, s.waitingDays, s.totalDays, s.queueCount]);
    } else {
      headers = ['Officer Name', 'Designation', 'Department', 'Desk', 'Active Files', 'Pending Files'];
      rows = MOCK_OFFICERS.map((o) => [o.name, o.designation, o.department, o.deskNumber, o.activeFilesCount, o.pendingFilesCount]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Government Administrative &amp; SLA Compliance Reports
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Official periodic turnover reports, aging breakdowns, and statutory compliance data for executive submission.
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 select-none">
        <button
          onClick={() => setSelectedReport('DISPOSAL_REPORT')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'DISPOSAL_REPORT'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>File Disposal &amp; Output Report</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Department disposal volumes
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('SLA_COMPLIANCE')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'SLA_COMPLIANCE'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Department SLA Matrix</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Monthly compliance trends
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('PENDING_AGING')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'PENDING_AGING'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Pending File Aging Report</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Stage queue dwell times
          </span>
        </button>

        <button
          onClick={() => setSelectedReport('OFFICER_WORKLOAD')}
          className={`p-3 border rounded-[3px] text-xs font-serif font-bold transition-all text-left cursor-pointer ${
            selectedReport === 'OFFICER_WORKLOAD'
              ? 'border-[#0B2A4A] bg-[#0B2A4A] text-white shadow-sm'
              : 'border-[#D9DDE3] bg-white text-[#202124] hover:bg-[#F8F9FA]'
          }`}
        >
          <span>Officer Workload Distribution</span>
          <span className="block font-sans font-normal text-[10px] opacity-80 mt-0.5">
            Desk file distribution
          </span>
        </button>
      </div>

      {/* Report View Panel */}
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
                <option value="ALL">All Departments (State Total)</option>
                {MOCK_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[#5F6368] font-semibold mr-1.5">Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#CBD2DE] rounded-[2px] text-xs text-[#202124]"
              >
                <option value="2026-Q3">Quarter 3 (Jul - Sep 2026)</option>
                <option value="2026-Q2">Quarter 2 (Apr - Jun 2026)</option>
                <option value="2026-FY">Full Financial Year 2026-27</option>
              </select>
            </div>
          </div>

          <div className="font-mono text-[#5F6368]">
            Generated on: <strong>18 Aug 2026 14:32 IST</strong>
          </div>
        </div>

        {/* Report 1: Disposal Report Table */}
        {selectedReport === 'DISPOSAL_REPORT' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Department</th>
                    <th className="p-2.5 font-semibold text-center">Active Registry</th>
                    <th className="p-2.5 font-semibold text-center">Pending Queue</th>
                    <th className="p-2.5 font-semibold text-center">Avg Disposal Days</th>
                    <th className="p-2.5 font-semibold text-right">SLA Adherence %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {MOCK_DEPARTMENTS.map((d, idx) => (
                    <tr key={d.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-bold text-[#0B2A4A]">{d.name}</td>
                      <td className="p-2.5 text-center font-mono">{d.activeFilesCount.toLocaleString()}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-[#D97706]">
                        {d.pendingFilesCount}
                      </td>
                      <td className="p-2.5 text-center font-mono">{d.avgDisposalDays} Days</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#15803D]">
                        {d.slaCompliancePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report 2: SLA Compliance Trend Table & Bar Visualizer */}
        {selectedReport === 'SLA_COMPLIANCE' && (
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#0B2A4A]">
                Monthly SLA Compliance Progression
              </h4>
              <div className="space-y-2">
                {MOCK_PERFORMANCE_METRICS.slaAdherenceTrends.map((trend) => (
                  <div key={trend.month} className="p-3 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>{trend.month}</span>
                      <span className="font-mono text-[#15803D] font-bold">{trend.onTimePct}% On-Time</span>
                    </div>
                    {/* Visual Segment Bar */}
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-[#15803D] h-full" style={{ width: `${trend.onTimePct}%` }} title={`On Time: ${trend.onTimePct}%`} />
                      <div className="bg-[#D97706] h-full" style={{ width: `${trend.atRiskPct}%` }} title={`At Risk: ${trend.atRiskPct}%`} />
                      <div className="bg-[#B72025] h-full" style={{ width: `${trend.breachedPct}%` }} title={`Breached: ${trend.breachedPct}%`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#5F6368] font-mono">
                      <span>On-Time: {trend.onTimePct}%</span>
                      <span>At-Risk: {trend.atRiskPct}%</span>
                      <span>Breached: {trend.breachedPct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report 3: Pending Aging Analysis Table */}
        {selectedReport === 'PENDING_AGING' && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Stage Name</th>
                    <th className="p-2.5 font-semibold text-center">Active Dwell (Days)</th>
                    <th className="p-2.5 font-semibold text-center">Queue Wait (Days)</th>
                    <th className="p-2.5 font-semibold text-center">Total Cycle Time</th>
                    <th className="p-2.5 font-semibold text-center">Pending Files Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {MOCK_PERFORMANCE_METRICS.stageBreakdown.map((s, idx) => (
                    <tr key={s.stage} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-bold text-[#0B2A4A]">{s.stage}</td>
                      <td className="p-2.5 text-center font-mono">{s.activeProcessingDays}d</td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#B72025]">{s.waitingDays}d</td>
                      <td className="p-2.5 text-center font-mono">{s.totalDays}d</td>
                      <td className="p-2.5 text-center font-mono font-semibold">{s.queueCount} files</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report 4: Officer Workload Distribution */}
        {selectedReport === 'OFFICER_WORKLOAD' && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2A4A] text-white border-b border-[#071A2E]">
                    <th className="p-2.5 font-semibold">Officer Name &amp; Designation</th>
                    <th className="p-2.5 font-semibold">Department</th>
                    <th className="p-2.5 font-semibold">Assigned Desk</th>
                    <th className="p-2.5 font-semibold text-center">Active File Count</th>
                    <th className="p-2.5 font-semibold text-center">Pending Queue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DDE3]">
                  {MOCK_OFFICERS.map((o, idx) => (
                    <tr key={o.id} className={idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}>
                      <td className="p-2.5 font-bold text-[#0B2A4A]">
                        {o.name} <span className="font-normal text-[#5F6368]">({o.designation})</span>
                      </td>
                      <td className="p-2.5 text-[#202124]">{o.department}</td>
                      <td className="p-2.5 font-mono text-[#5F6368]">{o.deskNumber}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-[#0B2A4A]">{o.activeFilesCount}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-[#D97706]">{o.pendingFilesCount}</td>
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
