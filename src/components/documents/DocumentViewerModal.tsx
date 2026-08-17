import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Download,
  FileText,
  Copy,
  Check,
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import { documentsService } from '../../services/api';
import { GovBadge } from '../common/GovBadge';
import { GovButton } from '../common/GovButton';

interface DocumentViewerModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'OCR' | 'PREVIEW' | 'METADATA'>('OCR');
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
    navigate(`/files/${document.caseId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white border-2 border-[#0B2A4A] rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0B2A4A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#123B63] border border-white/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-base tracking-tight leading-tight">
                  {document.title}
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded-[2px] font-sans">
                  {document.documentType}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Docket Ref: <strong className="text-white">{document.caseId}</strong> • File: {document.fileName} • Size: {document.metadata.fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <GovButton
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              loading={downloading}
              icon={<Download className="w-3.5 h-3.5 text-[#0B2A4A]" />}
            >
              Download Copy
            </GovButton>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-[2px] text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 bg-[#F8F9FA] border-b border-[#D9DDE3] flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('OCR')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'OCR'
                  ? 'border-[#0B2A4A] text-[#0B2A4A] bg-white'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              OCR Extracted Text &amp; Fields
            </button>
            <button
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'border-[#0B2A4A] text-[#0B2A4A] bg-white'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Document Docket View
            </button>
            <button
              onClick={() => setActiveTab('METADATA')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'METADATA'
                  ? 'border-[#0B2A4A] text-[#0B2A4A] bg-white'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Institutional Metadata
            </button>
          </div>

          <button
            onClick={handleNavigateCase}
            className="text-xs text-[#0B2A4A] hover:underline font-semibold flex items-center space-x-1"
          >
            <span>Open Related File Docket</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'OCR' && (
            <div className="space-y-5">
              {document.ocrResult ? (
                <>
                  {/* OCR Engine Metadata */}
                  <div className="p-3 bg-[#F0F5FA] border border-[#CBD2DE] rounded-[3px] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                      <span className="font-semibold text-[#0B2A4A]">
                        OCR Index Status: {document.ocrResult.ocrEngine}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-[#5F6368] font-mono text-[11px]">
                      <span>CONFIDENCE: <strong className="text-[#15803D]">{(document.ocrResult.confidenceScore * 100).toFixed(0)}%</strong></span>
                      <span>PROC TIME: <strong>{document.ocrResult.processingTimeMs} ms</strong></span>
                    </div>
                  </div>

                  {/* Extracted Key-Value Fields Grid */}
                  {document.ocrResult.extractedFields && document.ocrResult.extractedFields.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#0B2A4A]">
                        Structured Metadata Fields Extracted
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {document.ocrResult.extractedFields.map((field) => (
                          <div
                            key={field.key}
                            className="p-2.5 bg-[#FAF8F2] border border-[#D9D4C7] rounded-[3px] text-xs space-y-0.5"
                          >
                            <span className="text-[10px] uppercase font-bold text-[#5F6368]">
                              {field.label || field.key}
                            </span>
                            <div className="font-semibold text-[#202124] break-words">
                              {field.value}
                            </div>
                            <span className="text-[10px] text-[#15803D] font-mono">
                              {(field.confidence * 100).toFixed(0)}% match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Text Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#0B2A4A]">
                        Full Extracted Text Record
                      </h4>
                      <button
                        onClick={handleCopyOCR}
                        className="inline-flex items-center space-x-1 text-xs text-[#0B2A4A] hover:underline font-medium cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px] text-xs text-[#202124] font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {document.ocrResult.extractedText}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-[#5F6368] bg-[#F8F9FA] border border-[#D9DDE3] rounded-[3px]">
                  OCR text processing is currently pending for this document.
                </div>
              )}
            </div>
          )}

          {activeTab === 'PREVIEW' && (
            <div className="gov-notesheet p-8 rounded-[3px] space-y-4 max-w-2xl mx-auto shadow-sm">
              <div className="border-b border-[#D9D4C7] pb-3 text-center">
                <h3 className="font-serif font-bold text-base text-[#0B2A4A]">
                  GOVERNMENT OF KARNATAKA
                </h3>
                <p className="text-xs text-[#5F6368] uppercase tracking-wider font-semibold">
                  Official Administrative Record Docket
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#5F6368]">Document Ref:</span>
                  <strong className="block text-[#0B2A4A]">{document.metadata.referenceNumber || document.id}</strong>
                </div>
                <div>
                  <span className="text-[#5F6368]">Dated:</span>
                  <strong className="block text-[#0B2A4A]">{document.metadata.documentDate || document.uploadDate}</strong>
                </div>
                <div>
                  <span className="text-[#5F6368]">Issuing Authority:</span>
                  <strong className="block text-[#0B2A4A]">{document.metadata.issuingAuthority || 'State Secretariat'}</strong>
                </div>
                <div>
                  <span className="text-[#5F6368]">Document Type:</span>
                  <strong className="block text-[#0B2A4A]">{document.documentType}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D9D4C7] text-xs text-[#202124] leading-relaxed whitespace-pre-wrap font-serif">
                {document.ocrResult?.extractedText || 'Document content digitized and certified in electronic file tracking repository.'}
              </div>
            </div>
          )}

          {activeTab === 'METADATA' && (
            <div className="space-y-4">
              <table className="w-full border-collapse text-xs border border-[#D9DDE3]">
                <tbody>
                  <tr className="border-b border-[#D9DDE3]">
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368] w-1/3">Document ID</td>
                    <td className="p-2.5 font-mono text-[#0B2A4A] font-semibold">{document.id}</td>
                  </tr>
                  <tr className="border-b border-[#D9DDE3]">
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368]">Associated Case Ref</td>
                    <td className="p-2.5 font-mono text-[#0B2A4A] font-semibold">{document.caseId}</td>
                  </tr>
                  <tr className="border-b border-[#D9DDE3]">
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368]">File Name &amp; Type</td>
                    <td className="p-2.5 text-[#202124]">{document.fileName} ({document.metadata.fileType})</td>
                  </tr>
                  <tr className="border-b border-[#D9DDE3]">
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368]">File Size &amp; Page Count</td>
                    <td className="p-2.5 text-[#202124]">{document.metadata.fileSize} • {document.metadata.pageCount} Pages</td>
                  </tr>
                  <tr className="border-b border-[#D9DDE3]">
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368]">Upload Timestamp</td>
                    <td className="p-2.5 font-mono text-[#202124]">{document.uploadDate}</td>
                  </tr>
                  <tr className="border-b border-[#D9DDE3]">
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368]">Uploaded By</td>
                    <td className="p-2.5 text-[#202124]">{document.uploadedBy}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 bg-[#F8F9FA] font-bold text-[#5F6368]">Issuing Authority</td>
                    <td className="p-2.5 text-[#202124]">{document.metadata.issuingAuthority || 'Government Secretariat'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F8F9FA] border-t border-[#D9DDE3] flex items-center justify-between text-xs text-[#5F6368]">
          <span>Authenticated Electronic Record • Government of India</span>
          <GovButton variant="secondary" size="sm" onClick={onClose}>
            Close
          </GovButton>
        </div>
      </div>
    </div>
  );
};
