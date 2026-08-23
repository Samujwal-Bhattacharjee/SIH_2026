import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, HelpCircle, FileCheck, ExternalLink } from 'lucide-react';
import { Emblem } from '../../assets/Emblem';
import { useLanguage } from '../../context/LanguageContext';

export const GovFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#071A2E] text-white border-t-4 border-[#0B2A4A] mt-auto select-none font-sans">
      {/* Upper Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        {/* Col 1: System Identity */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <Emblem size={36} monochrome />
            <div>
              <h4 className="font-serif font-bold text-sm tracking-tight text-white">
                Government Procurement Intelligence Platform
              </h4>
              <p className="text-[10px] text-gray-300">
                Government Procurement • Prototype / Demonstration • SIH26100
              </p>
            </div>
          </div>
          <p className="text-gray-300 text-[11px] leading-relaxed">
            AI-assisted bid compliance verification and decision-support platform for government procurement. Automated OCR extraction, sandbox source validation, and evidence-backed compliance analysis.
          </p>
        </div>

        {/* Col 2: Procurement Modules */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FF9933] border-b border-gray-700 pb-1">
            System Modules
          </h4>
          <ul className="space-y-1.5 text-gray-300">
            <li>
              <Link to="/dashboard" className="hover:text-white hover:underline">
                Procurement Dashboard
              </Link>
            </li>
            <li>
              <Link to="/tenders" className="hover:text-white hover:underline">
                Tender Register
              </Link>
            </li>
            <li>
              <Link to="/verification/BID-001" className="hover:text-white hover:underline">
                Bidder Verification
              </Link>
            </li>
            <li>
              <Link to="/documents" className="hover:text-white hover:underline">
                Document Verification
              </Link>
            </li>
            <li>
              <Link to="/verification/BID-002" className="hover:text-white hover:underline">
                Compliance Assessment
              </Link>
            </li>
            <li>
              <Link to="/verification-sources" className="hover:text-white hover:underline">
                Verification Sources
              </Link>
            </li>
            <li>
              <Link to="/reports" className="hover:text-white hover:underline">
                Reports
              </Link>
            </li>
            <li>
              <Link to="/audit-trail" className="hover:text-white hover:underline">
                Audit Trail
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Policies & Governance */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FF9933] border-b border-gray-700 pb-1">
            Website Policies
          </h4>
          <ul className="space-y-1.5 text-gray-300">
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Privacy &amp; Data Security
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Accessibility Statement (GIGW)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Terms of Use (Government Internal)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Hyperlinking Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Data Usage &amp; Source Attribution
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Support & Prototype Attribution */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FF9933] border-b border-gray-700 pb-1">
            Helpdesk &amp; Technical Support
          </h4>
          <div className="space-y-2 text-gray-300 text-[11px]">
            <div className="flex items-start space-x-2">
              <Phone className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
              <span>Prototype Support: Helpdesk Desk (Internal Demo)</span>
            </div>
            <div className="flex items-start space-x-2">
              <Mail className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
              <span>Technical Support: Prototype Evaluation Mode</span>
            </div>
            <div className="flex items-start space-x-2">
              <Shield className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
              <span>SIH26100 • GeM Bid Compliance Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Copyright & Prototype Strip */}
      <div className="bg-[#040E1A] border-t border-gray-800 py-3 text-[11px] text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            © 2026 Government of India • National Informatics Centre (NIC) • All Rights Reserved.
          </div>
          <div className="text-[10px] text-[#FF9933] font-medium">
            Government Procurement • Prototype / Demonstration • SIH26100
          </div>
        </div>
      </div>
    </footer>
  );
};
