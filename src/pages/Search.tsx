import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  FolderKanban,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { casesService } from '../services/api';
import { Case, DocumentRecord } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { inputBaseClasses, inputErrorClasses, selectBaseClasses } from '../components/common/FormField';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal';
import { MOCK_DEPARTMENTS } from '../mock/data';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchType, setSearchType] = useState<'ALL' | 'FILES' | 'DOCUMENTS'>('ALL');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!query.trim() || query.trim().length < 3) {
      setValidationError('Please enter atleast 3 alphabetic characters to perform a search');
      return;
    }

    setValidationError(null);
    setLoading(true);
    setSearched(true);
    try {
      const res = await casesService.search(query.trim());
      let filteredCases = res.cases;
      if (departmentFilter !== 'ALL') {
        filteredCases = filteredCases.filter((c) => c.department === departmentFilter);
      }
      setCases(filteredCases);
      setDocuments(res.documents);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      if (q.trim().length >= 3) {
        handleSearch();
      }
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D9DDE3] pb-3">
        <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
          Government File &amp; Document Retrieval System
        </h1>
        <p className="text-xs text-[#5F6368] mt-0.5">
          Execute multi-criteria searches across active file dockets, optical text (OCR) archives, and citizen petitions.
        </p>
      </div>

      {/* Main Search Panel */}
      <GovCard highlightBorder="navy">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (validationError && e.target.value.trim().length >= 3) {
                    setValidationError(null);
                  }
                }}
                placeholder="Enter File Number (e.g. KA/REV/2026/001284), Survey No, Title Deed Ref, or Keywords..."
                className={`${
                  validationError ? inputErrorClasses : inputBaseClasses
                } pl-9 py-2 text-sm font-sans`}
              />
            </div>
            <GovButton
              variant="danger"
              size="md"
              loading={loading}
              type="submit"
              icon={<SearchIcon className="w-4 h-4" />}
            >
              Search
            </GovButton>
          </div>

          {/* Authentic Government Red Error Message (Reference Style) */}
          {validationError && (
            <p className="text-xs text-[#C62828] font-normal leading-tight">
              {validationError}
            </p>
          )}

          {/* Advanced Filter Criteria Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E6E9EF] text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#202124] mb-1">Target Department</label>
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

            <div>
              <label className="block text-[11px] font-semibold text-[#202124] mb-1">Index Scope</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className={selectBaseClasses}
              >
                <option value="ALL">All Records (Files &amp; Documents)</option>
                <option value="FILES">Only File Dockets</option>
                <option value="DOCUMENTS">Only OCR Document Scans</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-[11px] text-[#5F6368] space-y-0.5">
                <span>Supports: Exact File Numbers, Survey IDs, OCR text substrings</span>
              </div>
            </div>
          </div>
        </form>
      </GovCard>

      {/* Search Results Summary */}
      {searched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#5F6368] font-mono border-b border-[#D9DDE3] pb-2">
            <span>
              SEARCH QUERY: <strong className="text-[#0B2A4A]">&ldquo;{query}&rdquo;</strong>
            </span>
            <span>
              TOTAL MATCHES: <strong>{cases.length + documents.length}</strong> ({cases.length} Files, {documents.length} Documents)
            </span>
          </div>

          {/* Matched Files Section */}
          {(searchType === 'ALL' || searchType === 'FILES') && cases.length > 0 && (
            <GovCard
              title={`Matching File Dockets (${cases.length})`}
              subtitle="Files matching search criteria"
              noPadding
            >
              <div className="divide-y divide-[#D9DDE3]">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 hover:bg-[#F8F9FA] transition-colors space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <FolderKanban className="w-4 h-4 text-[#0B2A4A]" />
                        <Link
                          to={`/files/${c.id}`}
                          className="font-mono font-bold text-sm text-[#0B2A4A] hover:underline"
                        >
                          {c.fileNumber || c.id}
                        </Link>
                        <StatusBadge status={c.status} size="sm" />
                        {c.priority && <StatusBadge status={c.priority} size="sm" />}
                      </div>

                      <span className="font-mono text-[#5F6368] text-[11px]">
                        Registered: {c.createdAt}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-[#202124]">
                      {c.subject || c.title}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#5F6368] pt-1">
                      <div>
                        Department: <strong className="text-[#202124]">{c.department}</strong>
                      </div>
                      <div>
                        Officer: <strong className="text-[#202124]">{c.assignedOfficer}</strong>
                      </div>
                      <div>
                        Stage: <strong className="text-[#202124]">{c.currentStage}</strong>
                      </div>
                      <div className="text-right">
                        <Link
                          to={`/files/${c.id}`}
                          className="text-[#0B2A4A] font-bold hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Open Docket</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GovCard>
          )}

          {/* Matched Documents & OCR Text Section */}
          {(searchType === 'ALL' || searchType === 'DOCUMENTS') && documents.length > 0 && (
            <GovCard
              title={`Matching Document Scans & OCR Text Records (${documents.length})`}
              subtitle="Full-text and metadata matches"
              noPadding
            >
              <div className="divide-y divide-[#D9DDE3]">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 hover:bg-[#F8F9FA] transition-colors space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#0B2A4A]" />
                        <h4 className="font-bold text-sm text-[#202124]">{d.title}</h4>
                        <span className="px-1.5 py-0.5 text-[10px] bg-[#F0F5FA] border border-[#CBD2DE] text-[#0B2A4A] rounded-[2px]">
                          {d.documentType}
                        </span>
                      </div>

                      <GovButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedDoc(d)}
                      >
                        Inspect OCR Text
                      </GovButton>
                    </div>

                    <div className="text-[11px] text-[#5F6368]">
                      File Ref: <strong className="text-[#0B2A4A]">{d.caseId}</strong> • Uploaded on {d.uploadDate} by {d.uploadedBy}
                    </div>

                    {/* OCR Text Snippet Highlight */}
                    {d.ocrResult?.extractedText && (
                      <div className="p-2.5 bg-[#FAF8F2] border-l-2 border-[#0B2A4A] text-xs font-mono text-[#202124] leading-relaxed line-clamp-2">
                        {d.ocrResult.extractedText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GovCard>
          )}

          {cases.length === 0 && documents.length === 0 && (
            <div className="p-8 text-center text-xs text-[#5F6368] bg-white border border-[#D9DDE3] rounded-[4px]">
              No files or document records matched your query &ldquo;{query}&rdquo;. Try using a different keyword or file number.
            </div>
          )}
        </div>
      )}

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
