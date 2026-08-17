import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  FileText,
  Clock,
  Download,
  AlertTriangle,
  Building2,
  Calendar,
  UserCheck,
  Send,
  Printer,
  PlusCircle,
  ScanLine,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { casesService, documentsService } from '../services/api';
import { Case, CaseEvent, DocumentRecord } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { FileMovementTimeline } from '../components/files/FileMovementTimeline';
import { FileForwardModal } from '../components/files/FileForwardModal';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';

export const FileDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<(Case & { events: CaseEvent[]; documents: DocumentRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  const fetchCase = async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await casesService.getCaseById(caseId);
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || `File docket "${caseId}" not located in active datastore.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const handleToggleFlag = async () => {
    if (!caseData) return;
    try {
      const res = await casesService.toggleFlagForReview(caseData.id);
      setCaseData((prev) => (prev ? { ...prev, flaggedForReview: res.flaggedForReview } : null));
    } catch (e) {
      console.error('Failed to toggle flag:', e);
    }
  };

  const handleApproveDisposal = async () => {
    if (!caseData) return;
    if (window.confirm('Are you sure you want to formally accord approval and mark this file as DISPOSED?')) {
      try {
        await casesService.updateStatus(caseData.id, 'APPROVED', 'Final administrative approval accorded.');
        fetchCase();
      } catch (err) {
        console.error('Failed to approve file:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] space-x-2 text-xs text-[#5F6368] font-sans">
        <Loader2 className="w-5 h-5 animate-spin text-[#0B2A4A]" />
        <span>Retrieving official file docket &amp; movement records...</span>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-white border border-[#D9DDE3] text-center space-y-4 rounded-[4px] shadow-sm my-10">
        <AlertTriangle className="w-8 h-8 text-[#B72025] mx-auto" />
        <h2 className="font-serif font-bold text-base text-[#202124]">
          File Docket Not Located
        </h2>
        <p className="text-xs text-[#5F6368] leading-relaxed">
          {error || `The requested file identifier "${caseId}" does not exist in the active government registry.`}
        </p>
        <GovButton variant="primary" onClick={() => navigate('/files')}>
          Return to File Register
        </GovButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/files')}
            className="p-1.5 border border-[#CBD2DE] rounded-[3px] hover:bg-white text-[#0B2A4A] transition-colors cursor-pointer"
            title="Back to File Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-extrabold text-xl sm:text-2xl text-[#0B2A4A] tracking-tight">
                {caseData.fileNumber || caseData.id}
              </h1>
              <StatusBadge status={caseData.status} />
              {caseData.priority && <StatusBadge status={caseData.priority} />}
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5 font-sans">
              Department of {caseData.department} • {caseData.section || 'General Administration'}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFlag}
            className={`p-2 border rounded-[3px] transition-colors cursor-pointer ${
              caseData.flaggedForReview
                ? 'bg-[#FEF2F2] border-[#B72025] text-[#B72025]'
                : 'bg-white border-[#CBD2DE] text-[#5F6368] hover:text-[#0B2A4A]'
            }`}
            title="Toggle High-Priority Flag"
          >
            {caseData.flaggedForReview ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5 text-[#0B2A4A]" />}
          >
            Print Docket
          </GovButton>

          <GovButton
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            icon={<PlusCircle className="w-3.5 h-3.5 text-[#0B2A4A]" />}
          >
            Attach Document
          </GovButton>

          <GovButton
            variant="primary"
            size="sm"
            onClick={() => setIsForwardOpen(true)}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Forward File
          </GovButton>

          {caseData.status !== 'APPROVED' && caseData.status !== 'DISPOSED' && (
            <GovButton
              variant="success"
              size="sm"
              onClick={handleApproveDisposal}
              icon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Approve / Dispose
            </GovButton>
          )}
        </div>
      </div>

      {/* Official File Docket Cover Sheet (Government Green / Note-Sheet Aesthetic) */}
      <div className="gov-notesheet p-6 rounded-[4px] shadow-sm space-y-4">
        <div className="border-b border-[#D9D4C7] pb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
              Official Subject Matter
            </span>
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#0B2A4A] leading-snug">
              {caseData.subject || caseData.title}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#5F6368] tracking-wider block">
              Inward Registration Date
            </span>
            <span className="font-mono text-xs text-[#0B2A4A] font-semibold">
              {caseData.createdAt}
            </span>
          </div>
        </div>

        {/* Docket Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#5F6368] block">Department:</span>
            <strong className="text-[#0B2A4A] font-semibold">{caseData.department}</strong>
          </div>
          <div>
            <span className="text-[#5F6368] block">Section / Wing:</span>
            <strong className="text-[#202124]">{caseData.section || caseData.currentStage}</strong>
          </div>
          <div>
            <span className="text-[#5F6368] block">Originator / Applicant:</span>
            <strong className="text-[#202124]">{caseData.applicant || caseData.origin}</strong>
          </div>
          <div>
            <span className="text-[#5F6368] block">Current Custodian Officer:</span>
            <strong className="text-[#0B2A4A]">{caseData.assignedOfficer}</strong>
          </div>
          <div>
            <span className="text-[#5F6368] block">Current Desk:</span>
            <span className="font-mono text-[#202124]">{caseData.currentDesk || 'DESK-01'}</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">Days in System:</span>
            <strong className="font-mono text-[#202124]">{caseData.ageDays} Days</strong>
          </div>
          <div>
            <span className="text-[#5F6368] block">Statutory SLA Window:</span>
            <span className="font-mono text-[#202124]">{caseData.statutoryDeadlineDays} Days</span>
          </div>
          <div>
            <span className="text-[#5F6368] block">SLA Remaining:</span>
            <span
              className={`font-mono font-bold ${
                caseData.daysRemaining < 0
                  ? 'text-[#B72025]'
                  : caseData.daysRemaining < 5
                  ? 'text-[#D97706]'
                  : 'text-[#15803D]'
              }`}
            >
              {caseData.daysRemaining >= 0
                ? `${caseData.daysRemaining} days remaining`
                : `${Math.abs(caseData.daysRemaining)} days OVERDUE`}
            </span>
          </div>
        </div>
      </div>

      {/* Delay Risk Evaluation (If Risk Data Exists) */}
      {caseData.riskPrediction && (
        <GovCard
          title={
            <div className="flex items-center space-x-2">
              <span className="font-serif font-bold text-sm text-[#0B2A4A]">
                Delay Risk &amp; Turnaround Intelligence
              </span>
              <StatusBadge status={caseData.riskPrediction.riskLevel} size="sm" />
            </div>
          }
          highlightBorder={caseData.riskPrediction.riskLevel === 'HIGH' ? 'red' : 'saffron'}
        >
          <div className="p-3 bg-[#FAF8F2] border border-[#D9D4C7] rounded-[3px] space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#0B2A4A]">
                {caseData.riskPrediction.primaryFactor}
              </span>
              <span className="font-mono font-bold text-[#B72025]">
                Excess Stage Delay: +{caseData.riskPrediction.excessPercentage || 71}% vs Benchmark
              </span>
            </div>

            <p className="text-[#202124] leading-relaxed">
              <strong>Recommended Action:</strong> {caseData.riskPrediction.recommendedAction}
            </p>

            <div className="pt-2 border-t border-[#D9D4C7] grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-[#5F6368]">
              <div>
                HISTORICAL BENCHMARK: <strong>{caseData.riskPrediction.historicalBaselineDays || 7} Days</strong>
              </div>
              <div>
                PREDICTED BREACH DATE: <strong className="text-[#B72025]">{caseData.riskPrediction.predictedBreachDate}</strong>
              </div>
              <div>
                ENGINE CONFIDENCE: <strong>{(caseData.riskPrediction.confidenceScore * 100).toFixed(0)}%</strong>
              </div>
            </div>
          </div>
        </GovCard>
      )}

      {/* Two Column Layout: Attached Documents & Movement Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Attached Documents */}
        <div className="lg:col-span-5 space-y-6">
          <GovCard
            title={`Attached Documents (${caseData.documents.length})`}
            subtitle="Digitized records, gazette orders, and OCR text."
            headerAction={
              <GovButton
                variant="secondary"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                icon={<PlusCircle className="w-3.5 h-3.5 text-[#0B2A4A]" />}
              >
                Add Document
              </GovButton>
            }
            noPadding
          >
            {caseData.documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#5F6368]">
                No attached documents uploaded for this file docket.
              </div>
            ) : (
              <div className="divide-y divide-[#D9DDE3]">
                {caseData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 hover:bg-[#F8F9FA] transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-[#0B2A4A] flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-[#202124] leading-tight">{doc.title}</h4>
                          <span className="text-[11px] text-[#5F6368] block mt-0.5">
                            {doc.documentType} • {doc.metadata.fileSize}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={doc.ocrStatus} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5F6368] pt-1">
                      <span>{doc.uploadDate}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="font-semibold text-[#0B2A4A] hover:underline cursor-pointer"
                        >
                          View / OCR
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GovCard>
        </div>

        {/* Right 7 cols: Chronological File Movement Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <GovCard
            title="Chronological File Movement Trail"
            subtitle="Complete ledger of desk-to-desk transfers and officer notes."
            headerAction={
              <GovButton
                variant="primary"
                size="sm"
                onClick={() => setIsForwardOpen(true)}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Forward Next
              </GovButton>
            }
          >
            <FileMovementTimeline events={caseData.events || []} />
          </GovCard>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={caseData.id}
        onUploadSuccess={() => {
          fetchCase();
        }}
      />

      {/* File Forward Modal */}
      <FileForwardModal
        isOpen={isForwardOpen}
        onClose={() => setIsForwardOpen(false)}
        caseItem={caseData}
        onForwarded={() => {
          setIsForwardOpen(false);
          fetchCase();
        }}
      />
    </div>
  );
};
