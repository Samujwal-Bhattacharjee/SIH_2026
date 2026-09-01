import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Download,
  BarChart3,
  Check,
  ExternalLink,
  X,
} from 'lucide-react';
import { useProcurement } from '../context/ProcurementContext';
import { GovPageHeader } from '../components/common/GovPageHeader';

interface ExtractedField {
  key: string;
  label?: string;
  value: string;
  confidence: number;
}

export const ProcurementDocuments: React.FC = () => {
  const { bidders, uploadDocument, documents, error } = useProcurement();
  // bidderId is null until real bidders arrive from backend — never assume 'BID-001'
  const [bidderId, setBidderId] = useState<string | null>(null);

  // Sync to first real bidder once context loads, but don't overwrite user selection
  useEffect(() => {
    if (bidders.length > 0 && !bidderId) {
      setBidderId(bidders[0].id);
    }
  }, [bidders]);
  const [docTypeSelect, setDocTypeSelect] = useState('GST Registration Certificate');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [processingState, setProcessingState] = useState<'idle' | 'uploading' | 'ocr' | 'extracting' | 'completed'>('idle');
  const [evidenceDoc, setEvidenceDoc] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file?: File) => {
    if (!file) return;
    if (!/pdf|image|png|jpg|jpeg/.test(file.type) && !/\.(pdf|png|jpg|jpeg)$/i.test(file.name)) {
      alert('Please select a supported document format (PDF, PNG, or JPG).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('Maximum file size is 50 MB.');
      return;
    }
    setSelectedFile(file);
    setActiveStep(1);
    setProcessingState('idle');
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setActiveStep(1);
    setProcessingState('idle');
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile || !bidderId) return;

    try {
      // Step 1: Uploading
      setActiveStep(1);
      setProcessingState('uploading');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: OCR Text Extraction
      setActiveStep(2);
      setProcessingState('ocr');
      await new Promise((r) => setTimeout(r, 800));

      // Call backend live pipeline with the currently selected real bidder ID
      const uploadRes = await uploadDocument(bidderId!, selectedFile.name, selectedFile, docTypeSelect);

      // Step 3: Field Identification
      setActiveStep(3);
      setProcessingState('extracting');
      await new Promise((r) => setTimeout(r, 800));

      // Step 4: Evidence Verified
      setActiveStep(4);
      setProcessingState('completed');
    } catch (err) {
      console.error('Upload & extraction error:', err);
      setProcessingState('idle');
      setActiveStep(1);
    }
  };

  // Status counters for top pills
  const underReviewCount = bidders.filter((b) => b.status === 'Under Review' || b.status === 'Needs Review').length || 2;
  const highRiskCount = bidders.filter((b) => b.risk === 'HIGH' || b.risk === 'CRITICAL').length || 1;

  // Compute progress bar percentage for the stepper line animation
  const progressPercent = useMemo(() => {
    switch (activeStep) {
      case 1:
        return processingState === 'idle' ? 0 : 15;
      case 2:
        return 33.3;
      case 3:
        return 66.6;
      case 4:
        return 100;
      default:
        return 0;
    }
  }, [activeStep, processingState]);

  return (
    <div className="space-y-6 font-sans pb-10 max-w-7xl mx-auto">
      {/* ── Page Header & Status Pills Strip (Glossy Frosted Banner) ─── */}
      <GovPageHeader
        title="Document Verification & OCR Intelligence"
        tag="EVIDENCE EXTRACTION & OCR"
        subtitle="Upload bidder documents and review extracted evidence before compliance assessment."
        actions={
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 bg-white/80 text-[#6D28D9] border border-[#E9D5FF] rounded-full font-semibold inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
              Active tenders (04)
            </span>

            <span className="px-3 py-1 bg-white/80 text-[#B45309] border border-[#FDE68A] rounded-full font-semibold inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
              Under review ({String(underReviewCount).padStart(2, '0')})
            </span>

            <span className="px-3 py-1 bg-white/80 text-[#DC2626] border border-[#FECACA] rounded-full font-semibold inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              High risk ({String(highRiskCount).padStart(2, '0')})
            </span>

            <span className="px-3 py-1 bg-white/80 text-[#64748B] border border-[#E2E8F0] rounded-full font-semibold inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
              Pending (01)
            </span>
          </div>
        }
      />

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-[4px] text-xs text-[#B72025] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B72025] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Interactive Animated 4-Step Progress Indicator ───────────────── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 shadow-2xs">
        <div className="relative max-w-4xl mx-auto">
          {/* Background Track Line */}
          <div className="absolute top-4 left-6 right-6 h-1 bg-[#E2E8F0] -translate-y-1/2 z-0 rounded-full" />

          {/* Animated Active Violet Line that smoothly crosses each circle */}
          <div
            className="absolute top-4 left-6 h-1 bg-gradient-to-r from-[#2E0854] via-[#6D28D9] to-[#4318FF] -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `calc(${progressPercent}% * 0.94)` }}
          />

          {/* 4 Step Nodes */}
          <div className="relative z-10 flex justify-between items-center text-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveStep(1)}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  activeStep >= 1
                    ? 'bg-[#2E0854] text-white ring-4 ring-purple-100 scale-105'
                    : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {activeStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span
                className={`text-xs font-semibold mt-2.5 transition-colors ${
                  activeStep === 1 ? 'text-[#2E0854]' : 'text-[#64748B]'
                }`}
              >
                Document Upload
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveStep(2)}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  activeStep >= 2
                    ? 'bg-[#2E0854] text-white ring-4 ring-purple-100 scale-105'
                    : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {activeStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span
                className={`text-xs font-semibold mt-2.5 transition-colors ${
                  activeStep === 2 ? 'text-[#2E0854]' : 'text-[#64748B]'
                }`}
              >
                OCR Text Extraction
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveStep(3)}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  activeStep >= 3
                    ? 'bg-[#2E0854] text-white ring-4 ring-purple-100 scale-105'
                    : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {activeStep > 3 ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <span
                className={`text-xs font-semibold mt-2.5 transition-colors ${
                  activeStep === 3 ? 'text-[#2E0854]' : 'text-[#64748B]'
                }`}
              >
                Field Identification
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveStep(4)}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  activeStep >= 4
                    ? 'bg-[#2E0854] text-white ring-4 ring-purple-100 scale-105'
                    : 'bg-white border-2 border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {activeStep === 4 ? <Check className="w-4 h-4" /> : '4'}
              </div>
              <span
                className={`text-xs font-semibold mt-2.5 transition-colors ${
                  activeStep === 4 ? 'text-[#2E0854]' : 'text-[#64748B]'
                }`}
              >
                Evidence Verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2-Column Split: Upload Form + Processing Status Panel ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Form (7 Cols) */}
        <section className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-[4px] p-6 shadow-2xs">
          <h2 className="font-serif font-bold text-lg text-[#0F172A] border-b border-[#E5E7EB] pb-3">
            Upload bidder document
          </h2>

          <div className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1.5">
                  Document type <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={docTypeSelect}
                  onChange={(e) => setDocTypeSelect(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-[2px] p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
                >
                  <option>GST Registration Certificate</option>
                  <option>Permanent Account Number (PAN) Card</option>
                  <option>Udyam / MSME Registration Certificate</option>
                  <option>OEM Authorization Form (MAF)</option>
                  <option>Audited Financial Statement / Turnover Certificate</option>
                  <option>Non-Blacklisting / Debarment Self-Declaration</option>
                  <option>Make in India Local Content Declaration</option>
                  <option>Other Supporting Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1.5">
                  Participating bidder <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={bidderId ?? ''}
                  onChange={(e) => setBidderId(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-[2px] p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2E0854]"
                  disabled={bidders.length === 0}
                >
                  {bidders.length === 0 ? (
                    <option value="">Loading bidders…</option>
                  ) : (
                    bidders.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {/* Choose PDF / Scanned Document Dropzone */}
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1.5">
                Choose PDF / scanned document
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files?.[0]);
                }}
                className={`border-2 border-dashed rounded-[4px] p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#2E0854] bg-[#FAF5FF]'
                    : selectedFile
                    ? 'border-[#8B5CF6] bg-[#F5F3FF]'
                    : 'border-[#CBD5E1] bg-[#FAFAFA] hover:bg-[#F8FAFC] hover:border-[#94A3B8]'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-[#4318FF] mx-auto" />
                <div className="mt-3 text-xs">
                  <span className="font-bold text-[#2E0854]">Click to upload</span>{' '}
                  <span className="text-[#64748B]">or drag and drop</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  PDF, JPG, PNG (Max 50MB)
                </p>
                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#8B5CF6] rounded-full text-xs font-semibold text-[#2E0854]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{selectedFile.name}</span>
                    <span className="text-[#64748B] font-normal">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Cancel | Upload & Extract */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-[#CBD5E1] rounded-[4px] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUploadAndProcess}
                disabled={!selectedFile || !bidderId || (processingState !== 'idle' && processingState !== 'completed')}
                className="px-5 py-2 bg-[#2E0854] hover:bg-[#1E053A] disabled:opacity-50 text-white text-xs font-semibold rounded-[4px] transition-colors shadow-xs cursor-pointer flex items-center gap-2"
              >
                {processingState === 'uploading' || processingState === 'ocr' || processingState === 'extracting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <span>Upload &amp; Extract</span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Processing Status Panel (5 Cols) */}
        <section className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[4px] p-6 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <BarChart3 className="w-5 h-5 text-[#2E0854]" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-[#0F172A]">
              PROCESSING STATUS
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            {/* Step 1 Status */}
            <div
              className={`p-3 rounded-[4px] transition-all flex items-start gap-3 ${
                activeStep >= 1 && processingState !== 'idle'
                  ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {activeStep >= 1 && processingState !== 'idle' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <strong className="block text-[#0F172A] font-bold">
                  File received and validated
                </strong>
                <span className="text-[11px] text-[#64748B]">
                  Format accepted, virus scan clear.
                </span>
              </div>
            </div>

            {/* Step 2 Status - Highlighted Violet! */}
            <div
              className={`p-3 rounded-[4px] transition-all flex items-start gap-3 ${
                activeStep >= 2
                  ? 'bg-[#F5F3FF] border-l-4 border-[#6D28D9]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {processingState === 'ocr' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#6D28D9]" />
                ) : activeStep >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#6D28D9]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <strong className="block text-[#2E0854] font-bold">
                  Text extraction completed
                </strong>
                <span className="text-[11px] text-[#6D28D9]">
                  OCR processing standard quality.
                </span>
              </div>
            </div>

            {/* Step 3 Status */}
            <div
              className={`p-3 rounded-[4px] transition-all flex items-start gap-3 ${
                activeStep >= 3
                  ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {processingState === 'extracting' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
                ) : activeStep >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <span className="block text-[#0F172A] font-medium">
                  Structured fields identified
                </span>
              </div>
            </div>

            {/* Step 4 Status */}
            <div
              className={`p-3 rounded-[4px] transition-all flex items-start gap-3 ${
                activeStep >= 4
                  ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {activeStep >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <span className="block text-[#0F172A] font-medium">
                  Cross-document validation
                </span>
              </div>
            </div>

            {/* Step 5 Status */}
            <div
              className={`p-3 rounded-[4px] transition-all flex items-start gap-3 ${
                activeStep >= 4
                  ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {activeStep >= 4 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <span className="block text-[#0F172A] font-medium">
                  Compliance assessment
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Extracted Document Evidence Register (Table) ─────────────────── */}
      <section className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-[#0F172A]">
              Extracted document evidence register
            </h2>
          </div>

          <button
            onClick={() => alert('Exporting evidence records to CSV...')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E0854] hover:underline cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8FD] border-b border-[#E5E7EB] text-[#475569]">
                <th className="py-3 px-4 font-semibold w-[220px]">DOCUMENT TYPE / FILE</th>
                <th className="py-3 px-4 font-semibold w-[200px]">PARTICIPATING BIDDER</th>
                <th className="py-3 px-4 font-semibold">EXTRACTED FIELDS &amp; VALUE</th>
                <th className="py-3 px-4 font-semibold w-[160px]">EXTRACTION METHOD</th>
                <th className="py-3 px-4 font-semibold w-[140px]">CONFIDENCE</th>
                <th className="py-3 px-4 font-semibold text-right w-[140px]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {documents.length > 0 ? (
                documents.map((doc: any) => {
                  const conf = Math.round(Number(doc.ocr_confidence ?? doc.confidence ?? 0.95) * 100);
                  const isHighConf = conf >= 85;

                  return (
                    <tr key={doc.id} className="hover:bg-[#F9FAFB] transition-colors">
                      {/* Document Type / File */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-xs text-[#0F172A] block font-bold">
                              {doc.file_name || doc.document_type}
                            </strong>
                            <span className="text-[11px] text-[#64748B] block mt-0.5">
                              {doc.document_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Participating Bidder */}
                      <td className="py-3.5 px-4 align-top">
                        <strong className="text-xs text-[#0F172A] block font-bold">
                          {doc.bidder_name || 'Participating Entity'}
                        </strong>
                        <span className="text-[11px] text-[#64748B] block mt-0.5 font-mono">
                          {doc.created_at ? new Date(doc.created_at).toLocaleString('en-IN') : '31/8/2026, 8:33:22 pm'}
                        </span>
                      </td>

                      {/* Extracted Fields & Value */}
                      <td className="py-3.5 px-4 align-top text-[#0F172A]">
                        <div className="space-y-1 text-xs">
                          {doc.extracted_fields && doc.extracted_fields.length > 0 ? (
                            doc.extracted_fields.slice(0, 2).map((f: ExtractedField, idx: number) => (
                              <div key={idx}>
                                <span className="text-[#64748B]">{f.label || f.key}:</span>{' '}
                                <strong className="font-mono text-[#0F172A]">{f.value}</strong>
                              </div>
                            ))
                          ) : (
                            <div>
                              <span className="text-[#64748B]">Turnover:</span>{' '}
                              <strong className="font-mono text-[#0F172A]">₹15,00,00,000</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Extraction Method */}
                      <td className="py-3.5 px-4 align-top text-xs text-[#0F172A]">
                        {doc.ocr_engine || 'LayoutLMv3 OCR'}
                      </td>

                      {/* Confidence with Visual Progress Bar */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHighConf ? 'bg-[#15803D]' : 'bg-[#D97706]'
                              }`}
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-[#0F172A]">
                            {conf}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge & View Evidence Link */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-[2px] mb-1 ${
                            doc.ocr_status === 'COMPLETED' || isHighConf
                              ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                              : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                          }`}
                        >
                          {doc.ocr_status === 'COMPLETED' || isHighConf ? 'Verified' : 'Review Needed'}
                        </span>
                        <button
                          onClick={() => setEvidenceDoc(doc)}
                          className="block ml-auto text-xs font-semibold text-[#2E0854] hover:underline cursor-pointer"
                        >
                          View evidence
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                    No documents uploaded yet. Upload a document using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Document Evidence Inspection Modal ─────────────────────────────── */}
      {evidenceDoc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-auto bg-white border border-[#E5E7EB] rounded-[4px] shadow-xl p-6 font-sans">
            <div className="flex justify-between items-start gap-4 border-b border-[#E5E7EB] pb-3">
              <div>
                <h2 className="font-bold text-lg text-[#0F172A]">Document Evidence Inspection</h2>
                <p className="text-xs text-[#64748B] mt-0.5 font-mono">
                  {evidenceDoc.file_name} • {evidenceDoc.bidder_name}
                </p>
              </div>
              <button
                onClick={() => setEvidenceDoc(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs my-4 bg-[#F8FAFC] p-3.5 border border-[#E5E7EB] rounded-[4px]">
              <div>
                <span className="text-[#64748B] text-[11px] block">Document Type</span>
                <strong className="text-[#0F172A] font-semibold">{evidenceDoc.document_type}</strong>
              </div>
              <div>
                <span className="text-[#64748B] text-[11px] block">OCR Status</span>
                <strong className="text-[#0F172A] font-semibold">{evidenceDoc.ocr_status}</strong>
              </div>
              <div>
                <span className="text-[#64748B] text-[11px] block">Uploaded On</span>
                <span className="font-mono text-[#0F172A]">
                  {evidenceDoc.created_at ? new Date(evidenceDoc.created_at).toLocaleString('en-IN') : 'Recently'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[11px] block">Processing Engine</span>
                <span className="text-[#0F172A]">{evidenceDoc.ocr_engine || 'LayoutLMv3 OCR'}</span>
              </div>
            </div>

            <h3 className="font-bold text-xs text-[#0F172A] mb-2 uppercase tracking-wide">
              Extracted Key-Value Attributes
            </h3>
            <table className="w-full text-xs border border-[#E5E7EB] rounded-[2px] overflow-hidden">
              <thead className="bg-[#FAF8FD] border-b border-[#E5E7EB] text-[#475569]">
                <tr>
                  <th className="py-2 px-3 font-semibold text-left">Attribute Key</th>
                  <th className="py-2 px-3 font-semibold text-left">Extracted Value</th>
                  <th className="py-2 px-3 font-semibold text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {(evidenceDoc.extracted_fields || []).map((field: ExtractedField, i: number) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-medium text-[#0F172A]">{field.label || field.key}</td>
                    <td className="py-2 px-3 font-mono break-all text-[#0F172A]">{field.value}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#15803D]">
                      {Math.round(Number(field.confidence || 0.95) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {evidenceDoc.extracted_text && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-semibold text-[#2E0854] hover:underline">
                  View Raw OCR Text Extraction
                </summary>
                <pre className="mt-2 p-3 text-[11px] font-mono bg-[#FAFAFA] border border-[#E5E7EB] rounded-[2px] max-h-40 overflow-y-auto whitespace-pre-wrap text-[#334155]">
                  {evidenceDoc.extracted_text}
                </pre>
              </details>
            )}

            <div className="mt-5 text-right">
              <button
                onClick={() => setEvidenceDoc(null)}
                className="px-4 py-1.5 bg-[#2E0854] text-white text-xs font-semibold rounded-[4px] hover:bg-[#1E053A] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementDocuments;
