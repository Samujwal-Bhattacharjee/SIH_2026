import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Download,
  RefreshCw,
} from 'lucide-react';
import { auditService } from '../services/api';
import { AuditLog } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';
import { GovPageHeader } from '../components/common/GovPageHeader';
import { inputBaseClasses } from '../components/common/FormField';

export const AuditLogs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs({ search: searchQuery });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [searchQuery]);

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Officer ID', 'Officer Name', 'Action', 'File Number', 'Previous State', 'New State', 'IP Address', 'Terminal ID', 'Remarks'];
    const rows = logs.map((l) => [
      l.timestamp,
      l.officerId,
      `"${l.officerName}"`,
      l.action,
      l.fileNumber || l.fileId,
      `"${l.previousState || ''}"`,
      `"${l.newState || ''}"`,
      l.ipAddress,
      l.terminalId,
      `"${l.remarks || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gov_Audit_Register_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (IST)',
      width: '180px',
      sortable: true,
      render: (item) => (
        <div className="font-mono text-xs text-[#202124]">
          {item.timestamp}
        </div>
      ),
    },
    {
      key: 'officerName',
      header: 'Officer & Employee ID',
      width: '200px',
      render: (item) => (
        <div>
          <div className="font-bold text-xs text-[#0B2A4A]">{item.officerName}</div>
          <div className="text-[11px] font-mono text-[#5F6368]">{item.officerId}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Official Action',
      width: '150px',
      render: (item) => {
        const actionColors: Record<string, string> = {
          FILE_REGISTERED: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
          FILE_FORWARDED: 'bg-[#F0F5FA] text-[#0B2A4A] border-[#CBD2DE]',
          DOCUMENT_UPLOADED: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
          OCR_PROCESSED: 'bg-[#FAF8F2] text-[#B45309] border-[#D9D4C7]',
          FILE_APPROVED: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
          FLAGGED_REVIEW: 'bg-[#FEF2F2] text-[#B72025] border-[#FCA5A5]',
        };
        const color = actionColors[item.action] || 'bg-gray-100 text-gray-700 border-gray-300';
        return (
          <span className={`px-2 py-0.5 rounded-[2px] font-sans font-bold text-[10px] uppercase border ${color}`}>
            {item.action.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'fileNumber',
      header: 'Project / Docket Ref',
      width: '180px',
      render: (item) => (
        <Link
          to={`/projects/${item.fileId}`}
          className="font-mono font-bold text-xs text-[#0B3558] hover:underline"
        >
          {item.fileNumber || item.fileId}
        </Link>
      ),
    },
    {
      key: 'transition',
      header: 'Stage Transition & Remarks',
      render: (item) => (
        <div className="space-y-1 text-xs text-[#202124] max-w-md">
          {item.previousState && item.newState && (
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#5F6368]">
              <span>{item.previousState}</span>
              <span>→</span>
              <strong className="text-[#0B3558]">{item.newState}</strong>
            </div>
          )}
          {item.remarks && (
            <p className="text-[#5F6368] text-xs leading-relaxed">{item.remarks}</p>
          )}
        </div>
      ),
    },
    {
      key: 'terminalId',
      header: 'Terminal & IP Address',
      width: '160px',
      render: (item) => (
        <div className="font-mono text-xs text-[#5F6368] space-y-0.5">
          <div className="text-[#202124] font-semibold">{item.terminalId}</div>
          <div className="text-[11px] text-gray-400">{item.ipAddress}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header (Glossy Frosted Banner) */}
      <GovPageHeader
        title="Procurement Activity & Audit Trail Register"
        tag="TAMPER-EVIDENT LEGAL LEDGER"
        subtitle="Tamper-evident legal ledger recording all tender evaluations, document OCR extractions, and officer decisions."
        actions={
          <div className="flex items-center space-x-2">
            <GovButton
              variant="secondary"
              size="sm"
              onClick={fetchAuditLogs}
              icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B2A4A]" />}
            >
              Refresh Logs
            </GovButton>
            <GovButton
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export Audit CSV
            </GovButton>
          </div>
        }
      />

      {/* Filter and Audit Table */}
      <GovCard noPadding highlightBorder="navy">
        <div className="p-4 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit log by officer, action, or file number..."
              className={`${inputBaseClasses} pl-9 text-xs`}
            />
          </div>

          <div className="text-xs font-mono text-[#5F6368]">
            Audit Entries Recorded: <strong className="text-[#0B2A4A]">{logs.length}</strong>
          </div>
        </div>

        <GovTable
          columns={columns}
          data={logs}
          keyExtractor={(item) => item.id}
          loading={loading}
          pageSize={10}
        />
      </GovCard>
    </div>
  );
};
