import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, PlusCircle, Activity } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { FileRegisterModal } from '../files/FileRegisterModal';

export const GovBreadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const formatSegment = (seg: string) => {
    if (seg === 'dashboard') return language === 'hi' ? 'डैशबोर्ड' : 'Dashboard';
    if (seg === 'tenders') return language === 'hi' ? 'खरीद' : 'Procurement';
    if (seg === 'verification') return language === 'hi' ? 'सत्यापन' : 'Verification';
    if (seg === 'integrity') return language === 'hi' ? 'अखंडता' : 'Integrity';
    if (seg === 'documents') return language === 'hi' ? 'दस्तावेज़' : 'Documents';
    if (seg === 'upload') return language === 'hi' ? 'अपलोड और निष्कर्षण' : 'Upload & Extract';
    if (seg === 'verification-sources') return language === 'hi' ? 'सत्यापन स्रोत' : 'Verification Sources';
    if (seg === 'reports') return language === 'hi' ? 'प्रतिवेदन' : 'Reports';
    if (seg === 'audit-trail' || seg === 'audit-logs') return language === 'hi' ? 'ऑडिट ट्रेल' : 'Audit Trail';
    if (seg === 'settings') return language === 'hi' ? 'सेटिंग्स' : 'Settings';
    if (seg === 'search') return language === 'hi' ? 'खोज' : 'Search';
    if (seg === 'projects' || seg === 'files' || seg === 'cases') return language === 'hi' ? 'निविदाएं' : 'Tenders';
    return seg.toUpperCase();
  };

  return (
    <>
      <div className="bg-[#F0F2F5] border-b border-[#D9DDE3] px-3 sm:px-6 py-1.5 select-none font-sans">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center space-x-1.5 text-[#5F6368] font-medium" aria-label="Breadcrumb">
            <Link to="/dashboard" className="hover:text-[#0B3558] flex items-center space-x-1">
              <Home className="w-3.5 h-3.5 text-[#0B3558]" />
              <span>{language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
            </Link>

            {pathSegments.length === 0 ? (
              <>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <span className="text-[#0B3558] font-bold">
                  {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                </span>
              </>
            ) : (
              pathSegments.map((segment, index) => {
                const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;

                return (
                  <React.Fragment key={url}>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    {isLast ? (
                      <span className="text-[#0B3558] font-bold tracking-tight">
                        {formatSegment(segment)}
                      </span>
                    ) : (
                      <Link to={url} className="hover:text-[#0B3558]">
                        {formatSegment(segment)}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </nav>

          {/* Right Status Counters & Operational Action */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-3 text-[11px] text-[#475569] border-r border-[#CBD2DE] pr-3 font-sans">
              <span>
                Active tenders: <strong className="text-[#0B2A4A] font-mono">04</strong>
              </span>
              <span>•</span>
              <span className="text-[#1D4ED8]">
                Under review: <strong className="font-mono">02</strong>
              </span>
              <span>•</span>
              <span className="text-[#B72025]">
                High risk: <strong className="font-mono">01</strong>
              </span>
              <span>•</span>
              <span className="text-[#D97706]">
                Pending: <strong className="font-mono">01</strong>
              </span>
            </div>

            {/* Create Tender Action */}
            <button
              onClick={() => navigate('/tenders')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#0B3558] hover:bg-[#123F6D] text-white text-xs font-semibold rounded-[3px] shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Tender</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GovBreadcrumb;
