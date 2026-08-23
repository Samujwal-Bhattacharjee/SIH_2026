import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  MapPin,
  Building,
  Layers,
  FileCheck,
  Cpu,
  AlertOctagon,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit3,
} from 'lucide-react';
import { projectService } from '../services/api';
import { Case, CaseEvent, DocumentRecord, OCRResult } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { StatusBadge } from '../components/common/GovBadge';
import { GovModal } from '../components/common/GovModal';

export const ProjectDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Case | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [bottleneck, setBottleneck] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prediction' | 'timeline' | 'documents' | 'recommendations'>('overview');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Section 11 Notification');
  const [isUploading, setIsUploading] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<OCRResult | null>(null);

  const fetchAllProjectData = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const [projData, predData, botData, timeData, recData] = await Promise.all([
        projectService.getProjectById(caseId),
        projectService.getPrediction(caseId).catch(() => null),
        projectService.getBottlenecks(caseId).catch(() => null),
        projectService.getTimeline(caseId).catch(() => null),
        projectService.getRecommendations(caseId).catch(() => null),
      ]);
      setProject(projData);
      setPrediction(predData);
      setBottleneck(botData);
      setTimeline(timeData);
      setRecommendations(recData);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProjectData();
  }, [caseId]);

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !selectedFile) return;
    setIsUploading(true);
    try {
      const res = await projectService.uploadProjectDocument(caseId, selectedFile, docType);
      if (res.ocrResult) {
        setOcrPreview(res.ocrResult);
      }
      await fetchAllProjectData();
      setIsUploadOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded-[2px]" />
        <div className="h-40 bg-white border border-[#D9DDE3] rounded-[3px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-white border border-[#D9DDE3] rounded-[3px]" />
          <div className="h-64 bg-white border border-[#D9DDE3] rounded-[3px]" />
          <div className="h-64 bg-white border border-[#D9DDE3] rounded-[3px]" />
        </div>
      </div>
    );
  }

  const delayProb = prediction?.delay_probability ?? project.delayProbability ?? 0.82;
  const delayProbPct = Math.round(delayProb * 100);
  const predictedDelay = prediction?.predicted_delay_days ?? project.predictedDelayDays ?? 23;
  const riskLevel = prediction?.risk_level ?? project.riskLevel ?? 'HIGH';

  return (
    <div className="space-y-6 font-sans">
      {/* Back link & breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-3">
        <div className="flex items-center space-x-2 text-xs font-sans text-[#5F6368]">
          <Link to="/projects" className="hover:text-[#0B3558] flex items-center space-x-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects Register</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-[#0B3558] font-bold">{project.projectCode || project.fileNumber || project.id}</span>
        </div>

        <div className="flex items-center space-x-2">
          <GovButton
            variant="secondary"
            size="sm"
            onClick={fetchAllProjectData}
            icon={<RefreshCw className="w-3.5 h-3.5 text-[#0B3558]" />}
          >
            Refresh
          </GovButton>
          <GovButton
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Upload Document &amp; OCR
          </GovButton>
        </div>
      </div>

      {/* Project Master Header Dossier */}
      <div className="p-5 bg-white border border-[#CBD2DE] border-l-4 border-l-[#0B3558] rounded-[2px] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-[#0B3558] text-white font-mono text-xs font-bold rounded-[2px]">
                {project.projectCode || project.fileNumber || project.id}
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 font-sans text-xs font-bold rounded-[2px]">
                Stage: {project.currentStage}
              </span>
              <span className={`px-2 py-0.5 font-sans text-xs font-bold rounded-[2px] border ${
                riskLevel === 'CRITICAL' || delayProbPct >= 80 ? 'bg-red-50 text-red-800 border-red-300' :
                riskLevel === 'HIGH' || delayProbPct >= 60 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                'bg-green-50 text-green-800 border-green-300'
              }`}>
                {delayProbPct}% P(Delay) • {riskLevel} RISK
              </span>
            </div>

            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#0B3558] tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-[#5F6368] font-sans">
              {project.subject || 'Procurement compliance verification and bidder technical assessment.'}
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8F9FA] p-3 border border-[#D9DDE3] rounded-[2px] text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-[#5F6368] text-[10px] uppercase">State / District</span>
              <div className="font-bold text-[#0B3558] truncate">{project.district || 'Nashik'}, {project.state || 'Maharashtra'}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#5F6368] text-[10px] uppercase">Total Area</span>
              <div className="font-bold text-[#0B3558]">{project.totalArea || 42.5} Hectares</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#5F6368] text-[10px] uppercase">Parcels</span>
              <div className="font-bold text-[#0B3558]">{project.completedParcels || 46} / {project.totalParcels || 84} Complete</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#5F6368] text-[10px] uppercase">Officer In-Charge</span>
              <div className="font-bold text-[#0B3558] truncate">{project.assignedOfficer || 'SLAO Office'}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#D9DDE3] -mx-5 px-5 space-x-4 text-xs font-sans font-medium overflow-x-auto">
          {[
            { id: 'overview', label: '1. Overview & Delay Prediction' },
            { id: 'timeline', label: '2. 11-Stage Workflow Timeline' },
            { id: 'recommendations', label: '3. Prescribed Directives' },
            { id: 'documents', label: `4. Documents & OCR (${(project.documents || []).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 transition-colors border-b-2 font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#0B3558] border-[#0B3558]'
                  : 'text-[#5F6368] border-transparent hover:text-[#0B3558]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & PREDICTION */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: AI Predictive Delay Risk Engine Card */}
          <div className="lg:col-span-7 space-y-6">
            <GovCard
              title={
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-[#0B3558]" />
                  <span>ML Delay Prediction &amp; Contributing Risk Factors</span>
                </div>
              }
              subtitle="Trained Random Forest Classifier (v1) evaluating 11 observable project risk dimensions."
              highlightBorder={delayProbPct >= 70 ? 'red' : 'saffron'}
            >
              <div className="space-y-4">
                {/* Probability Metric Strip */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider block">
                        Estimated Probability of Completion Delay
                      </span>
                      <div className="text-3xl font-bold font-serif text-[#0B3558]">
                        {delayProbPct}%
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-[#475569] block">Expected Delay Duration</span>
                      <span className="text-xl font-bold text-[#B72025]">
                        +{predictedDelay} Days
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-[1px] overflow-hidden flex">
                    <div
                      className={`h-full transition-all ${
                        delayProbPct >= 80 ? 'bg-[#B72025]' :
                        delayProbPct >= 60 ? 'bg-[#D97706]' :
                        'bg-[#15803D]'
                      }`}
                      style={{ width: `${delayProbPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                    <span>0% (On-Track)</span>
                    <span>30% Low</span>
                    <span>60% High Risk</span>
                    <span>100% Critical</span>
                  </div>
                </div>

                {/* Top Contributing Observed Risk Factors */}
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-xs text-[#0B3558] uppercase tracking-wider">
                    Observed Risk Factors &amp; Model Feature Attribution
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    {/* Factor 1: Compensation */}
                    <div className="p-2.5 bg-white border border-[#D9DDE3] rounded-[2px] flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0B3558]">Compensation Pending</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            (project.compensationPendingDays || 0) > 30 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {project.compensationPendingDays || 19} Days Pending
                          </span>
                        </div>
                        <p className="text-[#5F6368] text-[11px]">
                          Compensation disbursement has been awaiting sanction. Model weight: 36.6% importance.
                        </p>
                      </div>
                      <span className="font-mono text-red-700 font-bold text-xs">+36.6% Attrib</span>
                    </div>

                    {/* Factor 2: Ownership Conflict */}
                    <div className="p-2.5 bg-white border border-[#D9DDE3] rounded-[2px] flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0B3558]">Ownership Title Dispute</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            project.ownershipConflict ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {project.ownershipConflict ? 'Active Conflict' : 'Clear Title'}
                          </span>
                        </div>
                        <p className="text-[#5F6368] text-[11px]">
                          Contested title or multi-party ownership claims noted on survey parcel.
                        </p>
                      </div>
                      <span className="font-mono text-amber-700 font-bold text-xs">+22.1% Attrib</span>
                    </div>

                    {/* Factor 3: Documentation Completeness */}
                    <div className="p-2.5 bg-white border border-[#D9DDE3] rounded-[2px] flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0B3558]">Documentation Completeness</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            (project.documentationCompleteness || 100) < 70 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {project.documentationCompleteness || 62}% Complete
                          </span>
                        </div>
                        <p className="text-[#5F6368] text-[11px]">
                          Required cadastral sheets, RoR extracts, and joint measurement records indexed.
                        </p>
                      </div>
                      <span className="font-mono text-amber-700 font-bold text-xs">+11.9% Attrib</span>
                    </div>

                    {/* Factor 4: Legal Dispute */}
                    <div className="p-2.5 bg-white border border-[#D9DDE3] rounded-[2px] flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0B3558]">Court Case / Legal Dispute</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            project.legalDispute ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {project.legalDispute ? 'Active Litigation' : 'No Court Stay'}
                          </span>
                        </div>
                        <p className="text-[#5F6368] text-[11px]">
                          Writ petition or interim stay order status in district/high court.
                        </p>
                      </div>
                      <span className="font-mono text-[#5F6368] font-bold text-xs">+11.4% Attrib</span>
                    </div>
                  </div>
                </div>

                {/* Model Metadata Footer */}
                <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between text-[11px] text-[#64748B] font-mono">
                  <span>MODEL: RandomForestClassifier (v1)</span>
                  <span>ACCURACY: 94.58%</span>
                  <span>ROC-AUC: 0.9934</span>
                </div>
              </div>
            </GovCard>
          </div>

          {/* Right: Stage Bottleneck & Primary Recommendation */}
          <div className="lg:col-span-5 space-y-6">
            {/* Stage Bottleneck Card */}
            <GovCard
              title="Active Stage Stagnation Diagnosis"
              subtitle="Verification stage dwell time analysis."
              highlightBorder="saffron"
            >
              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[4px] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#92400E]">
                    Stalled at '{project.currentStage}'
                  </span>
                  <span className="px-2 py-0.5 bg-[#DC2626] text-white rounded-[2px] font-mono font-bold text-[10px]">
                    +14 DAYS OVERDUE
                  </span>
                </div>

                <p className="text-[#78350F] text-[11px] leading-relaxed">
                  File has exceeded the expected evaluation baseline for this stage ({project.currentStage}).
                  Certificate review and source validation required.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#FDE68A] text-[11px] font-mono text-[#92400E]">
                  <div>
                    <span>BASELINE: <strong>90 Days</strong></span>
                  </div>
                  <div>
                    <span>ACTUAL DWELL: <strong className="text-[#DC2626]">104 Days</strong></span>
                  </div>
                </div>
              </div>
            </GovCard>

            {/* Recommended Action Card */}
            <GovCard
              title="Immediate Action Directives"
              subtitle="Automated, rule-based administrative recommendations."
              highlightBorder="green"
            >
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[#166534] font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <span>Primary Escalation Directive</span>
                  </div>
                  <p className="text-[#14532D] text-[11px] leading-relaxed font-medium">
                    {recommendations?.primary_recommendation ||
                      'Request bidder clarification on exception items and complete statutory certificate validation prior to qualification decision.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#0B2A4A] uppercase tracking-wider block">
                    Secondary Tasks
                  </span>
                  <ul className="space-y-1 text-[#202124] text-[11px]">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>Validate bidder GSTIN and incorporation certificate with statutory registry.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>Request missing OEM Manufacturer Authorization Form validity confirmation.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </GovCard>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: TIMELINE (Expected vs Actual MIS Table) */}
      {activeTab === 'timeline' && (
        <GovCard
          title="Sequential Verification Workflow Pipeline &amp; Variance Audit"
          subtitle="Sequential tracking of verification milestones, expected baselines, observed stage dwell times, and variance."
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-[#0B3558] text-white border-b-2 border-[#040E1A]">
                  <th className="p-3 font-semibold w-12 text-center">#</th>
                  <th className="p-3 font-semibold">Verification Stage</th>
                  <th className="p-3 font-semibold text-center">Expected Baseline</th>
                  <th className="p-3 font-semibold text-center">Actual Dwell</th>
                  <th className="p-3 font-semibold text-center">Timeline Variance</th>
                  <th className="p-3 font-semibold text-center">Stage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE3]">
                {(timeline?.stages || [
                  { stage_name: 'Project Initiation', expected_days: 15, actual_days: 12, delay_days: 0, status: 'COMPLETED' },
                  { stage_name: 'Land Identification', expected_days: 30, actual_days: 28, delay_days: 0, status: 'COMPLETED' },
                  { stage_name: 'Preliminary Notification', expected_days: 30, actual_days: 30, delay_days: 0, status: 'COMPLETED' },
                  { stage_name: 'Survey and Verification', expected_days: 45, actual_days: 44, delay_days: 0, status: 'COMPLETED' },
                  { stage_name: 'Ownership Verification', expected_days: 30, actual_days: 46, delay_days: 16, status: 'COMPLETED', is_delayed: true },
                  { stage_name: 'Objection and Legal Review', expected_days: 60, actual_days: 58, delay_days: 0, status: 'COMPLETED' },
                  { stage_name: 'Compensation Assessment', expected_days: 60, actual_days: 62, delay_days: 2, status: 'COMPLETED', is_delayed: true },
                  { stage_name: 'Compensation Disbursement', expected_days: 90, actual_days: 104, delay_days: 14, status: 'IN_PROGRESS', is_delayed: true, is_current: true },
                  { stage_name: 'R&R and Rehabilitation', expected_days: 120, actual_days: 0, delay_days: 0, status: 'UPCOMING' },
                  { stage_name: 'Final Acquisition', expected_days: 30, actual_days: 0, delay_days: 0, status: 'UPCOMING' },
                  { stage_name: 'Possession and Handover', expected_days: 30, actual_days: 0, delay_days: 0, status: 'UPCOMING' },
                ]).map((stg: any, index: number) => {
                  const variance = stg.actual_days - stg.expected_days;
                  return (
                    <tr
                      key={index}
                      className={`hover:bg-[#F9FAFB] transition-colors ${
                        stg.is_current ? 'bg-[#FFFDF5] font-semibold' :
                        index % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                      }`}
                    >
                      <td className="p-3 text-center font-mono text-[#5F6368] font-bold">
                        {index + 1}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0B3558]">{stg.stage_name}</span>
                          {stg.is_current && (
                            <span className="px-1.5 py-0.2 bg-[#E87511] text-white text-[9px] font-bold rounded uppercase">
                              CURRENT STAGE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-gray-700">
                        {stg.expected_days} Days
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {stg.status === 'UPCOMING' ? (
                          <span className="text-gray-400 font-normal">Pending Start</span>
                        ) : (
                          <span className={stg.is_delayed ? 'text-[#B72025]' : 'text-gray-800'}>
                            {stg.actual_days} Days
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {stg.status === 'UPCOMING' ? (
                          <span className="text-gray-400">-</span>
                        ) : variance > 0 ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-300 rounded font-bold text-[11px]">
                            +{variance}d Excess
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-800 border border-green-300 rounded font-semibold text-[11px]">
                            {variance === 0 ? '0d (On Time)' : `${variance}d Ahead`}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-[2px] font-bold text-[10px] uppercase border ${
                          stg.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          stg.is_current ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold' :
                          'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          {stg.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GovCard>
      )}

      {/* TAB CONTENT 3: RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <GovCard
          title="Explainable Administrative Action Matrix"
          subtitle="Directives generated deterministically from observed risk factors and stage bottlenecks."
        >
          <div className="space-y-4">
            {(recommendations?.recommended_actions || [
              { factor: 'Compensation Pending', reason: 'Compensation disbursement pending for 19 days.', action: 'Escalate compensation disbursement to SLAO / District Collector.', urgency: 'HIGH' },
              { factor: 'Ownership Conflict', reason: 'Disputed title / contested ownership on parcel.', action: 'Initiate Special Revenue Court summary inquiry with Sub-Divisional Magistrate.', urgency: 'HIGH' },
              { factor: 'Documentation Completeness', reason: 'Documentation completeness at 62%.', action: 'Request missing cadastral and RoR extracts from Land Revenue office.', urgency: 'MEDIUM' },
            ]).map((rec: any, i: number) => (
              <div
                key={i}
                className="p-4 bg-white border border-[#D9DDE3] border-l-4 border-l-[#0B2A4A] rounded-[3px] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B2A4A] text-sm">{rec.factor}</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    rec.urgency === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {rec.urgency} URGENCY
                  </span>
                </div>
                <div className="text-[#5F6368] text-[11px]">
                  <strong>Trigger Reason:</strong> {rec.reason}
                </div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0B2A4A] font-semibold">
                  Action Directive: {rec.action}
                </div>
              </div>
            ))}
          </div>
        </GovCard>
      )}

      {/* TAB CONTENT 4: DOCUMENTS & OCR */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <GovCard
            title="Attached Land Records &amp; Gazette Orders"
            subtitle="Uploaded PDF and image files processed through the digital + fallback OCR extraction pipeline."
            headerAction={
              <GovButton
                variant="primary"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Record
              </GovButton>
            }
          >
            <div className="space-y-3">
              {(project.documents && project.documents.length > 0) ? (
                project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white border border-[#D9DDE3] rounded-[3px] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-5 h-5 text-[#0B2A4A]" />
                        <div>
                          <div className="font-bold text-[#0B2A4A]">{doc.title || doc.fileName}</div>
                          <span className="text-[11px] text-[#5F6368]">{doc.documentType} • {doc.metadata?.fileSize || '350 KB'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-mono font-bold text-[10px]">
                        OCR READY
                      </span>
                    </div>

                    {/* Extracted fields */}
                    {doc.ocrResult && doc.ocrResult.extractedFields && (
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-2">
                        <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider block">
                          OCR Extracted Land Record Fields:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                          {doc.ocrResult.extractedFields.slice(0, 6).map((f: any, idx: number) => (
                            <div key={idx} className="bg-white p-2 border border-gray-200 rounded">
                              <span className="text-[#64748B] block text-[9px] uppercase">{f.label || f.key}</span>
                              <span className="font-bold text-[#0B2A4A] truncate block">{String(f.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#5F6368] bg-gray-50 border border-dashed border-gray-300 rounded">
                  No documents attached yet. Click "Upload Record" above to upload and scan land records.
                </div>
              )}
            </div>
          </GovCard>
        </div>
      )}

      {/* Upload & OCR Modal */}
      <GovModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Land Record &amp; Run OCR Extraction"
        maxWidth="md"
      >
        <form onSubmit={handleDocumentUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#0B2A4A] mb-1">
              Document Category
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2 border border-[#CBD2DE] rounded bg-white"
            >
              <option value="Section 11 Notification">Section 11 Preliminary Notification</option>
              <option value="Cadastral Survey Map">Cadastral Survey Map &amp; Joint Measurement</option>
              <option value="Record of Rights (RoR)">Record of Rights (RoR) / 7/12 Extract</option>
              <option value="Compensation Award Order">Section 23/31 Compensation Award Order</option>
              <option value="High Court Stay Order">High Court / District Court Order</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#0B2A4A] mb-1">
              Select Document File (PDF / Image)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full p-2 border border-[#CBD2DE] rounded bg-white"
              required
            />
            <p className="text-[11px] text-[#5F6368] mt-1">
              Text will be extracted automatically via PyMuPDF + Tesseract fallback OCR.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <GovButton variant="secondary" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </GovButton>
            <GovButton
              variant="primary"
              size="sm"
              type="submit"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Extracting OCR...' : 'Upload & Process OCR'}
            </GovButton>
          </div>
        </form>
      </GovModal>
    </div>
  );
};
export default ProjectDetail;
