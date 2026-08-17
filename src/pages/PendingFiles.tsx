import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { casesService } from '../services/api';
import { Case } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';
import { selectBaseClasses } from '../components/common/FormField';
import { FileForwardModal } from '../components/files/FileForwardModal';
import { MOCK_DEPARTMENTS } from '../mock/data';

export const PendingFiles: React.FC = () => {
  const [pendingCases, setPendingCases] = useState<Case[]>([]);
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
    fetchPending();
  }, [departmentFilter, ageBucket, priorityFilter]);

  const overdueCases = pendingCases.filter((c) => c.daysRemaining < 0 || c.status === 'OVERDUE');

  const columns: TableColumn<Case>[] = [
    {
      key: 'fileNumber',
      header: 'File Number',
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
      header: 'Subject / Matter',
      render: (item) => (
        <div className="space-y-0.5 max-w-sm">
          <Link
            to={`/files/${item.id}`}
            className="font-semibold text-xs text-[#202124] hover:text-[#0B2A4A] line-clamp-1"
          >
            {item.subject || item.title}
          </Link>
          <div className="text-[11px] text-[#5F6368]">{item.applicant}</div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '160px',
      sortable: true,
      render: (item) => <span className="font-semibold text-xs text-[#0B2A4A]">{item.department}</span>,
    },
    {
      key: 'assignedOfficer',
      header: 'Current Desk / Officer',
      width: '180px',
      render: (item) => (
        <div>
          <div className="font-medium text-xs text-[#202124]">{item.assignedOfficer}</div>
          <div className="text-[11px] font-mono text-gray-500">{item.currentDesk}</div>
        </div>
      ),
    },
    {
      key: 'ageDays',
      header: 'Age / Days Pending',
      width: '140px',
      align: 'center',
      sortable: true,
      render: (item) => (
        <div className="text-center font-mono">
          <span className="font-bold text-xs text-[#202124]">{item.ageDays} Days</span>
          <span className="text-[11px] text-[#5F6368] block">SLA Limit: {item.statutoryDeadlineDays}d</span>
        </div>
      ),
    },
    {
      key: 'daysRemaining',
      header: 'SLA Overdue Status',
      width: '160px',
      align: 'center',
      sortable: true,
      render: (item) => {
        const isOverdue = item.daysRemaining < 0;
        return (
          <div className="text-center font-mono">
            {isOverdue ? (
              <span className="px-2 py-0.5 bg-white text-[#C62828] border border-[#C62828] rounded-[2px] font-bold text-xs">
                {Math.abs(item.daysRemaining)}d OVERDUE
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-white text-[#15803D] border border-[#15803D] rounded-[2px] font-semibold text-xs">
                {item.daysRemaining}d Remaining
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      width: '150px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/files/${item.id}`)}
          >
            View
          </GovButton>
          <GovButton
            variant="danger"
            size="sm"
            onClick={() => setSelectedCaseForForward(item)}
          >
            Forward
          </GovButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Pending Government Files Inventory
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Monitor files awaiting administrative review, legal opinions, or executive approvals across state departments.
          </p>
        </div>
      </div>

      {/* Critical SLA Overdue Callout Section (Authentic Government Portal Style) */}
      <GovCard
        title={
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#C62828] text-white text-[10px] font-bold uppercase rounded-[2px] tracking-wide">
              STATUTORY SLA BREACH
            </span>
            <span className="font-serif font-bold text-base text-[#0B2A4A]">
              Pending Files Exceeding Statutory SLA ({overdueCases.length})
            </span>
          </div>
        }
        subtitle="Mandatory escalation under the Administrative Reforms & Citizen Charter Guidelines."
        highlightBorder="red"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B2A4A] text-white border-b-2 border-[#071A2E]">
                <th className="p-2.5 font-semibold">File Number</th>
                <th className="p-2.5 font-semibold">Subject Matter</th>
                <th className="p-2.5 font-semibold">Department</th>
                <th className="p-2.5 font-semibold">Current Custodian Officer</th>
                <th className="p-2.5 font-semibold text-center">Pending Since</th>
                <th className="p-2.5 font-semibold text-center">Statutory SLA</th>
                <th className="p-2.5 font-semibold text-center">Days Overdue</th>
                <th className="p-2.5 font-semibold text-right">Escalation Action</th>
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
                  <td className="p-2.5 font-mono font-bold text-[#0B2A4A]">
                    <Link to={`/files/${c.id}`} className="hover:underline">
                      {c.fileNumber || c.id}
                    </Link>
                  </td>
                  <td className="p-2.5 font-medium text-[#202124] max-w-xs truncate">
                    {c.subject || c.title}
                  </td>
                  <td className="p-2.5 text-[#5F6368]">{c.department}</td>
                  <td className="p-2.5 font-medium text-[#202124]">{c.assignedOfficer}</td>
                  <td className="p-2.5 text-center font-mono">{c.createdAt}</td>
                  <td className="p-2.5 text-center font-mono">{c.statutoryDeadlineDays}d</td>
                  <td className="p-2.5 text-center font-mono">
                    <span className="px-2 py-0.5 bg-white text-[#C62828] border border-[#C62828] rounded-[2px] font-bold">
                      +{Math.abs(c.daysRemaining)} Days Overdue
                    </span>
                  </td>
                  <td className="p-2.5 text-right whitespace-nowrap space-x-1.5">
                    <GovButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/files/${c.id}`)}
                    >
                      Inspect Docket
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
                {MOCK_DEPARTMENTS.map((d) => (
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
