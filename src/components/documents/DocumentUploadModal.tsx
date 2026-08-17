import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { GovModal } from '../common/GovModal';
import { FormField, selectBaseClasses } from '../common/FormField';
import { GovButton } from '../common/GovButton';
import { documentsService } from '../../services/api';
import { DocumentRecord, DocumentType } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onUploadSuccess: (newDoc: DocumentRecord) => void;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'Application Form',
  'Legal Opinion',
  'Identity Proof',
  'Site Inspection Report',
  'Clearance Certificate',
  'Court Order',
  'Affidavit',
  'Gazette Notification',
  'Office Note Sheet',
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  caseId,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('Application Form');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a valid document file to upload.');
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const doc = await documentsService.uploadDocument(file, caseId, documentType);
      onUploadSuccess(doc);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Document upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <GovModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload Document to File Docket: ${caseId}`}
      subtitle="Attach official gazette, court orders, inspection notes, or citizen applications."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[3px] text-xs text-[#B72025] font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormField label="Document Classification / Type" required>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className={selectBaseClasses}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          className={`p-6 border-2 border-dashed rounded-[4px] text-center transition-colors ${
            isDragOver
              ? 'border-[#0B2A4A] bg-[#F0F5FA]'
              : 'border-[#CBD2DE] bg-[#F8F9FA] hover:bg-[#F0F2F5]'
          }`}
        >
          <input
            type="file"
            id="doc-file-input"
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
          <label htmlFor="doc-file-input" className="cursor-pointer block space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#E6EEF5] text-[#0B2A4A] flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            {file ? (
              <div className="space-y-1">
                <p className="font-bold text-xs text-[#0B2A4A]">{file.name}</p>
                <p className="text-[11px] text-[#5F6368]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold text-xs text-[#202124]">
                  Click to select file or drag and drop
                </p>
                <p className="text-[11px] text-[#5F6368]">
                  Supported formats: PDF, JPG, PNG, TIFF (Max size 50 MB)
                </p>
              </div>
            )}
          </label>
        </div>

        <div className="p-3 bg-[#F0F5FA] border border-[#CBD2DE] rounded-[3px] text-xs text-[#0B2A4A] space-y-1">
          <div className="font-semibold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Automatic OCR Scanning Pipeline</span>
          </div>
          <p className="text-[11px] text-[#5F6368]">
            Uploaded documents are automatically queued for optical text extraction and named entity mapping.
          </p>
        </div>

        <div className="pt-3 border-t border-[#D9DDE3] flex items-center justify-end gap-3">
          <GovButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </GovButton>
          <GovButton variant="primary" loading={uploading} type="submit" disabled={!file}>
            Upload &amp; Attach Document
          </GovButton>
        </div>
      </form>
    </GovModal>
  );
};
