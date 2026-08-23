import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FolderKanban,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { departmentService } from '../services/api';
import { DepartmentInfo, OfficerInfo } from '../types';
import { GovCard } from '../components/common/GovCard';
import { GovButton } from '../components/common/GovButton';
import { inputBaseClasses } from '../components/common/FormField';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [officers, setOfficers] = useState<OfficerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'OFFICERS'>('DEPARTMENTS');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [deptData, offData] = await Promise.all([
          departmentService.getDepartments(),
          departmentService.getOfficers(),
        ]);
        setDepartments(deptData);
        setOfficers(offData);
      } catch (err) {
        console.error('Failed to load department directory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.headOfficer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOfficers = officers.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D9DDE3] pb-3 gap-2 font-sans">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#0B3558] tracking-tight">
            Procuring Departments &amp; Officer Directory
          </h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Directory of Procurement Divisions, Technical Evaluation Desks, and Tender Assessment Authorities.
          </p>
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1 border-b border-[#D9DDE3] pb-1">
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-4 py-2 text-xs font-serif font-bold transition-all cursor-pointer ${
              activeTab === 'DEPARTMENTS'
                ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]'
                : 'text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('OFFICERS')}
            className={`px-4 py-2 text-xs font-serif font-bold transition-all cursor-pointer ${
              activeTab === 'OFFICERS'
                ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]'
                : 'text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            Officer Directory ({officers.length})
          </button>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments or officers..."
            className={`${inputBaseClasses} pl-9 text-xs`}
          />
        </div>
      </div>

      {/* Tab 1: Departments Directory Cards */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepartments.map((dept) => (
            <GovCard
              key={dept.id}
              title={dept.name}
              subtitle={dept.nameHi}
              highlightBorder="navy"
            >
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2 text-[#202124]">
                  <User className="w-4 h-4 text-[#0B2A4A] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#5F6368] block text-[11px]">Head of Department:</span>
                    <strong className="font-semibold text-xs text-[#0B2A4A]">{dept.headOfficer}</strong>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-[#5F6368]">
                  <MapPin className="w-4 h-4 text-[#0B2A4A] flex-shrink-0 mt-0.5" />
                  <span className="text-xs">{dept.location}</span>
                </div>

                <div className="pt-2 border-t border-[#D9DDE3] grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2 bg-[#F8F9FA] rounded-[2px]">
                    <span className="text-[10px] text-[#5F6368] block">ACTIVE FILES</span>
                    <strong className="text-[#0B2A4A] text-xs font-bold">{dept.activeFilesCount}</strong>
                  </div>
                  <div className="p-2 bg-[#F8F9FA] rounded-[2px]">
                    <span className="text-[10px] text-[#5F6368] block">PENDING QUEUE</span>
                    <strong className="text-[#D97706] text-xs font-bold">{dept.pendingFilesCount}</strong>
                  </div>
                  <div className="p-2 bg-[#F8F9FA] rounded-[2px]">
                    <span className="text-[10px] text-[#5F6368] block">SLA ADHERENCE</span>
                    <strong className="text-[#15803D] text-xs font-bold">{dept.slaCompliancePct}%</strong>
                  </div>
                </div>
              </div>
            </GovCard>
          ))}
        </div>
      )}

      {/* Tab 2: Officers Directory Table */}
      {activeTab === 'OFFICERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfficers.map((officer) => (
            <GovCard
              key={officer.id}
              title={officer.name}
              subtitle={officer.designation}
            >
              <div className="space-y-2.5 text-xs">
                <div className="space-y-1 text-[#5F6368]">
                  <div className="flex items-center space-x-1.5 text-[#202124]">
                    <Building2 className="w-3.5 h-3.5 text-[#0B2A4A]" />
                    <span>{officer.department}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#5F6368]">
                    Desk: <strong>{officer.deskNumber}</strong> • Section: {officer.section}
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span>{officer.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{officer.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D9DDE3] flex items-center justify-between font-mono text-[11px]">
                  <span>
                    Active: <strong className="text-[#0B2A4A]">{officer.activeFilesCount} Files</strong>
                  </span>
                  <span>
                    Pending: <strong className="text-[#D97706]">{officer.pendingFilesCount}</strong>
                  </span>
                </div>
              </div>
            </GovCard>
          ))}
        </div>
      )}
    </div>
  );
};
