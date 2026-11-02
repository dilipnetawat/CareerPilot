import React from 'react';
import {
  Briefcase,
  FileText,
  Calendar,
  MessageSquareCode,
  Award,
  PlusCircle,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type {
  AnalysisRecord,
  AnalysisListItem,
  InterviewSessionListItem,
  AppView,
} from '../../types';

interface OverviewViewProps {
  activeRecord: AnalysisRecord | null;
  analyses: AnalysisListItem[];
  interviews: InterviewSessionListItem[];
  onSelectView: (view: AppView) => void;
  onSelectAnalysis: (id: string) => void;
  onSelectInterview: (id: string) => void;
  candidateName: string;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeRecord,
  analyses,
  interviews,
  onSelectView,
  onSelectAnalysis,
  onSelectInterview,
  candidateName,
}) => {
  const latestAnalysis = activeRecord || (analyses.length > 0 ? analyses[0] : null);
  const fitScore = activeRecord?.fit_score ?? (latestAnalysis ? latestAnalysis.fit_score : null);
  const targetRole = activeRecord?.target_role ?? (latestAnalysis ? latestAnalysis.target_role : 'No target role configured');

  const completedInterviews = interviews.filter((s) => s.status === 'completed');
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((acc, s) => acc + (s.overall_score || 0), 0) /
            completedInterviews.length
        )
      : null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* 1. Welcome Hero Banner */}
      <div className="rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Candidate Career Cockpit</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {candidateName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Target Track: <strong className="text-white">{targetRole}</strong>.
              Review your evidence-based skill analysis, track your adaptive 4-week roadmap, and drill role-specific mock interviews.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onSelectView('analysis')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
            <button
              onClick={() => onSelectView('interview_setup')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <MessageSquareCode className="w-4 h-4 text-emerald-400" />
              <span>Mock Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Career Fit Score */}
        <div
          onClick={() => {
            if (activeRecord) onSelectView('report');
            else if (analyses.length > 0) onSelectAnalysis(analyses[0].id);
            else onSelectView('analysis');
          }}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Career Fit Score</span>
            <Award className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">
              {fitScore !== null ? `${fitScore}%` : '—'}
            </span>
            <span className="text-xs text-slate-400">AI estimate</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {latestAnalysis ? targetRole : 'No analysis run yet'}
          </p>
        </div>

        {/* Metric 2: 4-Week Roadmap */}
        <div
          onClick={() => onSelectView('roadmap')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Learning Roadmap</span>
            <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-400">4 Weeks</span>
            <span className="text-xs text-slate-400">structured</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Persistent tasks in SQLite
          </p>
        </div>

        {/* Metric 3: Mock Interviews */}
        <div
          onClick={() => onSelectView('interview_history')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mock Interviews</span>
            <MessageSquareCode className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-purple-400">
              {avgScore !== null ? `${avgScore}` : interviews.length}
            </span>
            <span className="text-xs text-slate-400">
              {avgScore !== null ? 'avg score / 100' : 'sessions logged'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {completedInterviews.length} completed sessions
          </p>
        </div>

        {/* Metric 4: Job Tracker */}
        <div
          onClick={() => onSelectView('applications')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Job Tracker</span>
            <Briefcase className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-400">Pipeline</span>
            <span className="text-xs text-slate-400">active</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Manage &amp; analyze applications
          </p>
        </div>
      </div>

      {/* 3. Two-Column Activity Section: Saved Reports vs Mock Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Saved Career Analyses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Saved Career Analyses</h3>
            </div>
            <button
              onClick={() => onSelectView('analysis')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center space-x-1"
            >
              <span>+ New Analysis</span>
            </button>
          </div>

          {analyses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-3">
              <p>No career analyses recorded yet.</p>
              <button
                onClick={() => onSelectView('analysis')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
              >
                Upload First Resume
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectAnalysis(item.id)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-0.5 max-w-sm truncate">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {item.target_role}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.candidate_summary}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        item.fit_score >= 80
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.fit_score >= 60
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.fit_score}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Mock Interviews */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <MessageSquareCode className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Recent Mock Interviews</h3>
            </div>
            <button
              onClick={() => onSelectView('interview_setup')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 cursor-pointer flex items-center space-x-1"
            >
              <span>+ Start Session</span>
            </button>
          </div>

          {interviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-3">
              <p>No mock interview sessions recorded yet.</p>
              <button
                onClick={() => onSelectView('interview_setup')}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium cursor-pointer"
              >
                Launch First Session
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {interviews.slice(0, 4).map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectInterview(session.id)}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-0.5 max-w-sm truncate">
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                      {session.target_role}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Progress: {session.questions_answered} of {session.questions_total} answered
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        session.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {session.status === 'completed'
                        ? `${session.overall_score ?? 0} pts`
                        : 'In Progress'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
