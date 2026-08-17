import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  FileText,
  GitBranch,
  Cpu,
  Download,
  AlertTriangle,
  Building2,
  Calendar,
  UserCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { casesService } from '../services/api';
import { Case, CaseEvent, DocumentRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatutoryCountdown } from '../components/common/StatutoryCountdown';
import { CaseTimeline } from '../components/cases/CaseTimeline';
import { RiskAttributionPanel } from '../components/cases/RiskAttributionPanel';
import { StatutoryDeadlineEngine } from '../components/cases/StatutoryDeadlineEngine';
import { DocumentViewerModal } from '../components/documents/DocumentViewerModal';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<(Case & { events: CaseEvent[]; documents: DocumentRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
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
      setError(err.message || `Case ${caseId} not found.`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] space-x-2 font-mono text-xs text-ink-600">
        <Loader2 className="w-4 h-4 animate-spin text-vermilion" />
        <span>FETCHING CASE INTELLIGENCE FROM REVENUE DATASTORE...</span>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-surface border border-border-hairline text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-vermilion mx-auto" />
        <h2 className="font-mono text-sm font-bold text-ink-900">
          CASE IDENTIFIER NOT LOCATED
        </h2>
        <p className="font-sans text-xs text-ink-600">
          {error || `The requested case ref "${caseId}" does not exist in the active revenue index.`}
        </p>
        <button
          onClick={() => navigate('/cases')}
          className="px-4 py-2 bg-ink-900 text-white font-mono text-2xs uppercase"
        >
          RETURN TO CASE REGISTRY
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-hairline pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/cases')}
            className="p-1.5 hover:bg-surface border border-border-hairline text-ink-600 hover:text-ink-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 font-mono text-3xs text-ink-500 uppercase tracking-widest">
              <Link to="/cases" className="hover:underline">CASES</Link>
              <span>/</span>
              <span>{caseData.department}</span>
              <span>/</span>
              <span className="text-ink-950 font-bold">{caseData.id}</span>
            </div>
            <h1 className="font-sans font-extrabold text-xl text-ink-950 tracking-tight mt-0.5">
              CASE // {caseData.id}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFlag}
            className={`px-3 py-1.5 border font-mono text-2xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors ${
              caseData.flaggedForReview
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-surface hover:bg-surface-hover border-border-hairline text-ink-700'
            }`}
          >
            {caseData.flaggedForReview ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>FLAGGED FOR REVIEW</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>FLAG FOR REVIEW</span>
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/simulation')}
            className="px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-vermilion" />
            <span>OPEN WHAT-IF SIMULATION</span>
          </button>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-surface border border-border-hairline p-6 shadow-subtle-1 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-3xs font-bold text-ink-500 uppercase px-1.5 py-0.5 bg-surface-subtle border border-border-hairline">
                {caseData.caseType}
              </span>
              <StatusBadge riskLevel={caseData.riskLevel} />
              <StatusBadge status={caseData.status} />
            </div>
            <h2 className="font-sans font-bold text-lg text-ink-950">
              {caseData.title}
            </h2>
            <p className="font-mono text-2xs text-ink-600">
              APPLICANT / PETITIONER: <strong className="text-ink-900">{caseData.applicant}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end font-mono text-2xs text-ink-600 space-y-1">
            <div>
              ASSIGNED OFFICER: <strong className="text-ink-900">{caseData.assignedOfficer}</strong>
            </div>
            <div>
              CREATED: {new Date(caseData.createdAt).toLocaleDateString('en-GB')} ({caseData.ageDays} days ago)
            </div>
            <div>
              STATUTORY DEADLINE:{' '}
              <StatutoryCountdown
                daysRemaining={caseData.daysRemaining}
                statutoryDeadlineDays={caseData.statutoryDeadlineDays}
              />
            </div>
          </div>
        </div>

        {/* Quick Stage Status Bar */}
        <div className="pt-3 border-t border-border-hairline flex flex-wrap items-center justify-between font-mono text-2xs text-ink-700 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-ink-400">CURRENT STAGE:</span>
            <span className="font-bold px-2 py-0.5 bg-ink-900 text-white text-3xs uppercase">
              {caseData.currentStage}
            </span>
          </div>

          <button
            onClick={() => navigate('/workflow')}
            className="text-vermilion hover:underline text-3xs font-bold flex items-center space-x-1"
          >
            <span>VIEW STAGE IN WORKFLOW GRAPH</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Analysis Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Chronological Workflow Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-border-hairline pb-2">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-ink-700" />
              <h3 className="font-sans font-bold text-sm text-ink-950 uppercase">
                WORKFLOW HISTORY &amp; STAGE TIMELINE
              </h3>
            </div>
            <span className="font-mono text-3xs text-ink-500">
              {caseData.events.length} RECORDED STAGE TRANSITIONS
            </span>
          </div>

          <CaseTimeline events={caseData.events} />
        </div>

        {/* Right Column: Risk Explanation, Statutory Engine & Documents */}
        <div className="lg:col-span-5 space-y-6">
          {/* ML Risk Explanation Panel */}
          {caseData.riskPrediction ? (
            <RiskAttributionPanel prediction={caseData.riskPrediction} />
          ) : (
            <div className="p-4 bg-surface border border-border-hairline font-mono text-2xs text-ink-500">
              ML RISK PREDICTION: RISK SCORE {caseData.riskScore}% ({caseData.riskLevel} RISK)
            </div>
          )}

          {/* Deterministic Statutory Engine */}
          <StatutoryDeadlineEngine
            statutoryDeadlineDays={caseData.statutoryDeadlineDays}
            daysRemaining={caseData.daysRemaining}
            createdAt={caseData.createdAt}
          />

          {/* Associated Documents Section */}
          <div className="bg-surface border border-border-hairline p-5 space-y-4 shadow-subtle-1">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-ink-700" />
                <div>
                  <h3 className="font-sans font-bold text-sm text-ink-950">
                    ASSOCIATED DOCUMENTS &amp; OCR
                  </h3>
                  <p className="font-mono text-3xs text-ink-500">
                    {caseData.documents.length} VERIFIED OFFICIAL ATTACHMENTS
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-2 py-1 bg-surface-subtle hover:bg-surface-hover border border-border-hairline font-mono text-3xs uppercase font-bold text-ink-900"
              >
                + ATTACH DOC
              </button>
            </div>

            {caseData.documents.length === 0 ? (
              <div className="p-4 text-center font-mono text-3xs text-ink-400">
                NO DOCUMENTS ATTACHED YET.
              </div>
            ) : (
              <div className="space-y-2">
                {caseData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="p-3 bg-surface hover:bg-surface-hover border border-border-hairline flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-2.5">
                      <FileText className="w-4 h-4 text-ink-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-sans text-xs font-semibold text-ink-950">
                          {doc.title}
                        </div>
                        <div className="font-mono text-3xs text-ink-500 mt-0.5">
                          {doc.documentType} • {doc.metadata.fileSize} • OCR: {doc.ocrStatus}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-3xs text-vermilion hover:underline font-bold">
                      OPEN OCR
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentViewerModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <DocumentUploadModal
        isOpen={isUploadOpen}
        preselectedCaseId={caseData.id}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newDoc) => {
          setCaseData((prev) => (prev ? { ...prev, documents: [newDoc, ...prev.documents] } : null));
          setSelectedDoc(newDoc);
        }}
      />
    </div>
  );
};
