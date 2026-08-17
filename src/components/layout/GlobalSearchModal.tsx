import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, FileText, ArrowRight, X, Loader2 } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { casesService } from '../../services/api';
import { Case, DocumentRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

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
    navigate(`/cases/${caseId}`);
  };

  const handleSelectDoc = () => {
    closeSearch();
    navigate('/documents');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-ink-950/60 backdrop-blur-xs transition-opacity"
        onClick={closeSearch}
      />

      <div className="relative mx-auto max-w-2xl bg-surface border border-border-hairline shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border-hairline bg-surface">
          <Search className="w-4 h-4 text-ink-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search active cases (e.g. KA-10482), documents, or departments..."
            className="w-full bg-transparent font-mono text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-ink-500 animate-spin flex-shrink-0" />
          ) : (
            <button
              onClick={closeSearch}
              className="px-1.5 py-0.5 border border-border-hairline text-3xs font-mono text-ink-500 hover:text-ink-900"
            >
              ESC
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 bg-paper space-y-3">
          {query.trim().length <= 1 && (
            <div className="p-6 text-center">
              <p className="font-mono text-2xs text-ink-500">
                TYPE TO SEARCH CASE IDs, DEPARTMENTS, REVENUE SURVEY NUMBERS, OR DOCUMENTS
              </p>
              <div className="mt-3 flex justify-center space-x-2">
                {['KA-10482', 'MH-20941', 'Legal Review', 'Land Revenue'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="font-mono text-3xs px-2 py-1 bg-surface border border-border-hairline text-ink-700 hover:border-ink-900"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cases Results */}
          {cases.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 font-mono text-3xs font-bold text-ink-500 uppercase tracking-wider flex items-center justify-between">
                <span>CASES ({cases.length})</span>
                <span className="text-ink-400">ENTER TO SELECT</span>
              </div>
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className="p-2.5 bg-surface hover:bg-surface-hover border border-border-hairline flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FolderKanban className="w-4 h-4 text-ink-500 flex-shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-ink-950">{c.id}</span>
                        <span className="font-mono text-3xs text-ink-500 px-1 border border-border-hairline">
                          {c.department}
                        </span>
                        <StatusBadge riskLevel={c.riskLevel} size="sm" />
                      </div>
                      <p className="font-sans text-xs text-ink-700 mt-0.5 truncate max-w-md">
                        {c.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-2xs text-ink-500">
                    <span>{c.currentStage}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Documents Results */}
          {documents.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 font-mono text-3xs font-bold text-ink-500 uppercase tracking-wider">
                DOCUMENTS ({documents.length})
              </div>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={handleSelectDoc}
                  className="p-2.5 bg-surface hover:bg-surface-hover border border-border-hairline flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-ink-500 flex-shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-medium text-ink-900">{doc.title}</span>
                        <span className="font-mono text-3xs text-ink-500 px-1 border border-border-hairline">
                          {doc.documentType}
                        </span>
                      </div>
                      <p className="font-mono text-3xs text-ink-500 mt-0.5">
                        CASE: {doc.caseId} • {doc.metadata.fileSize} • OCR: {doc.ocrStatus}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-400" />
                </div>
              ))}
            </div>
          )}

          {query.trim().length > 1 && !loading && cases.length === 0 && documents.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-mono text-2xs text-ink-500">
                NO RECORDS MATCHING "{query.toUpperCase()}" FOUND IN ACTIVE REVENUE / WORKFLOW DATABASE.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-hairline bg-surface-subtle/50 flex items-center justify-between font-mono text-3xs text-ink-500">
          <span>NAVIGATION: [↑/↓] TO CYCLE • [ESC] TO DISMISS</span>
          <span>GOIP GLOBAL CASE INDEX</span>
        </div>
      </div>
    </div>
  );
};
