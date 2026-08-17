import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Download,
  PlusCircle,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { casesService } from '../services/api';
import { Case } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { StatusBadge } from '../components/common/GovBadge';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';
import { inputBaseClasses, selectBaseClasses } from '../components/common/FormField';
import { FileForwardModal } from '../components/files/FileForwardModal';
import { FileRegisterModal } from '../components/files/FileRegisterModal';
import { MOCK_DEPARTMENTS } from '../mock/data';

const STAGES: string[] = [
  'ALL',
  'Application Received',
  'Document Verification',
  'Department Assignment',
  'Officer Review',
  'Legal Review',
  'Approval',
  'Closure',
];

const STATUSES: string[] = [
  'ALL',
  'REGISTERED',
  'UNDER_SCRUTINY',
  'FORWARDED',
  'UNDER_PROCESSING',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DISPOSED',
  'OVERDUE',
];

export const Files: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || 'ALL');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [selectedCaseForForward, setSelectedCaseForForward] = useState<Case | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const navigate = useNavigate();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await casesService.getCases({
        department: departmentFilter,
        stage: stageFilter,
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery,
      });
      setCases(res.cases);
    } catch (e) {
      console.error('Failed to fetch files:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [departmentFilter, stageFilter, statusFilter, priorityFilter, searchQuery]);

  const handleResetFilters = () => {
    setDepartmentFilter('ALL');
    setStageFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setSearchQuery('');
  };

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

  const handleExportCsv = () => {
    const headers = ['File Number', 'Subject', 'Department', 'Current Officer', 'Inward Date', 'Days Pending', 'Status', 'Priority'];
    const rows = cases.map((c) => [
      c.fileNumber || c.id,
      `"${c.subject || c.title}"`,
      c.department,
      `"${c.assignedOfficer}"`,
      c.createdAt,
      c.ageDays,
      c.status,
      c.priority || 'ROUTINE',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gov_File_Register_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const columns: TableColumn<Case>[] = [
    {
      key: 'fileNumber',
      header: 'File Number',
      width: '170px',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <button
            onClick={(e) => handleToggleFlag(e, item.id)}
            title={item.flaggedForReview ? 'Flagged for High-Priority Oversight' : 'Flag File'}
            className="text-gray-400 hover:text-[#B72025] cursor-pointer"
          >
            {item.flaggedForReview ? (
              <BookmarkCheck className="w-4 h-4 text-[#B72025]" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
          <Link
            to={`/files/${item.id}`}
            className="font-bold text-[#0B2A4A] hover:underline"
          >
            {item.fileNumber || item.id}
          </Link>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject Matter / Description',
      render: (item) => (
        <div className="space-y-0.5 max-w-sm">
          <Link
            to={`/files/${item.id}`}
            className="font-semibold text-xs text-[#202124] hover:text-[#0B2A4A] line-clamp-1"
          >
            {item.subject || item.title}
          </Link>
          <div className="text-[11px] text-[#5F6368]">
            Origin: {item.applicant || item.origin || 'District Office'}
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department & Section',
      width: '180px',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-xs text-[#0B2A4A]">{item.department}</div>
          <div className="text-[11px] text-[#5F6368]">{item.section || item.currentStage}</div>
        </div>
      ),
    },
    {
      key: 'assignedOfficer',
      header: 'Current Desk / Officer',
      width: '180px',
      render: (item) => (
        <div>
          <div className="font-medium text-xs text-[#202124]">{item.assignedOfficer}</div>
          <div className="text-[11px] font-mono text-gray-500">{item.currentDesk || 'DESK-REV-01'}</div>
        </div>
      ),
    },
    {
      key: 'ageDays',
      header: 'Days Pending / SLA',
      width: '140px',
      sortable: true,
      align: 'center',
      render: (item) => (
        <div className="text-center font-mono">
          <span
            className={`font-bold ${
              item.daysRemaining < 0
                ? 'text-[#B72025]'
                : item.daysRemaining < 5
                ? 'text-[#D97706]'
                : 'text-[#202124]'
            }`}
          >
            {item.ageDays}d
          </span>
          <span className="text-[11px] text-[#5F6368] block">
            {item.daysRemaining >= 0 ? `${item.daysRemaining}d left` : `${Math.abs(item.daysRemaining)}d overdue`}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status & Priority',
      width: '140px',
      render: (item) => (
        <div className="space-y-1">
          <StatusBadge status={item.status} size="sm" />
          {item.priority && (
            <div className="block">
              <StatusBadge status={item.priority} size="sm" />
            </div>
          )}
        </div>
      ),
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
            variant="primary"
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Official File Register &amp; Movement Ledger
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Search, filter, inspect dockets, and forward government files across state departments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5 text-[#0B2A4A]" />}
          >
            Export Register CSV
          </GovButton>
          <GovButton
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Register Inward File
          </GovButton>
        </div>
      </div>

      {/* Filter Toolbar Panel */}
      <GovCard noPadding>
        <div className="p-4 bg-[#F8F9FA] border-b border-[#D9DDE3] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-[#202124] mb-1">
                Search File No / Subject / Officer
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. KA/REV/2026/001284, Survey 44/2B..."
                  className={`${inputBaseClasses} pl-9`}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={selectBaseClasses}
              >
                <option value="ALL">All Departments (8)</option>
                {MOCK_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">Workflow Stage</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className={selectBaseClasses}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">File Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectBaseClasses}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6E9EF] text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[#5F6368]">Filter by Priority:</span>
              {(['ALL', 'IMMEDIATE', 'URGENT', 'ROUTINE'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded-[2px] font-semibold text-[11px] transition-colors cursor-pointer ${
                    priorityFilter === p
                      ? 'bg-[#0B2A4A] text-white'
                      : 'bg-white border border-[#CBD2DE] text-[#202124] hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[#5F6368] font-mono">
                Records Found: <strong className="text-[#0B2A4A]">{cases.length}</strong>
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[#0B2A4A] hover:underline font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <GovTable
          columns={columns}
          data={cases}
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
            fetchFiles();
          }}
        />
      )}

      {/* Register Modal */}
      <FileRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onCreated={() => {
          setIsRegisterOpen(false);
          fetchFiles();
        }}
      />
    </div>
  );
};
