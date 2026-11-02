import React from 'react';
import {
  Compass,
  LayoutDashboard,
  FileText,
  Calendar,
  MessageSquareCode,
  TrendingUp,
  Briefcase,
  ChevronRight,
  X,
  LogOut,
  User,
  History,
  FileCheck,
} from 'lucide-react';
import type {
  AnalysisListItem,
  HealthStatus,
  InterviewSessionListItem,
  AppView,
} from '../types';

interface SidebarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  recentAnalyses: AnalysisListItem[];
  selectedAnalysisId: string | null;
  onSelectAnalysis: (id: string) => void;
  recentInterviews: InterviewSessionListItem[];
  selectedInterviewId: string | null;
  onSelectInterview: (id: string) => void;
  health: HealthStatus | null;
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  recentAnalyses,
  selectedAnalysisId,
  onSelectAnalysis,
  recentInterviews,
  selectedInterviewId,
  onSelectInterview,
  health,
  isOpen,
  onClose,
  candidateName,
  onSignOut,
}) => {
  const isHealthy = health?.status === 'healthy';

  const isInterviewView =
    currentView === 'interview_setup' ||
    currentView === 'interview_workspace' ||
    currentView === 'interview_report' ||
    currentView === 'interview_history';

  const isAnalysisView = currentView === 'analysis' || currentView === 'report';
  const isApplicationView = currentView === 'applications' || currentView === 'applications_analytics';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">
                  CareerPilot <span className="text-indigo-400">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400">Candidate Workspace</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="px-4 pt-4 pb-2">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{candidateName}</p>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-400">Demo Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Logical Sections */}
          <div className="p-4 space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace Modules
            </div>

            {/* 1. Overview */}
            <button
              onClick={() => {
                onSelectView('overview');
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>Overview</span>
            </button>

            {/* 2. Resume Analysis */}
            <button
              onClick={() => {
                onSelectView('analysis');
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isAnalysisView
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Resume Analysis</span>
            </button>

            {/* 3. Career Roadmap */}
            <button
              onClick={() => {
                onSelectView('roadmap');
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Career Roadmap</span>
            </button>

            {/* 4. AI Mock Interview */}
            <button
              onClick={() => {
                onSelectView('interview_setup');
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isInterviewView
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MessageSquareCode className="w-4 h-4 shrink-0 text-purple-400" />
              <span>AI Mock Interview</span>
            </button>

            {/* 5. Learning Progress */}
            <button
              onClick={() => {
                onSelectView('progress');
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'progress'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Learning Progress</span>
            </button>

            {/* 6. Job Applications */}
            <button
              onClick={() => {
                onSelectView('applications');
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isApplicationView
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Job Applications</span>
            </button>
          </div>

          {/* Saved History Accordion */}
          <div className="px-4 py-2 space-y-4">
            {/* Saved Analyses */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <FileCheck className="w-3 h-3" />
                  <span>Saved Reports</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {recentAnalyses.length}
                </span>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {recentAnalyses.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-[11px] text-slate-500">
                    <p>No analyses saved yet.</p>
                  </div>
                ) : (
                  recentAnalyses.map((item) => {
                    const isSelected = selectedAnalysisId === item.id && currentView === 'report';
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectAnalysis(item.id);
                          onClose();
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-slate-800 border border-indigo-500/50 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-medium text-white truncate text-xs">
                            {item.target_role}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.fit_score >= 80
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.fit_score >= 60
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.fit_score}%
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Saved Interviews */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <History className="w-3 h-3" />
                  <span>Interview Sessions</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {recentInterviews.length}
                </span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {recentInterviews.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-[11px] text-slate-500">
                    <p>No interviews yet.</p>
                  </div>
                ) : (
                  recentInterviews.map((sess) => {
                    const isSelected = selectedInterviewId === sess.id && isInterviewView;
                    return (
                      <button
                        key={sess.id}
                        onClick={() => {
                          onSelectInterview(sess.id);
                          onClose();
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-slate-800 border border-indigo-500/50 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-medium text-white truncate text-xs">
                            {sess.target_role}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {sess.status === 'completed'
                              ? `Score: ${sess.overall_score ?? 0} pts`
                              : `${sess.questions_answered}/5 Answered`}
                          </p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Sign Out & Health Pill */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
          <button
            onClick={onSignOut}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Exit Demo / Sign Out</span>
          </button>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span>FastAPI &bull; SQLite</span>
            </div>
            <span>{isHealthy ? 'Connected' : 'Degraded'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
