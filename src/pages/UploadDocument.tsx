import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  ScanLine,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Copy,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { ocrService, casesService, documentsService, departmentService } from '../services/api';
import { OCRResult, Department, PriorityLevel, DocumentType, DepartmentInfo, OfficerInfo } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { FormField, inputBaseClasses, selectBaseClasses, textareaBaseClasses } from '../components/common/FormField';
import { MOCK_DEPARTMENTS } from '../mock/data';

const OCR_STEPS = [
  'Validating document format and security signatures...',
  'Analyzing document layout and regional Indic language scripts...',
  'Executing neural text recognition (Tesseract 5.3 + Multi-lingual)...',
  'Extracting named entities (File Number, Survey No, Dates, Officers)...',
  'Mapping structured metadata to government docket schema...',
];

// Represents the two-phase registration state
type RegPhase =
  | 'IDLE'
  | 'CREATING_CASE'
  | 'UPLOADING_DOC'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'; // case OK but doc failed

interface SuccessResult {
  caseId: string;
  fileNumber: string;
  docName?: string;
  docFailed?: boolean;
  docError?: string;
}

export const UploadDocument: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('Application Form');
  const [department, setDepartment] = useState<Department>('Land Revenue');
  const [processing, setProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regPhase, setRegPhase] = useState<RegPhase>('IDLE');
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);

  const [departments, setDepartments] = useState<DepartmentInfo[]>(MOCK_DEPARTMENTS);
  const [officers, setOfficers] = useState<OfficerInfo[]>([]);

  React.useEffect(() => {
    departmentService.getDepartments().then((d) => {
      if (d && d.length > 0) setDepartments(d);
    }).catch(console.error);

    departmentService.getOfficers().then((o) => {
      if (o && o.length > 0) setOfficers(o);
    }).catch(console.error);
  }, []);

  // Editable Form Fields populated by OCR
  const [fileNumber, setFileNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [sender, setSender] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('K. R. Mohan (Assistant Commissioner)');
  const [priority, setPriority] = useState<PriorityLevel>('URGENT');
  const [notes, setNotes] = useState('');

  const navigate = useNavigate();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setOcrResult(null);
    setRegPhase('IDLE');
    setSuccessResult(null);
  };

  const handleStartOcr = async () => {
    if (!file) {
      setError('Please select a valid document file to scan.');
      return;
    }
    setError(null);
    setProcessing(true);
    setCurrentStepIndex(0);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < OCR_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 280);

    try {
      const result = await ocrService.processDocument(file);
      clearInterval(stepInterval);
      setOcrResult(result);

      // Pre-fill editable fields from OCR extraction
      const getFieldVal = (key: string) => result.extractedFields.find((f) => f.key === key)?.value || '';

      setFileNumber(getFieldVal('caseNumber') || getFieldVal('fileNumber') || `KA/REV/2026/00${Math.floor(1000 + Math.random() * 9000)}`);
      setSubject(getFieldVal('subject') || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      setSender(getFieldVal('sender') || 'Office of District Collector');
      setDocumentDate(getFieldVal('date') || new Date().toISOString().split('T')[0]);
      setReferenceNumber(getFieldVal('referenceNumber') || `REF-GOI-${Date.now().toString().slice(-5)}`);
      setPriority('URGENT');
      setNotes('Document ingested via automatic OCR scanning pipeline. Extracted metadata reviewed and verified by officer.');
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'OCR processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please verify the subject description before registering.');
      return;
    }
    setError(null);

    // Phase 1: Create Case
    setRegPhase('CREATING_CASE');
    let createdCase: any;
    try {
      createdCase = await casesService.createCase({
        fileNumber,
        title: subject,
        subject,
        department,
        applicant: sender,
        origin: sender,
        assignedOfficer,
        priority,
        caseType: documentType,
        statutoryDeadlineDays: priority === 'IMMEDIATE' ? 7 : priority === 'URGENT' ? 15 : 30,
      });
    } catch (err: any) {
      setRegPhase('IDLE');
      setError(err.message || 'Failed to create file docket. Please try again.');
      return;
    }

    // Phase 2: Upload Document (separate try-catch; case is already created)
    setRegPhase('UPLOADING_DOC');
    if (file) {
      try {
        await documentsService.uploadDocument(file, createdCase.id, documentType);
        setSuccessResult({ caseId: createdCase.id, fileNumber: createdCase.fileNumber || fileNumber, docName: file.name });
        setRegPhase('SUCCESS');
      } catch (docErr: any) {
        // Case succeeded but doc failed — partial success
        setSuccessResult({
          caseId: createdCase.id,
          fileNumber: createdCase.fileNumber || fileNumber,
          docFailed: true,
          docError: docErr.message || 'Document storage upload failed.',
        });
        setRegPhase('PARTIAL_SUCCESS');
        return;
      }
    } else {
      setSuccessResult({ caseId: createdCase.id, fileNumber: createdCase.fileNumber || fileNumber });
      setRegPhase('SUCCESS');
    }
  };

  const handleCopyText = () => {
    if (ocrResult?.extractedText) {
      navigator.clipboard.writeText(ocrResult.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSubmitting = regPhase === 'CREATING_CASE' || regPhase === 'UPLOADING_DOC';

  const submitButtonLabel = () => {
    if (regPhase === 'CREATING_CASE') return 'Creating File Docket...';
    if (regPhase === 'UPLOADING_DOC') return 'Attaching Document...';
    return 'Confirm & Register File Docket';
  };

  // ── SUCCESS STATE ────────────────────────────────────────────────────────────
  if (regPhase === 'SUCCESS' && successResult) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
              Upload & Scan Government Document (OCR)
            </h1>
          </div>
        </div>
        <div className="max-w-xl mx-auto mt-8">
          <GovCard title="Government File Registered Successfully" highlightBorder="green">
            <div className="space-y-5 py-2">
              <div className="flex items-center space-x-3 text-[#15803D]">
                <CheckCircle2 className="w-10 h-10 flex-shrink-0" />
                <div>
                  <p className="font-bold text-base">File Docket Created & Document Attached</p>
                  <p className="text-xs text-[#5F6368] mt-0.5">The case has been registered in the Supabase database and the document is stored.</p>
                </div>
              </div>

              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[3px] p-4 space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-[#15803D]" />
                  <span className="text-[#5F6368]">File Number:</span>
                  <strong className="font-mono text-[#0B2A4A]">{successResult.fileNumber}</strong>
                </div>
                {successResult.docName && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#15803D]" />
                    <span className="text-[#5F6368]">Document:</span>
                    <strong className="text-[#0B2A4A] truncate">{successResult.docName}</strong>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <GovButton
                  variant="primary"
                  onClick={() => navigate(`/files/${successResult.caseId}`)}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  View Case Docket
                </GovButton>
                <GovButton
                  variant="secondary"
                  onClick={() => navigate('/files')}
                >
                  Open File Register
                </GovButton>
                <GovButton
                  variant="secondary"
                  onClick={() => {
                    setOcrResult(null);
                    setFile(null);
                    setRegPhase('IDLE');
                    setSuccessResult(null);
                    setFileNumber('');
                    setSubject('');
                  }}
                >
                  Register Another
                </GovButton>
              </div>
            </div>
          </GovCard>
        </div>
      </div>
    );
  }

  // ── PARTIAL SUCCESS STATE (case ok, doc failed) ──────────────────────────────
  if (regPhase === 'PARTIAL_SUCCESS' && successResult) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Upload & Scan Government Document (OCR)
          </h1>
        </div>
        <div className="max-w-xl mx-auto mt-8">
          <GovCard title="File Docket Created — Document Attachment Failed" highlightBorder="navy">
            <div className="space-y-5 py-2">
              <div className="flex items-start space-x-3 text-[#D97706]">
                <AlertCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base">Partial Registration</p>
                  <p className="text-xs text-[#5F6368] mt-0.5">The case docket was registered in the database, but the document could not be stored.</p>
                </div>
              </div>

              <div className="bg-[#FFF8F8] border border-[#FECACA] rounded-[3px] p-3 text-xs text-[#B72025]">
                <strong>Document Upload Error:</strong> {successResult.docError}
              </div>

              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[3px] p-3 space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span className="text-[#5F6368]">Case registered with File Number:</span>
                  <strong className="font-mono text-[#0B2A4A]">{successResult.fileNumber}</strong>
                </div>
              </div>

              <p className="text-xs text-[#5F6368]">
                You can open the case docket and use the <strong>"Upload Document"</strong> button to attach the file again.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <GovButton
                  variant="primary"
                  onClick={() => navigate(`/files/${successResult.caseId}`)}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Case Docket
                </GovButton>
                <GovButton
                  variant="secondary"
                  onClick={() => navigate('/files')}
                >
                  File Register
                </GovButton>
              </div>
            </div>
          </GovCard>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Upload & Scan Government Document (OCR)
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Digitize incoming petitions, gazette notifications, court orders, and land records with optical text recognition and metadata extraction.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FFF8F8] border border-[#C62828] rounded-[2px] text-xs text-[#C62828] flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-[#C62828] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Validation Alert:</strong> {error}
          </div>
        </div>
      )}

      {/* Step 1: Document Upload & OCR Trigger */}
      {!ocrResult && (
        <GovCard
          title="Step 1: Select Document & Run OCR Scanner"
          subtitle="Supports PDF, JPG, PNG, TIFF up to 50 MB"
          highlightBorder="navy"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Document Classification" required>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className={selectBaseClasses}
                >
                  <option value="Application Form">Application Form / Citizen Petition</option>
                  <option value="Court Order">High Court / District Court Order</option>
                  <option value="Site Inspection Report">Site Inspection & Survey Sketch</option>
                  <option value="Clearance Certificate">Clearance Certificate / NOC</option>
                  <option value="Legal Opinion">Legal Opinion / Note Sheet</option>
                  <option value="Gazette Notification">Official Gazette Notification</option>
                </select>
              </FormField>

              <FormField label="Target Department" required>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className={selectBaseClasses}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Dropzone: shows file card when file selected */}
            {file ? (
              <div className="p-4 border border-[#B2C4D8] bg-[#EEF4FA] rounded-[4px] flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-[3px] bg-[#0B2A4A] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#0B2A4A] truncate">{file.name}</p>
                    <p className="text-xs text-[#5F6368]">
                      {file.type || 'Document'} &nbsp;•&nbsp; {(file.size / (1024 * 1024)).toFixed(2)} MB &nbsp;•&nbsp;
                      <span className="text-[#15803D] font-semibold">Ready for OCR</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setError(null); }}
                  className="text-[#5F6368] hover:text-[#C62828] transition-colors p-1 flex-shrink-0"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-[#CBD2DE] hover:border-[#0B2A4A] rounded-[4px] bg-[#F8F9FA] text-center transition-colors">
                <input
                  type="file"
                  id="ocr-file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="ocr-file-upload" className="cursor-pointer block space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E6EEF5] text-[#0B2A4A] flex items-center justify-center mx-auto shadow-sm">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-[#202124]">
                      Click to choose document or drop file here
                    </p>
                    <p className="text-xs text-[#5F6368]">
                      Official formats supported: PDF, JPG, PNG, TIFF
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* OCR Processing Progress */}
            {processing && (
              <div className="p-4 bg-[#F0F5FA] border border-[#CBD2DE] rounded-[3px] space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0B2A4A]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0B2A4A]" />
                  <span>Optical Character Recognition In Progress...</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0B2A4A] h-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / OCR_STEPS.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#5F6368] font-mono">
                  {OCR_STEPS[currentStepIndex]}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <GovButton
                variant="primary"
                size="md"
                loading={processing}
                disabled={!file || processing}
                onClick={handleStartOcr}
                icon={<ScanLine className="w-4 h-4" />}
              >
                Scan & Extract Metadata
              </GovButton>
            </div>
          </div>
        </GovCard>
      )}

      {/* Step 2: Dual-Pane Review */}
      {ocrResult && (
        <div className="space-y-6">
          {/* OCR Engine Success Banner */}
          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[3px] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>OCR Scanning Complete:</strong> Extracted {ocrResult.extractedFields.length} structured metadata fields with {(ocrResult.confidenceScore * 100).toFixed(0)}% confidence score.
              </span>
            </div>
            <button
              onClick={() => {
                setOcrResult(null);
                setFile(null);
              }}
              className="text-xs text-[#0B2A4A] hover:underline font-semibold"
            >
              Scan Another Document
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Document Preview & Full OCR Text */}
            <div className="lg:col-span-6 space-y-4">
              <GovCard
                title="Document Docket Preview & OCR Text"
                subtitle={`Processed by ${ocrResult.ocrEngine}`}
                headerAction={
                  <button
                    onClick={handleCopyText}
                    className="inline-flex items-center space-x-1 text-xs text-[#0B2A4A] hover:underline font-semibold cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                }
              >
                <div className="space-y-3">
                  <div className="gov-notesheet p-4 rounded-[3px] text-xs leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto text-[#202124]">
                    {ocrResult.extractedText}
                  </div>

                  {/* Extracted Fields Chips */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block">
                      Detected Entities
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {ocrResult.extractedFields.map((f) => (
                        <div
                          key={f.key}
                          className="p-2 bg-[#F8F9FA] border border-[#D9DDE3] rounded-[2px]"
                        >
                          <span className="text-[10px] text-[#5F6368] block">{f.label || f.key}</span>
                          <strong className="text-[#0B2A4A] text-xs truncate block">{f.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GovCard>
            </div>

            {/* Right 6 cols: Editable Government Docket Registration Form */}
            <div className="lg:col-span-6">
              <GovCard
                title="Step 2: Review & Edit Docket Metadata"
                subtitle="Verify or modify extracted fields before issuing official file number."
                highlightBorder="green"
              >
                <form onSubmit={handleConfirmRegistration} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Assigned File Number" required>
                      <input
                        type="text"
                        value={fileNumber}
                        onChange={(e) => setFileNumber(e.target.value)}
                        className={`${inputBaseClasses} font-mono font-bold text-[#0B2A4A]`}
                        required
                      />
                    </FormField>

                    <FormField label="Reference Number">
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className={inputBaseClasses}
                      />
                    </FormField>
                  </div>

                  <FormField label="Subject Matter Description" required>
                    <textarea
                      rows={2}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={textareaBaseClasses}
                      required
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Department" required>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value as Department)}
                        className={selectBaseClasses}
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Sender / Originating Authority" required>
                      <input
                        type="text"
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        className={inputBaseClasses}
                        required
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Document Date">
                      <input
                        type="date"
                        value={documentDate}
                        onChange={(e) => setDocumentDate(e.target.value)}
                        className={inputBaseClasses}
                      />
                    </FormField>

                    <FormField label="Priority Level">
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                        className={selectBaseClasses}
                      >
                        <option value="ROUTINE">Routine (30d SLA)</option>
                        <option value="URGENT">Urgent (15d SLA)</option>
                        <option value="IMMEDIATE">Immediate (7d SLA)</option>
                      </select>
                    </FormField>

                    <FormField label="Assign Officer" required>
                      <select
                        value={assignedOfficer}
                        onChange={(e) => setAssignedOfficer(e.target.value)}
                        className={selectBaseClasses}
                      >
                        {officers.map((o) => (
                          <option key={o.id} value={`${o.name} (${o.designation})`}>
                            {o.name} ({o.designation})
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Official Inward Noting">
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={textareaBaseClasses}
                    />
                  </FormField>

                  {/* Registration Phase Progress Bar */}
                  {isSubmitting && (
                    <div className="p-3 bg-[#F0F5FA] border border-[#CBD2DE] rounded-[3px] space-y-2 text-xs">
                      <div className="flex items-center space-x-2 font-bold text-[#0B2A4A]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering Official File Docket...</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                          <span className="text-[#15803D]">OCR extraction completed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {regPhase === 'CREATING_CASE' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B2A4A]" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                          )}
                          <span className={regPhase === 'CREATING_CASE' ? 'font-semibold text-[#0B2A4A]' : 'text-[#15803D]'}>
                            Creating case docket in database
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {regPhase === 'UPLOADING_DOC' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B2A4A]" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-[#CBD2DE]" />
                          )}
                          <span className={regPhase === 'UPLOADING_DOC' ? 'font-semibold text-[#0B2A4A]' : 'text-[#5F6368]'}>
                            Uploading document to secure storage
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#D9DDE3] flex items-center justify-end gap-3">
                    <GovButton
                      variant="secondary"
                      onClick={() => setOcrResult(null)}
                      type="button"
                      disabled={isSubmitting}
                    >
                      Back
                    </GovButton>
                    <GovButton
                      variant="primary"
                      size="md"
                      loading={isSubmitting}
                      type="submit"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      {submitButtonLabel()}
                    </GovButton>
                  </div>
                </form>
              </GovCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
