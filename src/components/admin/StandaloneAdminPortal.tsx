import React from 'react';
import { AdminAICommandCenter } from './AdminAICommandCenter';
import { useTuxi } from '../../context/TuxiContext';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ExternalLink, 
  Sun, 
  Moon, 
  Lock, 
  Globe, 
  AlertTriangle,
  Server
} from 'lucide-react';

interface StandaloneAdminPortalProps {
  onReturnToApp: () => void;
}

export const StandaloneAdminPortal: React.FC<StandaloneAdminPortalProps> = ({ onReturnToApp }) => {
  const { theme, toggleTheme, config, activeCity } = useTuxi();

  return (
    <div className="min-h-screen bg-[var(--bg-app)] dark:bg-slate-950 text-[var(--text-primary)] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Dedicated Standalone Enterprise Admin Header */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Secure Admin Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-md">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-cyan-300 font-bold uppercase tracking-wider">
                    SECURE PORTAL
                  </span>
                  <span className="text-base font-black tracking-tight text-white">
                    TUXI AI Command Center
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    /admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Dedicated Infrastructure, Autonomous AI Dispatch &amp; Regional Governance Control
                </p>
              </div>
            </div>

            {/* Right: Quick Actions & Exit to Main App */}
            <div className="flex items-center gap-3">
              
              {/* Active Market Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-300">
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                <span className="font-semibold text-white">{activeCity.city}</span>
                <span className="text-slate-400">({activeCity.currencyCode})</span>
              </div>

              {/* Dark / Light Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
              </button>

              {/* Navigation Back to Customer/Driver/Merchant App */}
              <button
                onClick={onReturnToApp}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md transition-all border border-indigo-400/30 cursor-pointer"
                title="Return to the consumer and merchant marketplace"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Marketplace App</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Main Admin Console Workspace */}
      <main className="flex-1 pb-16">
        <AdminAICommandCenter />
      </main>

      {/* Dedicated Admin Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-semibold">TUXI Autonomous Command Server</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-400">Route: /admin</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">Strict Separation Mode</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReturnToApp}
              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1"
            >
              <span>Back to Public Marketplace</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
