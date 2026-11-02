import React, { useState } from 'react';
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
        onSignOut={onSignOut || (() => {})}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar
          health={health}
          loading={loading}
          error={error}
          onToggleSidebar={() => setSidebarOpen(true)}
          candidateName={candidateName}
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
