import React from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  RotateCcw,
} from 'lucide-react';
import type { InterviewSessionDetail } from '../../types';

interface InterviewFinalReportProps {
  session: InterviewSessionDetail;
  onReviewQuestions: () => void;
  onNewInterview: () => void;
  onViewHistory: () => void;
}

export const InterviewFinalReport: React.FC<InterviewFinalReportProps> = ({
  session,
  onReviewQuestions,
  onNewInterview,
  onViewHistory,
}) => {
  const score = session.overall_score ?? 0;

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (sc >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onViewHistory}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Interview Sessions</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Completed on {new Date(session.completed_at || session.created_at).toLocaleDateString()}</span>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Hero Overview */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Interview Session Completed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {session.target_role}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {session.summary || 'Comprehensive assessment based on evaluated answers across all questions.'}
            </p>
          </div>

          {/* Overall Score Badge */}
          <div className={`p-6 rounded-2xl border text-center shrink-0 min-w-[150px] ${getScoreColor(score)}`}>
            <Award className="w-8 h-8 mx-auto mb-1 opacity-80" />
            <div className="text-4xl font-black">{score}</div>
            <div className="text-xs font-semibold uppercase tracking-wider mt-0.5 opacity-90">
              Overall Score
            </div>
          </div>
        </div>
      </div>

      {/* Competencies Breakdown: Strongest vs Weakest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Strongest Competencies
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Areas where your responses demonstrated solid technical accuracy, structured reasoning, and depth.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {(session.strongest_competencies || ['Technical Articulation', 'Problem Decomposition']).map((comp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{comp}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Weakest / Focus Areas */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertOctagon className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Priority Focus Areas
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Competencies where answers had missing edge cases, trade-offs, or precision gaps.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {(session.weakest_competencies || ['Edge Case Handling', 'Architectural Trade-offs']).map((comp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                <span>{comp}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Question Scores */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Individual Question Performance</span>
        </h3>

        <div className="space-y-3">
          {session.questions.map((q, idx) => {
            const ans = q.answer;
            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {q.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    {q.question_text}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {ans ? (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        ans.score >= 80
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ans.score >= 60
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {ans.score}/100
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Not Answered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Recommendations */}
      {session.recommendations && session.recommendations.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-white">Targeted Preparation Recommendations</h3>
          <ul className="space-y-2">
            {session.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <button
          onClick={onReviewQuestions}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
        >
          Review Questions &amp; Detailed Feedback
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNewInterview}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Another Interview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
