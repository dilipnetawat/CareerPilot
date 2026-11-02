import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckSquare,
  Square,
  Award,
  Sparkles,
  RefreshCw,
  Clock,
  History,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type {
  AnalysisRecord,
  AnalysisListItem,
  RoadmapProgressResponse,
  RoadmapRevisionListItem,
  AppView,
} from '../../types';
import {
  fetchRoadmapProgress,
  toggleRoadmapTask,
  updateAdaptivePlan,
  fetchRoadmapRevisions,
} from '../../services/api';

interface LearningProgressViewProps {
  activeRecord: AnalysisRecord | null;
  analyses: AnalysisListItem[];
  onSelectAnalysis: (id: string) => void;
  onSelectView: (view: AppView) => void;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({
  activeRecord,
  analyses,
  onSelectAnalysis,
  onSelectView,
}) => {
  const currentAnalysisId = activeRecord?.id || (analyses.length > 0 ? analyses[0].id : null);
  const currentTargetRole = activeRecord?.target_role || (analyses.length > 0 ? analyses[0].target_role : null);

  const [progress, setProgress] = useState<RoadmapProgressResponse | null>(null);
  const [revisions, setRevisions] = useState<RoadmapRevisionListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentAnalysisId) return;
    try {
      setLoading(true);
      setErrorState(null);
      const [prog, revs] = await Promise.all([
        fetchRoadmapProgress(currentAnalysisId),
        fetchRoadmapRevisions(currentAnalysisId),
      ]);
      setProgress(prog);
      setRevisions(revs);
    } catch (err: unknown) {
      console.warn('Could not load progress:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAnalysisId]);

  const setErrorState = (msg: string | null) => setErrorMessage(msg);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (weekNumber: number, taskIndex: number, currentStatus: boolean) => {
    if (!currentAnalysisId) return;
    const key = `w${weekNumber}-t${taskIndex}`;
    setTogglingKey(key);
    setErrorMessage(null);

    try {
      const updated = await toggleRoadmapTask(currentAnalysisId, weekNumber, taskIndex, !currentStatus);
      setProgress(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task state.';
      setErrorMessage(msg);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleAdaptivePlan = async () => {
    if (!currentAnalysisId) return;
    setIsAdapting(true);
    setAdaptationMessage(null);
    setErrorMessage(null);

    try {
      const result = await updateAdaptivePlan(currentAnalysisId);
      if (result.adjusted) {
        setAdaptationMessage(`Plan adapted (Revision #${result.revision_number}): ${result.reason_for_change}`);
        await loadData();
      } else {
        setAdaptationMessage(
          `Current roadmap verified: ${result.reason_for_change || 'Your existing trajectory aligns with your demonstrated progress.'}`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Adaptive roadmap update failed.';
      setErrorMessage(msg);
    } finally {
      setIsAdapting(false);
    }
  };

  if (!currentAnalysisId) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Career Analysis Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Upload your resume and paste a target job description to generate your personalized 4-week roadmap and start tracking persistent learning progress.
        </p>
        <button
          onClick={() => onSelectView('analysis')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 inline-flex items-center space-x-1.5 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Upload Resume &amp; Generate Roadmap</span>
        </button>
      </div>
    );
  }

  const overallPct = progress?.overall_percentage ?? 0;
  const completedTasksCount = progress?.completed_tasks ?? 0;
  const totalTasksCount = progress?.total_tasks ?? 0;

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Learning Progress &amp; Upskilling Metrics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracked for: <strong className="text-white">{currentTargetRole}</strong> &bull; Synced with SQLite persistence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {analyses.length > 1 && (
            <select
              value={currentAnalysisId || ''}
              onChange={(e) => onSelectAnalysis(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {analyses.map((a) => (
                <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                  {a.target_role} ({a.fit_score}%)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleAdaptivePlan}
            disabled={isAdapting || loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isAdapting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Adapting Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Update My Learning Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {adaptationMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-start space-x-2.5 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{adaptationMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">4-Week Completion Velocity</h3>
              <p className="text-xs text-slate-400">
                {completedTasksCount} of {totalTasksCount} tasks verified in SQLite
              </p>
            </div>
          </div>
          <span className="text-2xl font-black text-indigo-300">{overallPct}%</span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
          />
        </div>
      </div>

      {/* Weekly Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {progress?.weekly_progress.map((week) => (
          <div
            key={week.week_number}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <span>WEEK {week.week_number}</span>
              </div>
              <div className="text-xs text-slate-300 font-semibold">
                {week.completed_tasks}/{week.total_tasks} completed ({week.percentage}%)
              </div>
            </div>

            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${week.percentage}%` }}
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-slate-400">Focus:</strong> {week.focus}
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Weekly Deliverables
              </span>
              <ul className="space-y-1.5">
                {week.tasks.map((task) => {
                  const isThisToggling = togglingKey === `w${week.week_number}-t${task.task_index}`;
                  return (
                    <li
                      key={task.id}
                      onClick={() => handleToggle(week.week_number, task.task_index, task.is_completed)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer select-none flex items-start space-x-2.5 text-xs ${
                        task.is_completed
                          ? 'bg-emerald-950/20 border-emerald-900/30 text-slate-300'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={isThisToggling}
                        className="mt-0.5 text-indigo-400 shrink-0 focus:outline-none"
                      >
                        {isThisToggling ? (
                          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                        ) : task.is_completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <div className="flex-1">
                        <span className={task.is_completed ? 'line-through text-slate-400' : ''}>
                          {task.task_text}
                        </span>
                        {task.is_completed && task.completed_at && (
                          <div className="flex items-center space-x-1 text-[10px] text-emerald-400/80 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Completed {new Date(task.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/40 flex items-center space-x-2 text-xs">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400">Deliverable: </span>
                <span className="text-indigo-200 font-medium">{week.expected_deliverable}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revision History Section */}
      {revisions.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Adaptive Learning Plan Revision History</h3>
          </div>
          <div className="space-y-2">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-indigo-300 font-semibold">
                  <span>Revision #{rev.revision_number}</span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{rev.reason_for_change}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
