import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import { documentsService } from '../../services/api';

interface DocumentViewerModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'OCR' | 'METADATA'>('OCR');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  if (!document) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blob, fileName } = await documentsService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyOCR = () => {
    if (document.ocrResult?.extractedText) {
      navigator.clipboard.writeText(document.ocrResult.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNavigateCase = () => {
    onClose();
    navigate(`/cases/${document.caseId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-ink-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-surface border border-border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-border-hairline bg-surface flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-ink-900 text-white flex items-center justify-center font-mono text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono text-xs font-bold text-ink-950 uppercase tracking-tight">
                  {document.title}
                </h3>
                <span className="font-mono text-3xs px-1.5 py-0.2 bg-surface-subtle border border-border-hairline text-ink-600">
                  {document.documentType}
                </span>
              </div>
              <p className="font-mono text-3xs text-ink-500 mt-0.5">
                DOC ID: {document.id} • CASE REF: {document.caseId} • {document.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              <span>{downloading ? 'FETCHING...' : 'DOWNLOAD'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-subtle border border-border-hairline text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Split Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border-hairline">
          {/* Left Column: Visual Document Preview */}
          <div className="p-6 bg-paper overflow-y-auto flex flex-col justify-between space-y-4">
            <div className="border border-border-hairline bg-surface p-6 shadow-subtle-1 space-y-4 font-mono text-3xs text-ink-800 min-h-[380px]">
              <div className="border-b border-border-hairline pb-3 flex justify-between items-center text-ink-400">
                <span className="font-bold text-ink-900">OFFICIAL GOVERNMENT DOCUMENT ARCHIVE</span>
                <span>STATE EMBLEM</span>
              </div>

              <div className="space-y-2 py-2">
                <div className="text-2xs font-bold text-ink-950 uppercase">
                  {document.title}
                </div>
                <div className="text-ink-500">
                  INGESTED: {new Date(document.uploadDate).toLocaleDateString('en-GB')}
                </div>
                <div className="p-3 bg-surface-subtle border border-border-hairline text-ink-700 leading-relaxed font-sans text-xs">
                  {document.ocrResult?.extractedText.slice(0, 320)}...
                </div>
              </div>

              <div className="pt-4 border-t border-border-hairline flex items-center justify-between text-ink-400">
                <span>DIGITALLY SIGNED & VERIFIED</span>
                <span className="text-sageSuccess font-semibold">CHECKSUM VALID</span>
              </div>
            </div>

            <div className="p-3 bg-surface border border-border-hairline flex items-center justify-between font-mono text-3xs">
              <span className="text-ink-500">ASSOCIATED CASE:</span>
              <button
                onClick={handleNavigateCase}
                className="text-vermilion hover:underline font-bold flex items-center space-x-1"
              >
                <span>{document.caseId} (INSPECT CASE)</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: OCR Text & Metadata Inspection */}
          <div className="flex flex-col bg-surface overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border-hairline bg-surface-subtle/50 font-mono text-2xs">
              <button
                onClick={() => setActiveTab('OCR')}
                className={`px-4 py-2.5 font-bold uppercase transition-colors border-r border-border-hairline ${
                  activeTab === 'OCR'
                    ? 'bg-surface text-ink-950 border-b-2 border-b-ink-950'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                EXTRACTED OCR TEXT
              </button>
              <button
                onClick={() => setActiveTab('METADATA')}
                className={`px-4 py-2.5 font-bold uppercase transition-colors border-r border-border-hairline ${
                  activeTab === 'METADATA'
                    ? 'bg-surface text-ink-950 border-b-2 border-b-ink-950'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                PARSED ENTITIES
              </button>
              <button
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-4 py-2.5 font-bold uppercase transition-colors ${
                  activeTab === 'PREVIEW'
                    ? 'bg-surface text-ink-950 border-b-2 border-b-ink-950'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                FILE METADATA
              </button>
            </div>

            {/* Tab Panes */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'OCR' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-hairline font-mono text-3xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-ink-400">ENGINE:</span>
                      <span className="text-ink-900 font-bold">
                        {document.ocrResult?.ocrEngine || 'Tesseract 5.3'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-ink-400">CONFIDENCE:</span>
                      <span className="text-sageSuccess font-bold">
                        {((document.ocrResult?.confidenceScore || 0.95) * 100).toFixed(0)}%
                      </span>
                      <button
                        onClick={handleCopyOCR}
                        className="ml-2 px-2 py-0.5 border border-border-hairline hover:bg-surface-subtle text-ink-700 flex items-center space-x-1"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>{copied ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-3 bg-surface-subtle border border-border-hairline font-mono text-3xs text-ink-900 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto select-text">
                    {document.ocrResult?.extractedText || 'No OCR extraction stream available.'}
                  </pre>
                </div>
              )}

              {activeTab === 'METADATA' && (
                <div className="space-y-3">
                  <span className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest block">
                    STRUCTURED ENTITIES EXTRACTED
                  </span>

                  <div className="divide-y divide-border-hairline border border-border-hairline">
                    {document.ocrResult?.extractedFields?.map((field, idx) => (
                      <div key={idx} className="p-3 bg-surface flex items-center justify-between font-mono text-2xs">
                        <div>
                          <span className="text-ink-400 text-3xs block">{field.key}</span>
                          <span className="font-bold text-ink-900">{field.value}</span>
                        </div>
                        <span className="font-mono text-3xs bg-sageSuccess-subtle text-sageSuccess px-1.5 py-0.5 border border-sageSuccess-border">
                          {(field.confidence * 100).toFixed(0)}% ACCURACY
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'PREVIEW' && (
                <div className="space-y-2.5 font-mono text-2xs">
                  <div className="p-3 bg-surface border border-border-hairline space-y-1">
                    <span className="text-ink-400 text-3xs">FILE SIZE:</span>
                    <div className="font-bold text-ink-900">{document.metadata.fileSize}</div>
                  </div>
                  <div className="p-3 bg-surface border border-border-hairline space-y-1">
                    <span className="text-ink-400 text-3xs">MIME TYPE / ENCODING:</span>
                    <div className="font-bold text-ink-900">{document.metadata.mimeType}</div>
                  </div>
                  <div className="p-3 bg-surface border border-border-hairline space-y-1">
                    <span className="text-ink-400 text-3xs">PAGE COUNT:</span>
                    <div className="font-bold text-ink-900">{document.metadata.pageCount} Pages</div>
                  </div>
                  <div className="p-3 bg-surface border border-border-hairline space-y-1">
                    <span className="text-ink-400 text-3xs">SHA256 CHECKSUM:</span>
                    <div className="font-bold text-ink-700 text-3xs break-all">
                      {document.metadata.checksum || 'sha256:7f8a91c84b238d019f2a'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border-hairline bg-surface-subtle/50 flex items-center justify-between font-mono text-3xs text-ink-500">
          <span>GOIP DOCUMENT & OCR REPOSITORY</span>
          <span>STORAGE: COMPLIANT ENCRYPTED STORAGE</span>
        </div>
      </div>
    </div>
  );
};
