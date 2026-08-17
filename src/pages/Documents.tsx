import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Upload,
  Download,
  ScanLine,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Filter,
  PlusCircle,
} from 'lucide-react';
import { documentsService } from '../services/api';
import { DocumentRecord } from '../types';
import { GovTable, TableColumn } from '../components/common/GovTable';
import { StatusBadge } from '../components/common/GovBadge';
import { GovButton } from '../components/common/GovButton';
import { GovCard } from '../components/common/GovCard';
import { inputBaseClasses } from '../components/common/FormField';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal';

export const Documents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [ocrStatusFilter, setOcrStatusFilter] = useState('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentsService.getDocuments({
        search: searchQuery,
        ocrStatus: ocrStatusFilter,
      });
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [ocrStatusFilter, searchQuery]);

  const handleDownload = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      const { blob, fileName } = await documentsService.downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download document:', err);
    }
  };

  const columns: TableColumn<DocumentRecord>[] = [
    {
      key: 'title',
      header: 'Document Title & File Name',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5 max-w-sm">
          <button
            onClick={() => setSelectedDoc(item)}
            className="font-bold text-xs text-[#0B2A4A] hover:underline text-left cursor-pointer flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[#0B2A4A]" />
            <span>{item.title}</span>
          </button>
          <div className="text-[11px] font-mono text-[#5F6368]">
            {item.fileName} • {item.metadata.fileSize}
          </div>
        </div>
      ),
    },
    {
      key: 'caseId',
      header: 'Associated File Ref',
      width: '180px',
      sortable: true,
      render: (item) => (
        <Link
          to={`/files/${item.caseId}`}
          className="font-mono font-bold text-xs text-[#0B2A4A] hover:underline flex items-center space-x-1"
        >
          <span>{item.caseId}</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </Link>
      ),
    },
    {
      key: 'documentType',
      header: 'Classification',
      width: '160px',
      sortable: true,
      render: (item) => (
        <span className="px-2 py-0.5 bg-[#F0F5FA] border border-[#CBD2DE] text-[#0B2A4A] rounded-[2px] text-[11px] font-medium">
          {item.documentType}
        </span>
      ),
    },
    {
      key: 'ocrStatus',
      header: 'OCR Text Status',
      width: '130px',
      align: 'center',
      render: (item) => <StatusBadge status={item.ocrStatus} size="sm" />,
    },
    {
      key: 'uploadDate',
      header: 'Uploaded Date & Officer',
      width: '200px',
      render: (item) => (
        <div>
          <div className="text-xs text-[#202124]">{item.uploadDate}</div>
          <div className="text-[11px] text-[#5F6368]">{item.uploadedBy}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '160px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDoc(item)}
          >
            View / OCR
          </GovButton>
          <GovButton
            variant="secondary"
            size="sm"
            onClick={(e) => handleDownload(e, item.id)}
            title="Download Document"
          >
            <Download className="w-3.5 h-3.5 text-[#0B2A4A]" />
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
            Central Government Document Repository
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Indexed government records, gazette orders, survey sketches, and optical text data.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="primary"
            size="sm"
            onClick={() => navigate('/documents/upload')}
            icon={<ScanLine className="w-3.5 h-3.5" />}
          >
            Upload &amp; Scan Document
          </GovButton>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <GovCard noPadding>
        <div className="p-4 bg-[#F8F9FA] border-b border-[#D9DDE3] flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document title, OCR text, or file reference..."
              className={`${inputBaseClasses} pl-9`}
            />
          </div>

          {/* OCR Filter Buttons */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#5F6368] font-semibold">OCR Status:</span>
            {(['ALL', 'COMPLETED', 'PROCESSING', 'PENDING'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setOcrStatusFilter(status)}
                className={`px-2.5 py-1 rounded-[2px] font-semibold text-[11px] transition-colors cursor-pointer ${
                  ocrStatusFilter === status
                    ? 'bg-[#0B2A4A] text-white'
                    : 'bg-white border border-[#CBD2DE] text-[#202124] hover:bg-gray-100'
                }`}
              >
                {status === 'ALL' ? 'All Records' : status}
              </button>
            ))}
          </div>
        </div>

        <GovTable
          columns={columns}
          data={documents}
          keyExtractor={(item) => item.id}
          loading={loading}
          pageSize={10}
        />
      </GovCard>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
};
