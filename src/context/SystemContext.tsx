import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS' | 'ERROR' | 'NEW_TENDER' | 'NEW_BIDDER' | 'DOCUMENT_UPLOADED' | 'OCR_COMPLETED' | 'COMPLIANCE_ALERT' | 'REVIEW_REQUIRED';
  severity?: string;
  relatedEntityId?: string;
  timestamp: string;
  link?: string;
  read: boolean;
}

interface SystemContextType {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  alerts: SystemAlert[];
  unreadAlertCount: number;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  addAlert: (alert: Omit<SystemAlert, 'id' | 'read' | 'timestamp'>) => void;
  isStatusDrawerOpen: boolean;
  setIsStatusDrawerOpen: (open: boolean) => void;
  systemSubsystems: {
    name: string;
    status: 'OPERATIONAL' | 'DEGRADED' | 'STANDBY';
    latencyMs: number;
    description: string;
  }[];
}

const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    title: 'High Risk SLA Breach Predicted',
    message: 'Case KA-10482 (Land Revenue) has exceeded 5 days in Legal Review queue. Predicted delay: +6.8 days.',
    type: 'CRITICAL',
    timestamp: '10 mins ago',
    link: '/cases/KA-10482',
    read: false,
  },
  {
    id: 'alt-2',
    title: 'Process Bottleneck Detected',
    message: 'Legal Review stage is running at 170% above baseline duration across 1,240 active files.',
    type: 'WARNING',
    timestamp: '25 mins ago',
    link: '/workflow',
    read: false,
  },
  {
    id: 'alt-3',
    title: 'OCR Ingestion Pipeline Ready',
    message: 'High Court dismissal order for KA-10482 indexed with 98% confidence score.',
    type: 'INFO',
    timestamp: '1 hour ago',
    link: '/documents',
    read: true,
  },
];

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatusDrawerOpen, setIsStatusDrawerOpen] = useState(false);
  
  const [alerts, setAlerts] = useState<SystemAlert[]>(() => {
    const saved = localStorage.getItem('system-alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  useEffect(() => {
    try { localStorage.setItem('system-alerts', JSON.stringify(alerts)); } catch { /* ignore */ }
  }, [alerts]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const markAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const addAlert = (newAlert: Omit<SystemAlert, 'id' | 'read' | 'timestamp'>) => {
    const alert: SystemAlert = {
      ...newAlert,
      id: `alt-${Date.now()}`,
      read: false,
      timestamp: 'Just now'
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  const systemSubsystems = [
    {
      name: 'DATA INGESTION PIPELINE',
      status: 'OPERATIONAL' as const,
      latencyMs: 18,
      description: 'Active event stream synchronizer (10,482 cases indexed)',
    },
    {
      name: 'PM4Py PROCESS MINING ENGINE',
      status: 'OPERATIONAL' as const,
      latencyMs: 42,
      description: 'Alpha Miner & Inductive Miner graph discovery active',
    },
    {
      name: 'XGBOOST SLA RISK ENGINE',
      status: 'OPERATIONAL' as const,
      latencyMs: 29,
      description: 'Delay prediction model v2.4 with SHAP feature attribution',
    },
    {
      name: 'DOCUMENT OCR & METADATA PARSER',
      status: 'OPERATIONAL' as const,
      latencyMs: 65,
      description: 'Tesseract 5.3 + Multi-lingual Indic layout recognizer',
    },
    {
      name: 'DISCRETE EVENT SIMULATION ENGINE',
      status: 'OPERATIONAL' as const,
      latencyMs: 51,
      description: 'Stochastic workflow scenario replay & intervention solver',
    },
  ];

  return (
    <SystemContext.Provider
      value={{
        isSearchOpen,
        setIsSearchOpen,
        openSearch,
        closeSearch,
        alerts,
        unreadAlertCount,
        markAlertAsRead,
        markAllAlertsAsRead,
        addAlert,
        isStatusDrawerOpen,
        setIsStatusDrawerOpen,
        systemSubsystems,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
