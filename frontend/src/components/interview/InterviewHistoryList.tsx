import React from 'react';
import {
  History,
  PlusCircle,
  Clock,
  ArrowRight,
  MessageSquareCode,
  CheckCircle2,
  Hourglass,
} from 'lucide-react';
import type { InterviewSessionListItem } from '../../types';

interface InterviewHistoryListProps {
  sessions: InterviewSessionListItem[];
  onSelectSession: (id: string) => void;
  onNewInterview: () => void;
  loading: boolean;
}

export const InterviewHistoryList: React.FC<InterviewHistoryListProps> = ({
  sessions,
  onSelectSession,
  onNewInterview,
  loading,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2.5">
            <History className="w-6 h-6 text-indigo-400" />
            <span>AI Mock Interview Sessions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review past practice sessions, resume unfinished interviews, and monitor your score progression.
          </p>
        </div>

        <button
          onClick={onNewInterview}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Mock Interview</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">
          Loading past interview sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <MessageSquareCode className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No Interview Sessions Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Start an AI Mock Interview based on your saved Career Analysis Report to practice role-specific technical, practical, and behavioral questions.
            </p>
          </div>
          <button
            onClick={onNewInterview}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Your First Interview</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const isCompleted = sess.status === 'completed';
            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess.id)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {sess.target_role}
                    </h3>
                    {isCompleted ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Hourglass className="w-3 h-3" />
                        <span>In Progress</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(sess.created_at).toLocaleDateString()}</span>
                    </span>
                    <span>&bull;</span>
                    <span>
                      {sess.questions_answered} of {sess.questions_total} Questions Answered
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  {isCompleted && sess.overall_score !== null && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Final Score
                      </span>
                      <span
                        className={`text-xl font-black ${
                          sess.overall_score >= 80
                            ? 'text-emerald-400'
                            : sess.overall_score >= 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {sess.overall_score}/100
                      </span>
                    </div>
                  )}

                  <div className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>{isCompleted ? 'View Report' : 'Resume'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
