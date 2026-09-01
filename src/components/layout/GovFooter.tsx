import React from 'react';
import { Link } from 'react-router-dom';

export const GovFooter: React.FC = () => {
  return (
    <footer className="gov-glass-footer text-gray-300 mt-auto select-none font-sans text-xs">
      {/* Upper Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: System Identity */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white tracking-tight leading-snug">
            Government Procurement<br />Intelligence Platform
          </h4>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
            An evidence-first procurement intelligence platform for verifying bidder compliance in petroleum-sector government procurement.
          </p>
        </div>

        {/* Col 2: Procurement Modules */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white">
            SYSTEM MODULES
          </h4>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li>
              <Link to="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/tenders" className="hover:text-white transition-colors">
                Procurement Register
              </Link>
            </li>
            <li>
              <Link to="/verification" className="hover:text-white transition-colors">
                Bidder Verification Hub
              </Link>
            </li>
            <li>
              <Link to="/integrity" className="hover:text-white transition-colors">
                Integrity &amp; Sources
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Policies & Governance */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white">
            WEBSITE POLICIES
          </h4>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Website Policies
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy &amp; Data Security
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Accessibility Statement
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Support */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-white">
            SUPPORT
          </h4>
          <ul className="space-y-2 text-gray-400 text-xs">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Helpdesk &amp; Technical Support
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                MeitY
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                NIC
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Lower Copyright Strip */}
      <div className="border-t border-gray-700/60 py-4 text-[11px] text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          © 2026 Government of India • National Informatics Centre (NIC) • All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
