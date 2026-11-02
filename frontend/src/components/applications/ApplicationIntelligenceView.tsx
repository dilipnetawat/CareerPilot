import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Award,
  RefreshCw,
  Sparkles,
  PieChart,
  BarChart3,
  Layers,
  Info,
} from 'lucide-react';
import type { ApplicationAnalytics } from '../../types';
import { fetchApplicationAnalytics } from '../../services/api';

interface ApplicationIntelligenceViewProps {
  onNavigateToTracker: () => void;
}

export const ApplicationIntelligenceView: React.FC<ApplicationIntelligenceViewProps> = ({
  onNavigateToTracker,
}) => {
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApplicationAnalytics();
      setAnalytics(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load application analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Calculating recruitment funnel analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-300 font-semibold">{error || 'Unable to compute analytics'}</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    total_applications,
    response_count,
    response_rate,
    interview_conversion_rate,
    offer_count,
    status_distribution,
    category_analytics,
    has_sufficient_data,
    insight_summary,
  } = analytics;

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Application Intelligence &amp; Funnel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real metrics calculated directly from your SQLite job application tracker.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToTracker}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Manage Applications</span>
          </button>
        </div>
      </div>

      {/* Insufficient Data Alert if total < 5 */}
      {!has_sufficient_data && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-start space-x-3 text-xs">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">Limited Sample Size ({total_applications}/5 Tracked)</h4>
            <p className="leading-relaxed">{insight_summary}</p>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tracked</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{total_applications}</span>
            <span className="text-xs text-slate-400">applications</span>
          </div>
          <p className="text-[11px] text-slate-400">Logged across all recruitment tracks</p>
        </div>

        {/* Response Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Response Rate</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-blue-400">{response_rate}%</span>
            <span className="text-xs text-slate-400">({response_count} responses)</span>
          </div>
          <p className="text-[11px] text-slate-400">Callbacks, assessments &amp; rejections</p>
        </div>

        {/* Interview Conversion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Interview Conversion</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-purple-400">{interview_conversion_rate}%</span>
            <span className="text-xs text-slate-400">funnel rate</span>
          </div>
          <p className="text-[11px] text-slate-400">Applications converted to live interview rounds</p>
        </div>

        {/* Offers Secured */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Offers Secured</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">{offer_count}</span>
            <span className="text-xs text-slate-400">accepted/received</span>
          </div>
          <p className="text-[11px] text-slate-400">Final hiring offers extended</p>
        </div>
      </div>

      {/* AI Strategic Intelligence Insights Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl space-y-2.5">
        <div className="flex items-center space-x-2 text-indigo-300">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            CareerPilot Recruitment Intelligence Insight
          </h3>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {insight_summary}
        </p>
      </div>

      {/* Two Column Section: Pipeline Funnel + Category Conversion Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Status Distribution Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Recruitment Pipeline Distribution</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Saved', color: 'bg-slate-600', key: 'Saved' },
              { label: 'Applied', color: 'bg-blue-500', key: 'Applied' },
              { label: 'Assessment', color: 'bg-indigo-500', key: 'Assessment' },
              { label: 'Interview', color: 'bg-purple-500', key: 'Interview' },
              { label: 'Offer', color: 'bg-emerald-500', key: 'Offer' },
              { label: 'Rejected', color: 'bg-rose-500', key: 'Rejected' },
            ].map(({ label, color, key }) => {
              const count = status_distribution[key] || 0;
              const pct = total_applications > 0 ? Math.round((count / total_applications) * 100) : 0;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Track & Category Analytics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Performance by Role Track</span>
          </h3>

          {category_analytics.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <p>No track data recorded yet. Log applications to see role performance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Role Track</th>
                    <th className="py-2.5 px-3 text-center">Applications</th>
                    <th className="py-2.5 px-3 text-center">Responses</th>
                    <th className="py-2.5 px-3 text-right">Response Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {category_analytics.map((cat) => (
                    <tr key={cat.role_category} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {cat.role_category}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        {cat.total_applications}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        {cat.responses}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            cat.response_rate >= 50
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : cat.response_rate > 0
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cat.response_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};