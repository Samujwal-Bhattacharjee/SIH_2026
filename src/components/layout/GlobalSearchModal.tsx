import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, FileText, ArrowRight, X, Loader2 } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { casesService } from '../../services/api';
import { Case, DocumentRecord } from '../../types';
import { StatusBadge } from '../common/GovBadge';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch } = useSystem();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setCases([]);
      setDocuments([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const res = await casesService.search(query.trim());
          setCases(res.cases);
          setDocuments(res.documents);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setCases([]);
        setDocuments([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const handleSelectCase = (caseId: string) => {
    closeSearch();
    navigate(`/files/${caseId}`);
  };

  const handleSelectDoc = () => {
    closeSearch();
    navigate('/documents');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={closeSearch}
      />

      <div className="relative mx-auto max-w-2xl w-full bg-white border-2 border-[#0B2A4A] rounded-[4px] shadow-2xl overflow-hidden animate-in fade-in">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#D9DDE3] bg-[#F8F9FA]">
          <Search className="w-4 h-4 text-[#0B2A4A] mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search active tenders (e.g. GEM/2026/B/418207), bidders, or documents..."
            className="w-full bg-transparent text-xs text-[#202124] placeholder:text-gray-400 focus:outline-none font-sans"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#0B2A4A] animate-spin flex-shrink-0" />
          ) : (
            <button
              onClick={closeSearch}
              className="px-1.5 py-0.5 border border-[#D9DDE3] text-[10px] font-mono text-gray-500 hover:text-[#202124] rounded-[2px]"
            >
              ESC
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 bg-[#F5F6F8] space-y-3">
          {query.trim().length <= 1 && (
            <div className="p-6 text-center text-xs text-[#5F6368] space-y-2">
              <p>Type to search tender IDs, bidder legal names, certificates, or OCR text</p>
              <div className="flex justify-center space-x-2 text-[11px]">
                <span className="px-2 py-0.5 bg-white border border-[#D9DDE3] rounded-[2px]">GEM/2026/B/418207</span>
                <span className="px-2 py-0.5 bg-white border border-[#D9DDE3] rounded-[2px]">Triveni Infotech</span>
                <span className="px-2 py-0.5 bg-white border border-[#D9DDE3] rounded-[2px]">GST Certificate</span>
              </div>
            </div>
          )}

          {/* Matched File Records */}
          {cases.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider">
                Matching File Dockets ({cases.length})
              </div>
              <div className="space-y-1">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className="p-2.5 bg-white border border-[#D9DDE3] hover:border-[#0B2A4A] rounded-[3px] cursor-pointer transition-colors flex items-center justify-between text-xs group"
                  >
                    <div className="space-y-0.5 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <FolderKanban className="w-3.5 h-3.5 text-[#0B2A4A]" />
                        <span className="font-bold text-[#0B2A4A]">{c.fileNumber || c.id}</span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <p className="text-xs text-[#202124] line-clamp-1 group-hover:text-[#0B2A4A] font-medium">
                        {c.subject || c.title}
                      </p>
                      <div className="text-[11px] text-[#5F6368]">
                        {c.department} • Officer: {c.assignedOfficer}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B2A4A]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Document Records */}
          {documents.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider">
                Matching Documents ({documents.length})
              </div>
              <div className="space-y-1">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    onClick={handleSelectDoc}
                    className="p-2.5 bg-white border border-[#D9DDE3] hover:border-[#0B2A4A] rounded-[3px] cursor-pointer transition-colors flex items-center justify-between text-xs group"
                  >
                    <div className="space-y-0.5 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-[#0B2A4A]" />
                        <span className="font-bold text-[#202124]">{d.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#F0F5FA] border border-[#CBD2DE] text-[#0B2A4A] rounded-[2px]">
                          {d.documentType}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6368]">
                        File Ref: {d.caseId} • {d.fileName} ({d.metadata.fileSize})
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0B2A4A]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim().length > 1 && !loading && cases.length === 0 && documents.length === 0 && (
            <div className="p-6 text-center text-xs text-[#5F6368]">
              No files or documents match the query &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-[#F8F9FA] border-t border-[#D9DDE3] flex items-center justify-between text-[11px] text-[#5F6368]">
          <span>Use <strong>Enter</strong> to open, <strong>ESC</strong> to dismiss</span>
          <button
            onClick={() => {
              closeSearch();
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="text-[#0B2A4A] hover:underline font-semibold"
          >
            Open in Advanced Search Engine →
          </button>
        </div>
      </div>
    </div>
  );
};
