import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { documentsService } from '../../services/api';
import { DocumentType, DocumentRecord } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: DocumentRecord) => void;
  preselectedCaseId?: string;
}

type UploadStep = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'OCR' | 'METADATA' | 'READY';

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCaseId = 'KA-10482',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState<string>(preselectedCaseId);
  const [documentType, setDocumentType] = useState<DocumentType>('Legal Opinion');
  const [step, setStep] = useState<UploadStep>('IDLE');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a valid PDF or document file to upload.');
      return;
    }

    setError(null);
    setStep('UPLOADING');
    setProgress(25);

    // Staged pipeline visualization
    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgress(50);
      setStep('PROCESSING');

      await new Promise((r) => setTimeout(r, 500));
      setProgress(75);
      setStep('OCR');

      await new Promise((r) => setTimeout(r, 600));
      setProgress(90);
      setStep('METADATA');

      const uploadedDoc = await documentsService.uploadDocument(file, caseId, documentType);

      setProgress(100);
      setStep('READY');
      await new Promise((r) => setTimeout(r, 400));

      onSuccess(uploadedDoc);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Document upload and OCR extraction failed.');
      setStep('IDLE');
    }
  };

  const handleClose = () => {
    if (step !== 'UPLOADING' && step !== 'PROCESSING' && step !== 'OCR' && step !== 'METADATA') {
      setFile(null);
      setStep('IDLE');
      setProgress(0);
      setError(null);
      onClose();
    }
  };

  const isWorking = step !== 'IDLE' && step !== 'READY';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-ink-950/70 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-surface border border-border-hairline shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border-hairline bg-surface flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-4 h-4 text-vermilion" />
            <div>
              <h3 className="font-mono text-xs font-bold text-ink-950 uppercase tracking-tight">
                INGEST GOVERNMENT DOCUMENT // OCR PIPELINE
              </h3>
              <p className="font-mono text-3xs text-ink-500">
                UPLOAD OFFICIAL RECORD FOR AUTOMATED OCR EXTRACTION
              </p>
            </div>
          </div>
          {!isWorking && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-surface-subtle border border-border-hairline text-ink-500 hover:text-ink-900"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-paper">
          {error && (
            <div className="p-3 bg-vermilion-subtle border border-vermilion-border flex items-start space-x-2 text-vermilion font-mono text-2xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Association Fields */}
          <div className="grid grid-cols-2 gap-3 font-mono text-2xs">
            <div>
              <label className="text-3xs text-ink-500 uppercase block mb-1">
                CASE REFERENCE
              </label>
              <input
                type="text"
                value={caseId}
                disabled={isWorking}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="e.g. KA-10482"
                className="w-full px-2.5 py-1.5 bg-surface border border-border-hairline font-mono text-xs text-ink-900 focus:outline-none focus:border-ink-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-3xs text-ink-500 uppercase block mb-1">
                DOCUMENT TYPE
              </label>
              <select
                value={documentType}
                disabled={isWorking}
                onChange={(e) => setDocumentType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-surface border border-border-hairline font-mono text-xs text-ink-900 focus:outline-none focus:border-ink-900 disabled:opacity-50"
              >
                <option value="Application Form">Application Form</option>
                <option value="Legal Opinion">Legal Opinion</option>
                <option value="Identity Proof">Identity Proof</option>
                <option value="Site Inspection Report">Site Inspection Report</option>
                <option value="Clearance Certificate">Clearance Certificate</option>
                <option value="Court Order">Court Order</option>
                <option value="Affidavit">Affidavit</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isWorking && fileInputRef.current?.click()}
            className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              file
                ? 'border-ink-900 bg-surface'
                : 'border-border-subtle bg-surface-subtle/50 hover:bg-surface-subtle hover:border-ink-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={isWorking}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 bg-surface border border-border-hairline flex items-center justify-center text-ink-700">
                <FileText className="w-5 h-5" />
              </div>
              {file ? (
                <div>
                  <span className="font-mono text-xs font-bold text-ink-950 block">
                    {file.name}
                  </span>
                  <span className="font-mono text-3xs text-ink-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR INGESTION
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-mono text-xs font-semibold text-ink-900 block">
                    DRAG & DROP OFFICIAL DOCUMENT HERE, OR BROWSE
                  </span>
                  <span className="font-mono text-3xs text-ink-400">
                    SUPPORTS PDF, SCANNED PNG/JPG (MAX 25 MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress / Step Indicator */}
          {isWorking && (
            <div className="p-4 bg-surface border border-border-hairline space-y-2.5">
              <div className="flex items-center justify-between font-mono text-3xs font-bold">
                <div className="flex items-center space-x-2 text-ink-900">
                  <Loader2 className="w-3.5 h-3.5 text-vermilion animate-spin" />
                  <span>
                    {step === 'UPLOADING' && 'UPLOADING TO SECURE REPOSITORY (01/04)...'}
                    {step === 'PROCESSING' && 'PRE-PROCESSING & IMAGE BINARIZATION (02/04)...'}
                    {step === 'OCR' && 'RUNNING TESSERACT INDIC OCR ENGINE (03/04)...'}
                    {step === 'METADATA' && 'PARSING ENTITIES & REVENUE CROSS-REFERENCES (04/04)...'}
                  </span>
                </div>
                <span className="text-vermilion">{progress}%</span>
              </div>

              <div className="w-full bg-surface-subtle h-2 overflow-hidden border border-border-hairline">
                <div
                  className="bg-vermilion h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-hairline bg-surface flex items-center justify-between">
          <span className="font-mono text-3xs text-ink-500">
            ENCRYPTION: AES-256 GCM AT REST
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              disabled={isWorking}
              className="px-3 py-1.5 border border-border-hairline bg-surface-subtle hover:bg-surface-hover font-mono text-2xs uppercase disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              onClick={handleUpload}
              disabled={isWorking || !file}
              className="px-4 py-1.5 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider flex items-center space-x-1.5 disabled:opacity-50 transition-colors"
            >
              <span>{isWorking ? 'INGESTING...' : 'START OCR INGESTION'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
