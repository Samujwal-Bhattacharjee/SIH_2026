import React, { useState } from 'react';
import { GovModal } from '../common/GovModal';
import { FormField, selectBaseClasses, textareaBaseClasses } from '../common/FormField';
import { GovButton } from '../common/GovButton';
import { casesService, departmentService } from '../../services/api';
import { Case, CaseStage, OfficerInfo } from '../../types';
import { MOCK_OFFICERS } from '../../mock/data';

interface FileForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: Case;
  onForwarded: (updatedCase: Case) => void;
}

export const FileForwardModal: React.FC<FileForwardModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onForwarded,
}) => {
  const [officers, setOfficers] = useState<OfficerInfo[]>(MOCK_OFFICERS);
  const [selectedOfficer, setSelectedOfficer] = useState(
    MOCK_OFFICERS[0] ? `${MOCK_OFFICERS[0].name} (${MOCK_OFFICERS[0].designation})` : ''
  );
  const [targetDesk, setTargetDesk] = useState('DESK-LEGAL-01');
  const [targetStage, setTargetStage] = useState<CaseStage>('Legal Review');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    departmentService.getOfficers().then((o) => {
      if (o && o.length > 0) {
        setOfficers(o);
        setSelectedOfficer(`${o[0].name} (${o[0].designation})`);
        setTargetDesk(o[0].deskNumber || 'DESK-LEGAL-01');
      }
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError('Official noting / remarks are required when forwarding a file docket.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const updated = await casesService.forwardCase(
        caseItem.id,
        selectedOfficer,
        targetDesk,
        remarks,
        targetStage
      );
      onForwarded(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to forward file.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GovModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Forward File Docket: ${caseItem.fileNumber || caseItem.id}`}
      subtitle="Transfer file custody to another officer/desk with official note sheet entry."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[3px] text-xs text-[#B72025] font-medium">
            {error}
          </div>
        )}

        <div className="p-3 bg-[#FAF8F2] border border-[#D9D4C7] rounded-[3px] space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[#5F6368]">Current Officer:</span>
            <span className="font-bold text-[#0B2A4A]">{caseItem.assignedOfficer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5F6368]">Current Stage:</span>
            <span className="font-semibold text-[#202124]">{caseItem.currentStage}</span>
          </div>
        </div>

        <FormField label="Forward To (Target Officer)" required>
          <select
            value={selectedOfficer}
            onChange={(e) => {
              setSelectedOfficer(e.target.value);
              const found = officers.find((o) => `${o.name} (${o.designation})` === e.target.value);
              if (found) setTargetDesk(found.deskNumber);
            }}
            className={selectBaseClasses}
          >
            {officers.map((o) => (
              <option key={o.id} value={`${o.name} (${o.designation})`}>
                {o.name} — {o.designation} ({o.department})
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Workflow Stage Transition" required>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as CaseStage)}
              className={selectBaseClasses}
            >
              <option value="Document Verification">Document Verification</option>
              <option value="Department Assignment">Department Assignment</option>
              <option value="Officer Review">Officer Review</option>
              <option value="Legal Review">Legal Review</option>
              <option value="Approval">Approval Stage</option>
              <option value="Closure">Closure / Disposal</option>
            </select>
          </FormField>

          <FormField label="Target Desk Identifier" required>
            <input
              type="text"
              value={targetDesk}
              onChange={(e) => setTargetDesk(e.target.value)}
              className={selectBaseClasses}
            />
          </FormField>
        </div>

        <FormField label="Official Note Sheet Remarks (Mandatory)" required>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter official reasoning, directions, or queries for the recipient officer..."
            className={textareaBaseClasses}
            required
          />
        </FormField>

        <div className="pt-3 border-t border-[#D9DDE3] flex items-center justify-end gap-3">
          <GovButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </GovButton>
          <GovButton variant="primary" loading={submitting} type="submit">
            Forward File &amp; Record Movement
          </GovButton>
        </div>
      </form>
    </GovModal>
  );
};
