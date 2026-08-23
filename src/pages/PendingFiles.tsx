import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { casesService, departmentService } from '../services/api';
import { Case, DepartmentInfo } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';
import { selectBaseClasses } from '../components/common/FormField';
import { FileForwardModal } from '../components/files/FileForwardModal';

export const PendingFiles: React.FC = () => {
  const [pendingCases, setPendingCases] = useState<Case[]>([]);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [ageBucket, setAgeBucket] = useState<'ALL' | '<3' | '3-7' | '7-15' | '>15'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedCaseForForward, setSelectedCaseForForward] = useState<Case | null>(null);
  const navigate = useNavigate();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await casesService.getCases({
        department: departmentFilter,
        priority: priorityFilter,
      });

      // Filter for active pending files
      let list = res.cases.filter((c) => c.status !== 'APPROVED' && c.status !== 'DISPOSED');

      if (ageBucket === '<3') list = list.filter((c) => c.ageDays < 3);
      else if (ageBucket === '3-7') list = list.filter((c) => c.ageDays >= 3 && c.ageDays <= 7);
      else if (ageBucket === '7-15') list = list.filter((c) => c.ageDays > 7 && c.ageDays <= 15);
      else if (ageBucket === '>15') list = list.filter((c) => c.ageDays > 15);

      setPendingCases(list);
    } catch (err) {
      console.error('Failed to fetch pending files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentService.getDepartments().then((depts) => {
      if (depts && depts.length > 0) setDepartments(depts);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchPending();
  }, [departmentFilter, ageBucket, priorityFilter]);

  const overdueCases = pendingCases.filter((c) => c.daysRemaining < 0 || c.status === 'OVERDUE');

  const columns: TableColumn<Case>[] = [
    {
      key: 'fileNumber',
      header: 'Project Code',
      width: '160px',
      sortable: true,
      render: (item) => (
        <Link
          to={`/projects/${item.id}`}
          className="font-mono font-bold text-xs text-[#0B3558] hover:underline"
        >
          {item.projectCode || item.fileNumber || item.id}
        </Link>
      ),
    },
    {
      key: 'subject',
      header: 'Project Title & Location',
      render: (item) => (
        <div className="space-y-0.5 max-w-sm">
          <Link
            to={`/projects/${item.id}`}
            className="font-semibold text-xs text-[#202124] hover:text-[#0B3558] line-clamp-1"
          >
            {item.title || item.subject}
          </Link>
          <div className="text-[11px] text-[#5F6368]">{item.district || 'Pune'} • {item.state || 'Maharashtra'}</div>
        </div>
      ),
    },
    {
      key: 'currentStage',
      header: 'Acquisition Stage',
      width: '180px',
      sortable: true,
      render: (item) => (
        <span className="px-2 py-0.5 bg-gray-100 text-[#0B3558] font-sans text-xs font-semibold rounded-[2px] border border-gray-300">
          {item.currentStage}
        </span>
      ),
    },
    {
      key: 'assignedOfficer',
      header: 'Desk / SLAO Officer',
      width: '180px',
      render: (item) => (
        <div>
          <div className="font-medium text-xs text-[#202124]">{item.assignedOfficer || 'Special Land Acquisition Office'}</div>
          <div className="text-[11px] font-mono text-gray-500">{item.department}</div>
        </div>
      ),
    },
    {
      key: 'delayProbability',
      header: 'ML Delay Risk',
      width: '140px',
      align: 'center',
      render: (item) => {
        const prob = item.delayProbability ?? (item.riskScore / 100);
        const probPct = Math.round(prob * 100);
        return (
          <span className={`px-2 py-0.5 rounded-[2px] font-bold text-xs ${
            probPct >= 80 ? 'bg-red-100 text-red-800 border border-red-300' :
            probPct >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
            'bg-green-100 text-green-800 border border-green-300'
          }`}>
            {probPct}% P(Delay)
          </span>
        );
      },
    },
    {
      key: 'daysRemaining',
      header: 'Statutory SLA Status',
      width: '160px',
      align: 'center',
      sortable: true,
      render: (item) => {
        const isOverdue = item.daysRemaining < 0 || (item.predictedDelayDays && item.predictedDelayDays > 0);
        return (
          <div className="text-center font-mono">
            {isOverdue ? (
              <span className="px-2 py-0.5 bg-white text-[#B72025] border border-[#B72025] rounded-[2px] font-bold text-xs">
                +{item.predictedDelayDays || Math.abs(item.daysRemaining)}d Delay Est.
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-white text-[#15803D] border border-[#15803D] rounded-[2px] font-semibold text-xs">
                {item.daysRemaining}d On Track
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center space-x-1 justify-end">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/projects/${item.id}`)}
          >
            Dossier
          </GovButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
              Tender Exceptions &amp; Verification Escalation Register
            </h1>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold uppercase rounded-[2px] border border-red-300">
              Escalation Register
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Monitor tender bidder assessments with discrepancies, expired OEM authorizations, and pending reviews.
          </p>
        </div>
      </div>

      {/* Critical SLA Overdue Callout Section (Authentic Government Portal Style) */}
      <GovCard
        title={
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#B72025] text-white text-[10px] font-bold uppercase rounded-[2px] tracking-wide">
              EXCEPTION ESCALATION
            </span>
            <span className="font-serif font-bold text-sm text-[#0B3558]">
              Bidders Requiring Officer Intervention ({overdueCases.length})
            </span>
          </div>
        }
        subtitle="Mandatory officer review under GeM Procurement Guidelines and Technical Evaluation Rules."
        highlightBorder="red"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B3558] text-white border-b-2 border-[#040E1A]">
                <th className="p-2.5 font-semibold">Project Code</th>
                <th className="p-2.5 font-semibold">Project &amp; District</th>
                <th className="p-2.5 font-semibold">Department</th>
                <th className="p-2.5 font-semibold">Competent Authority / SLAO</th>
                <th className="p-2.5 font-semibold text-center">Registration</th>
                <th className="p-2.5 font-semibold text-center">Statutory SLA</th>
                <th className="p-2.5 font-semibold text-center">Delay Status</th>
                <th className="p-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {overdueCases.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`hover:bg-[#FFF8F8] transition-colors ${
                    idx % 2 === 1 ? 'bg-[#FCFDFD]' : 'bg-white'
                  }`}
                >
                  <td className="p-2.5 font-mono font-bold text-[#0B3558]">
                    <Link to={`/projects/${c.id}`} className="hover:underline">
                      {c.projectCode || c.fileNumber || c.id}
                    </Link>
                  </td>
                  <td className="p-2.5 font-medium text-[#202124] max-w-xs truncate">
                    {c.title || c.subject}
                  </td>
                  <td className="p-2.5 text-[#5F6368]">{c.department}</td>
                  <td className="p-2.5 font-medium text-[#202124]">{c.assignedOfficer || 'SLAO Office'}</td>
                  <td className="p-2.5 text-center font-mono">{c.createdAt}</td>
                  <td className="p-2.5 text-center font-mono">{c.statutoryDeadlineDays || 540}d</td>
                  <td className="p-2.5 text-center font-mono">
                    <span className="px-2 py-0.5 bg-white text-[#B72025] border border-[#B72025] rounded-[2px] font-bold">
                      +{c.predictedDelayDays || Math.abs(c.daysRemaining)}d Overdue
                    </span>
                  </td>
                  <td className="p-2.5 text-right whitespace-nowrap space-x-1.5">
                    <GovButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/projects/${c.id}`)}
                    >
                      Dossier
                    </GovButton>
                    <GovButton
                      variant="danger"
                      size="sm"
                      onClick={() => setSelectedCaseForForward(c)}
                    >
                      Escalate Forward
                    </GovButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GovCard>

      {/* Filter Toolbar & All Pending Table */}
      <GovCard
        title="Comprehensive Pending Ledger"
        subtitle="Filter by department, age bracket, and priority."
        noPadding
      >
        <div className="p-4 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-[#202124] mb-0.5">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={selectBaseClasses}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Bucket */}
            <div>
              <label className="block text-[11px] font-semibold text-[#202124] mb-0.5">Age Bracket</label>
              <div className="flex items-center space-x-1">
                {(['ALL', '<3', '3-7', '7-15', '>15'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setAgeBucket(b)}
                    className={`px-2 py-1 text-xs rounded-[2px] font-semibold transition-colors cursor-pointer ${
                      ageBucket === b
                        ? 'bg-[#0B2A4A] text-white'
                        : 'bg-white border border-[#CBD2DE] text-[#202124] hover:bg-gray-100'
                    }`}
                  >
                    {b === 'ALL' ? 'All Ages' : `${b} Days`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-[#5F6368]">
            Pending Queue: <strong className="text-[#0B2A4A]">{pendingCases.length} Files</strong>
          </div>
        </div>

        <GovTable
          columns={columns}
          data={pendingCases}
          keyExtractor={(item) => item.id}
          loading={loading}
          pageSize={10}
        />
      </GovCard>

      {/* Forward Modal */}
      {selectedCaseForForward && (
        <FileForwardModal
          isOpen={!!selectedCaseForForward}
          onClose={() => setSelectedCaseForForward(null)}
          caseItem={selectedCaseForForward}
          onForwarded={() => {
            setSelectedCaseForForward(null);
            fetchPending();
          }}
        />
      )}
    </div>
  );
};
