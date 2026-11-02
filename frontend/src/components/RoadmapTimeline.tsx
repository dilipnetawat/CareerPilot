import React, { useState, useEffect, useCallback } from 'react';
import {
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
} from 'lucide-react';
import type { RoadmapWeek, RoadmapProgressResponse, RoadmapRevisionListItem } from '../types';
import {
  fetchRoadmapProgress,
  toggleRoadmapTask,
  updateAdaptivePlan,
  fetchRoadmapRevisions,
} from '../services/api';

interface RoadmapTimelineProps {
  weeks: RoadmapWeek[];
  analysisId?: string;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ weeks: initialWeeks, analysisId }) => {
  const [weeks, setWeeks] = useState<RoadmapWeek[]>(initialWeeks);
  const [progress, setProgress] = useState<RoadmapProgressResponse | null>(null);
  const [revisions, setRevisions] = useState<RoadmapRevisionListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialWeeks if prop updates
  useEffect(() => {
    setWeeks(initialWeeks);
  }, [initialWeeks]);

  const loadProgressAndRevisions = useCallback(async () => {
    if (!analysisId) return;
    try {
      setLoading(true);
      const [progData, revsData] = await Promise.all([
        fetchRoadmapProgress(analysisId),
        fetchRoadmapRevisions(analysisId),
      ]);
      setProgress(progData);
      setRevisions(revsData);
    } catch (err: unknown) {
      console.warn('Could not load persistent progress:', err);
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    loadProgressAndRevisions();
  }, [loadProgressAndRevisions]);

  const handleToggle = async (weekNumber: number, taskIndex: number, currentStatus: boolean) => {
    if (!analysisId) return;
    const key = `w${weekNumber}-t${taskIndex}`;
    setTogglingKey(key);
    setErrorMessage(null);

    try {
      const updated = await toggleRoadmapTask(analysisId, weekNumber, taskIndex, !currentStatus);
      setProgress(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task state.';
      setErrorMessage(msg);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleAdaptivePlan = async () => {
    if (!analysisId) return;
    setIsAdapting(true);
    setAdaptationMessage(null);
    setErrorMessage(null);

    try {
      const result = await updateAdaptivePlan(analysisId);
      if (result.adjusted) {
        setWeeks(result.four_week_roadmap);
        setAdaptationMessage(`Plan adapted (Revision #${result.revision_number}): ${result.reason_for_change}`);
        // Reload progress state with updated tasks
        await loadProgressAndRevisions();
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

  // Build quick map of task completions
  const completionMap: Record<string, { isCompleted: boolean; completedAt?: string | null }> = {};
  if (progress?.weekly_progress) {
    for (const wp of progress.weekly_progress) {
      for (const t of wp.tasks) {
        completionMap[`w${wp.week_number}-t${t.task_index}`] = {
          isCompleted: t.is_completed,
          completedAt: t.completed_at,
        };
      }
    }
  }

  const overallPct = progress?.overall_percentage ?? 0;
  const completedTasksCount = progress?.completed_tasks ?? 0;
  const totalTasksCount = progress?.total_tasks ?? weeks.reduce((acc, w) => acc + w.tasks.length, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and Adaptive Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              Adaptive 4-Week Career Roadmap
            </h3>
            {revisions.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                <History className="w-3 h-3" />
                <span>Rev #{revisions[0].revision_number}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step career acceleration plan synced with SQLite and adapted by Gemini AI based on your progress.
          </p>
        </div>

        {analysisId && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAdaptivePlan}
              disabled={isAdapting || loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
        )}
      </div>

      {/* Progress Bar & Summary Stats */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Overall Learning Progress</span>
            <span className="text-slate-400">
              ({completedTasksCount} of {totalTasksCount} tasks completed)
            </span>
          </div>
          <span className="font-bold text-indigo-300 text-sm">{overallPct}%</span>
        </div>

        {/* Outer bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
          />
        </div>
      </div>

      {/* Notification banner for adaptations */}
      {adaptationMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-start space-x-2.5 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{adaptationMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4-Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weeks.map((week) => {
          const weekProg = progress?.weekly_progress?.find((wp) => wp.week_number === week.week_number);
          const weekPct = weekProg?.percentage ?? 0;
          const weekCompleted = weekProg?.completed_tasks ?? 0;
          const weekTotal = weekProg?.total_tasks ?? week.tasks.length;

          return (
            <div
              key={week.week_number}
              className="flex flex-col justify-between p-5 rounded-xl bg-slate-950/70 border border-slate-800/90 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <span>WEEK {week.week_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {weekCompleted}/{weekTotal} done ({weekPct}%)
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {week.title}
                    </span>
                  </div>
                </div>

                {/* Week progress bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${weekPct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  <strong className="text-slate-300">Focus:</strong> {week.focus}
                </p>

                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Actionable Tasks
                  </span>
                  <ul className="space-y-2">
                    {week.tasks.map((task, idx) => {
                      const taskKey = `w${week.week_number}-t${idx}`;
                      const itemData = completionMap[taskKey];
                      const isDone = itemData?.isCompleted ?? false;
                      const completedAt = itemData?.completedAt;
                      const isThisToggling = togglingKey === taskKey;

                      return (
                        <li
                          key={taskKey}
                          onClick={() => handleToggle(week.week_number, idx, isDone)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer select-none flex items-start space-x-2.5 text-xs ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-900/30 text-slate-300'
                              : 'bg-slate-900/40 border-slate-800/60 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isThisToggling}
                            className="mt-0.5 text-indigo-400 shrink-0 focus:outline-none"
                          >
                            {isThisToggling ? (
                              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                            ) : isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span className={isDone ? 'line-through text-slate-400' : ''}>
                              {task}
                            </span>
                            {isDone && completedAt && (
                              <div className="flex items-center space-x-1 text-[10px] text-emerald-400/80 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>Completed {new Date(completedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Tangible Deliverable */}
              <div className="mt-2 pt-3 border-t border-slate-800/70 bg-indigo-950/20 -mx-5 -mb-5 p-3 px-5 flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-400 font-medium">Deliverable: </span>
                  <span className="text-indigo-200 font-medium">{week.expected_deliverable}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};