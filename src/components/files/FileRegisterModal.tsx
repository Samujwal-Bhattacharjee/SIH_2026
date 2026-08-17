import React, { useState } from 'react';
import { GovModal } from '../common/GovModal';
import { FormField, inputBaseClasses, selectBaseClasses, textareaBaseClasses } from '../common/FormField';
import { GovButton } from '../common/GovButton';
import { casesService, departmentService } from '../../services/api';
import { Department, PriorityLevel, Case, OfficerInfo } from '../../types';
import { MOCK_DEPARTMENTS, MOCK_OFFICERS } from '../../mock/data';

interface FileRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newCase: Case) => void;
}

export const FileRegisterModal: React.FC<FileRegisterModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState<Department>('Land Revenue');
  const [section, setSection] = useState('Title Adjudication Cell');
  const [caseType, setCaseType] = useState('Land Adjudication & Survey');
  const [applicant, setApplicant] = useState('');
  const [origin, setOrigin] = useState('District Collectorate');
  const [assignedOfficer, setAssignedOfficer] = useState('K. R. Mohan (Assistant Commissioner)');
  const [priority, setPriority] = useState<PriorityLevel>('ROUTINE');
  const [statutoryDays, setStatutoryDays] = useState(30);
  const [initialRemarks, setInitialRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a descriptive file subject.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const created = await casesService.createCase({
        title: subject,
        subject,
        department,
        section,
        caseType,
        applicant: applicant || 'Central Inward Desk',
        origin: origin || 'Government Secretariat',
        assignedOfficer,
        priority,
        statutoryDeadlineDays: Number(statutoryDays) || 30,
      });

      onCreated(created);
    } catch (err: any) {
      setError(err.message || 'Failed to register file docket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GovModal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Inward Government File"
      subtitle="Issue official file number, establish SLA deadline, and assign initial desk."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[3px] text-xs text-[#B72025] font-medium">
            {error}
          </div>
        )}

        <FormField label="File Subject / Matter Description" required>
          <textarea
            rows={2}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Scrutiny and administrative sanction for survey boundary rectification in Kadugodi village."
            className={textareaBaseClasses}
            required
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField label="Section / Wing" required>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Title Adjudication Cell"
              className={inputBaseClasses}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Case Type / Category" required>
            <input
              type="text"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              placeholder="e.g. Land Title Dispute"
              className={inputBaseClasses}
            />
          </FormField>

          <FormField label="Receiving / Assigned Officer" required>
            <select
              value={assignedOfficer}
              onChange={(e) => setAssignedOfficer(e.target.value)}
              className={selectBaseClasses}
            >
              {MOCK_OFFICERS.map((o) => (
                <option key={o.id} value={`${o.name} (${o.designation})`}>
                  {o.name} - {o.designation}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Priority Level">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className={selectBaseClasses}
            >
              <option value="ROUTINE">Routine (Normal)</option>
              <option value="URGENT">Urgent (7 Days SLA)</option>
              <option value="IMMEDIATE">Immediate (Top Priority)</option>
            </select>
          </FormField>

          <FormField label="Statutory SLA (Days)">
            <input
              type="number"
              min={1}
              max={180}
              value={statutoryDays}
              onChange={(e) => setStatutoryDays(Number(e.target.value))}
              className={inputBaseClasses}
            />
          </FormField>

          <FormField label="Applicant / Originator">
            <input
              type="text"
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
              placeholder="e.g. District Collectorate"
              className={inputBaseClasses}
            />
          </FormField>
        </div>

        <FormField label="Initial Office Noting / Remarks">
          <textarea
            rows={2}
            value={initialRemarks}
            onChange={(e) => setInitialRemarks(e.target.value)}
            placeholder="Official inward entry remarks..."
            className={textareaBaseClasses}
          />
        </FormField>

        <div className="pt-3 border-t border-[#D9DDE3] flex items-center justify-end gap-3">
          <GovButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </GovButton>
          <GovButton variant="primary" loading={submitting} type="submit">
            Confirm &amp; Issue File Docket
          </GovButton>
        </div>
      </form>
    </GovModal>
  );
};
