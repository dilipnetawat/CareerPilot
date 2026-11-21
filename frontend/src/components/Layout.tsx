import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type {
  HealthStatus,
  AnalysisListItem,
  InterviewSessionListItem,
  AppView,
} from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  recentAnalyses: AnalysisListItem[];
  selectedAnalysisId: string | null;
  onSelectAnalysis: (id: string) => void;
  recentInterviews: InterviewSessionListItem[];
  selectedInterviewId: string | null;
  onSelectInterview: (id: string) => void;
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  candidateName?: string;
  isDemo?: boolean;
  onSignOut?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onSelectView,
  recentAnalyses,
  selectedAnalysisId,
  onSelectAnalysis,
  recentInterviews,
  selectedInterviewId,
  onSelectInterview,
  health,
  loading,
  error,
  candidateName = 'Candidate (Demo)',
  isDemo = false,
  onSignOut,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Responsive Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={onSelectView}
        recentAnalyses={recentAnalyses}
        selectedAnalysisId={selectedAnalysisId}
        onSelectAnalysis={onSelectAnalysis}
        recentInterviews={recentInterviews}
        selectedInterviewId={selectedInterviewId}
        onSelectInterview={onSelectInterview}
        health={health}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        candidateName={candidateName}
        isDemo={isDemo}
        onSignOut={onSignOut || (() => {})}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Shared Demo Warning Banner */}
        {isDemo && (
          <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-20">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You&apos;re exploring a shared demo account. Do not enter personal or sensitive information.</span>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Shared Demo
            </span>
          </div>
        )}

        <Navbar
          health={health}
          loading={loading}
          error={error}
          onToggleSidebar={() => setSidebarOpen(true)}
          candidateName={candidateName}
          isDemo={isDemo}
          onSignOut={onSignOut}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <p>CareerPilot AI &copy; 2026 &bull; Core AI Career Intelligence &amp; Mock Interview Engine</p>
        </footer>
      </div>
    </div>
  );
};
