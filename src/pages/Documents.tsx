import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Download,
  CheckCircle2,
  ExternalLink,
  Filter,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import { documentsService } from '../services/api';
import { DocumentRecord, DocumentType } from '../types';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

const DOC_TYPES = [
  'ALL',
  'Application Form',
  'Legal Opinion',
  'Identity Proof',
  'Site Inspection Report',
  'Clearance Certificate',
  'Court Order',
  'Affidavit',
];

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await documentsService.getDocuments({
        search: searchQuery,
      });
      setDocuments(data);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [searchQuery]);

  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'ALL' && doc.documentType !== typeFilter) return false;
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
            <span>DOCUMENT REPOSITORY</span>
            <span>/</span>
            <span>AUTOMATED OCR INGESTION</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl text-ink-950 tracking-tight mt-1">
            GOVERNMENT CASE RECORD &amp; OCR ENGINE
          </h1>
        </div>

        <div className="flex items-center space-x-3 font-mono text-2xs">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white uppercase tracking-wider font-bold flex items-center space-x-2 shadow-subtle-2 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-vermilion" />
            <span>INGEST OFFICIAL DOCUMENT</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border-hairline p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-2xs shadow-subtle-1">
        <div className="flex items-center space-x-2">
          <span className="text-ink-500 text-3xs uppercase">FILTER CLASSIFICATION:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 bg-surface-subtle border border-border-hairline text-ink-950 focus:outline-none"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document title, Case ID, or filename..."
            className="pl-8 pr-3 py-1 bg-surface-subtle border border-border-hairline text-xs font-mono text-ink-950 focus:outline-none w-72"
          />
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="NO DOCUMENTS FOUND"
          description="No official records matched your search query or document type filter."
          actionText="INGEST NEW RECORD"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="bg-surface border border-border-hairline shadow-subtle-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-hairline bg-surface-subtle/70 font-mono text-3xs text-ink-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">DOCUMENT TITLE</th>
                  <th className="py-2.5 px-4">CLASSIFICATION</th>
                  <th className="py-2.5 px-4">ASSOCIATED CASE</th>
                  <th className="py-2.5 px-4">FILE SIZE</th>
                  <th className="py-2.5 px-4">OCR STATUS</th>
                  <th className="py-2.5 px-4">INGESTION DATE</th>
                  <th className="py-2.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline font-sans text-xs">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-start space-x-2.5">
                        <FileText className="w-4 h-4 text-ink-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-ink-950 truncate">
                            {doc.title}
                          </div>
                          <div className="font-mono text-3xs text-ink-500 mt-0.5 truncate">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-2xs px-2 py-0.5 bg-surface-subtle border border-border-hairline text-ink-800">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink-950 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${doc.caseId}`);
                        }}
                        className="text-vermilion hover:underline flex items-center space-x-1"
                      >
                        <span>{doc.caseId}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-ink-600">
                      {doc.metadata.fileSize}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-mono text-2xs text-sageSuccess">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-bold">OCR {( (doc.ocrResult?.confidenceScore || 0.95) * 100 ).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-ink-500">
                      {new Date(doc.uploadDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-2.5 py-1 bg-ink-900 hover:bg-ink-800 text-white font-mono text-3xs uppercase tracking-wider inline-flex items-center space-x-1"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>INSPECT OCR</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <DocumentViewerModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newDoc) => {
          setDocuments((prev) => [newDoc, ...prev]);
          setSelectedDoc(newDoc);
        }}
      />
    </div>
  );
};
