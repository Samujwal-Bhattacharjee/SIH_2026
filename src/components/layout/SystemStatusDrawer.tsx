import React from 'react';
import { X, CheckCircle2, Cpu, Activity, Database, FileText, GitPullRequest } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export const SystemStatusDrawer: React.FC = () => {
  const { isStatusDrawerOpen, setIsStatusDrawerOpen, systemSubsystems } = useSystem();

  if (!isStatusDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsStatusDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-surface border-l border-border-hairline shadow-2xl flex flex-col z-50">
        {/* Header */}
        <div className="p-4 border-b border-border-hairline bg-surface flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-vermilion" />
            <div>
              <h3 className="font-mono text-xs font-bold text-ink-900 tracking-wider uppercase">
                GOIP / SUBSYSTEM HEALTH
              </h3>
              <p className="font-mono text-3xs text-ink-500">
                ALL 5 CORE INTELLIGENCE ENGINES OPERATIONAL
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsStatusDrawerOpen(false)}
            className="p-1 hover:bg-surface-subtle border border-border-hairline text-ink-500 hover:text-ink-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-paper">
          <div className="p-3 bg-surface border border-border-hairline">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-ink-500">OVERALL SYSTEM HEALTH</span>
              <span className="text-sageSuccess font-semibold">100% OPERATIONAL</span>
            </div>
            <div className="w-full bg-surface-subtle h-1.5 overflow-hidden">
              <div className="bg-sageSuccess h-full w-full" />
            </div>
          </div>

          <div className="space-y-2.5">
            {systemSubsystems.map((sub, idx) => (
              <div
                key={idx}
                className="p-3 bg-surface border border-border-hairline space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sageSuccess" />
                    <span className="font-mono text-2xs font-bold text-ink-900">
                      {sub.name}
                    </span>
                  </div>
                  <span className="font-mono text-3xs bg-sageSuccess-subtle text-sageSuccess border border-sageSuccess-border px-1 py-0.5">
                    {sub.latencyMs}ms
                  </span>
                </div>
                <p className="font-mono text-3xs text-ink-500 pl-5.5">
                  {sub.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-surface border border-border-hairline space-y-2">
            <h4 className="font-mono text-3xs font-bold text-ink-500 uppercase tracking-widest">
              DEPLOYMENT ENVIRONMENT
            </h4>
            <div className="font-mono text-3xs text-ink-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-400">HOST:</span>
                <span>SIH-GOIP-PROD-IND-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">ZONE:</span>
                <span>ap-south-1 (Mumbai Region)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">ENCRYPTION:</span>
                <span>TLS 1.3 / AES-256 GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">SESSION:</span>
                <span>GOIP-SECURE-SESSION-ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-hairline bg-surface flex justify-end">
          <button
            onClick={() => setIsStatusDrawerOpen(false)}
            className="px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-white font-mono text-2xs uppercase tracking-wider"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
