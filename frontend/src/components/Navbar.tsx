import React from 'react';
import { Menu, Compass, User, LogOut } from 'lucide-react';
import type { HealthStatus } from '../types';

interface NavbarProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onToggleSidebar?: () => void;
  candidateName?: string;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  loading,
  error,
  onToggleSidebar,
  candidateName,
  onSignOut,
}) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                CareerPilot <span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                AI-Powered Career Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {candidateName && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-200 font-medium">{candidateName}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Demo
              </span>
            </div>
          )}

          {/* Backend Status Pill */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              loading
                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                : isHealthy
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                loading
                  ? 'bg-amber-400 animate-pulse'
                  : isHealthy
                  ? 'bg-emerald-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">
              {loading
                ? 'Checking API...'
                : isHealthy
                ? 'Backend Live'
                : error
                ? 'API Disconnected'
                : 'Status Degraded'}
            </span>
            <span className="sm:hidden font-mono text-[10px]">
              {isHealthy ? 'Live' : 'Off'}
            </span>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Exit demo session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
