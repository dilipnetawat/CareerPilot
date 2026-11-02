import React, { useState } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  History,
  FileQuestion,
} from 'lucide-react';
import type { AnalysisListItem } from '../../types';

interface InterviewSetupProps {
  analyses: AnalysisListItem[];
  onStart: (analysisId: string) => Promise<void>;
  onViewHistory: () => void;
  loading: boolean;
  error: string | null;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({
  analyses,
  onStart,
  onViewHistory,
  loading,
  error,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    analyses.length > 0 ? analyses[0].id : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      onStart(selectedId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/30 p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>Phase 3 &bull; AI Mock Interview Engine</span>
          </div>

          <button
            onClick={onViewHistory}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Interview Sessions</span>
          </button>
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Role-Specific AI Mock Interview
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Practice 5 customized interview questions formulated directly from your verified resume strengths
          and prioritized skill gaps. Receive granular 100-point rubric evaluations and stronger model answers.
        </p>
      </div>

      {/* Format Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <FileQuestion className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white">5 Tailored Questions</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Balanced mix of technical architecture, practical debugging scenarios, and behavioral challenges.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white">100-Point Rubric</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Graded on Technical Accuracy (25), Relevance (20), Depth (20), Problem Solving (20), and Clarity (15).
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-white">Model Answer Feedback</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Actionable improvement tips, identified missing points, and senior candidate exemplar answers.
          </p>
        </div>
      </div>

      {/* Setup Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            1. Select Saved Career Analysis
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Your mock interview questions will be dynamically engineered based on this analysis report.
          </p>

          {analyses.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-400">
                No career analysis reports found. You must analyze your resume first to generate an interview.
              </p>
              <p className="text-xs text-slate-500">
                Please navigate to "New Career Analysis" in the sidebar to upload a resume and job description.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <label
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="analysis_selection"
                          checked={isSelected}
                          onChange={() => setSelectedId(item.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {item.target_role}
                          </h4>
                          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          item.fit_score >= 80
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.fit_score >= 60
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {item.fit_score}% Fit
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/50 flex items-center space-x-3 text-xs text-indigo-300">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
            <div>
              <span className="font-semibold text-white block">
                Engineering Interview Questions with Gemini AI...
              </span>
              <span>Synthesizing 5 technical, practical, and behavioral questions targeted to your skill gaps.</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedId || analyses.length === 0}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Mock Interview...</span>
            </>
          ) : (
            <>
              <span>Start AI Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
