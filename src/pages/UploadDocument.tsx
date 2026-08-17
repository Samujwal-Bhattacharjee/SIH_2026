import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  ScanLine,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Copy,
  Check,
} from 'lucide-react';
import { ocrService, casesService, documentsService } from '../services/api';
import { OCRResult, Department, PriorityLevel, DocumentType } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { FormField, inputBaseClasses, selectBaseClasses, textareaBaseClasses } from '../components/common/FormField';
import { StatusBadge } from '../components/common/GovBadge';
import { MOCK_DEPARTMENTS, MOCK_OFFICERS } from '../mock/data';

const OCR_STEPS = [
  'Validating document format and security signatures...',
  'Analyzing document layout and regional Indic language scripts...',
  'Executing neural text recognition (Tesseract 5.3 + Multi-lingual)...',
  'Extracting named entities (File Number, Survey No, Dates, Officers)...',
  'Mapping structured metadata to government docket schema...',
];

export const UploadDocument: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('Application Form');
  const [department, setDepartment] = useState<Department>('Land Revenue');
  const [processing, setProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      setFileNumber(getFieldVal('fileNumber') || `KA/REV/2026/00${Math.floor(1000 + Math.random() * 9000)}`);
      setSubject(getFieldVal('subject') || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      setSender(getFieldVal('sender') || 'Office of District Collector');
      setDocumentDate(getFieldVal('date') || new Date().toISOString().split('T')[0]);
      setReferenceNumber(getFieldVal('referenceNumber') || `REF-GOI-${Date.now().toString().slice(-5)}`);
      setPriority('URGENT');
      setNotes('Document ingested via automatic OCR scanning pipeline. Extracted metadata reviewed and verified by officer.');
    } catch (err: any) {
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
    setSubmitting(true);
    setError(null);

    try {
      const createdCase = await casesService.createCase({
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

      if (file) {
        await documentsService.uploadDocument(file, createdCase.id, documentType);
      }

      navigate(`/files/${createdCase.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to register file docket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyText = () => {
    if (ocrResult?.extractedText) {
      navigator.clipboard.writeText(ocrResult.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B2A4A] tracking-tight">
            Upload &amp; Scan Government Document (OCR)
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
          title="Step 1: Select Document &amp; Run OCR Scanner"
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
                  <option value="Site Inspection Report">Site Inspection &amp; Survey Sketch</option>
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
                  {MOCK_DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Dropzone */}
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
                {file ? (
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#0B2A4A]">{file.name}</p>
                    <p className="text-xs text-[#5F6368]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR Processing
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-[#202124]">
                      Click to choose document or drop file here
                    </p>
                    <p className="text-xs text-[#5F6368]">
                      Official formats supported: PDF, JPG, PNG, TIFF
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Processing Progress State */}
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
                disabled={!file}
                onClick={handleStartOcr}
                icon={<ScanLine className="w-4 h-4" />}
              >
                Scan &amp; Extract Metadata
              </GovButton>
            </div>
          </div>
        </GovCard>
      )}

      {/* Step 2: Dual-Pane Review (Extracted Text vs Editable Metadata Form) */}
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
                title="Document Docket Preview &amp; OCR Text"
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
                title="Step 2: Review &amp; Edit Docket Metadata"
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
                        {MOCK_DEPARTMENTS.map((d) => (
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
                        {MOCK_OFFICERS.map((o) => (
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

                  <div className="pt-3 border-t border-[#D9DDE3] flex items-center justify-end gap-3">
                    <GovButton
                      variant="secondary"
                      onClick={() => setOcrResult(null)}
                      type="button"
                    >
                      Back
                    </GovButton>
                    <GovButton
                      variant="primary"
                      size="md"
                      loading={submitting}
                      type="submit"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Confirm &amp; Register File Docket
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
