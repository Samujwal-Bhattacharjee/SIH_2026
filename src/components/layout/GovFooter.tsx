import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Mail, HelpCircle, FileCheck, ExternalLink } from 'lucide-react';
import { Emblem } from '../../assets/Emblem';
import { useLanguage } from '../../context/LanguageContext';

export const GovFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#071A2E] text-white border-t-4 border-[#0B2A4A] mt-auto select-none">
      {/* Upper Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        {/* Col 1: System Identity */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2.5">
            <Emblem size={36} monochrome />
            <div>
              <h4 className="font-serif font-bold text-sm tracking-tight text-white">
                Government of India
              </h4>
              <p className="text-[10px] text-gray-300">
                Department of Administrative Reforms &amp; Public Grievances
              </p>
            </div>
          </div>
          <p className="text-gray-300 text-[11px] leading-relaxed">
            Centralized e-File movement, statutory SLA tracking, OCR document ingestion, and administrative delay intelligence platform.
          </p>
        </div>

        {/* Col 2: Administrative Modules */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FF9933] border-b border-gray-700 pb-1">
            System Modules
          </h4>
          <ul className="space-y-1.5 text-gray-300">
            <li>
              <Link to="/dashboard" className="hover:text-white hover:underline">
                Executive Dashboard
              </Link>
            </li>
            <li>
              <Link to="/files" className="hover:text-white hover:underline">
                State File Register &amp; Dockets
              </Link>
            </li>
            <li>
              <Link to="/pending" className="hover:text-white hover:underline">
                Pending Files &amp; SLA Breaches
              </Link>
            </li>
            <li>
              <Link to="/documents/upload" className="hover:text-white hover:underline">
                OCR Document Digitization
              </Link>
            </li>
            <li>
              <Link to="/intelligence" className="hover:text-white hover:underline">
                Administrative Bottleneck Intelligence
              </Link>
            </li>
            <li>
              <Link to="/reports" className="hover:text-white hover:underline">
                Disposal &amp; SLA Compliance Reports
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
                Hyperlinking Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Privacy Policy &amp; Data Security
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Terms of Service (Government Internal)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Accessibility Statement (GIGW Compliant)
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:underline">
                Copyright &amp; Source Attribution
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Support & National Informatics Centre */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FF9933] border-b border-gray-700 pb-1">
            Helpdesk &amp; Technical Support
          </h4>
          <div className="space-y-2 text-gray-300 text-[11px]">
            <div className="flex items-start space-x-2">
              <Phone className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
              <span>National Toll-Free Helpline: 1800-111-GOV (09:00 - 18:00 IST)</span>
            </div>
            <div className="flex items-start space-x-2">
              <Mail className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
              <span>Support Desk: support-goip@gov.in</span>
            </div>
            <div className="flex items-start space-x-2">
              <Shield className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
              <span>NIC National Data Centre Hosted</span>
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
            {t('footer.prototypeNotice')}
          </div>
        </div>
      </div>
    </footer>
  );
};
