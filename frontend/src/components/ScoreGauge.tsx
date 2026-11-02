import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  rationale: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, rationale }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const circumference = 2 * Math.PI * 52; // r=52 -> ~326.7
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let colorClass = 'text-rose-500';
  let badgeClass = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
  let tierLabel = 'Needs Substantial Upskilling';

  if (clampedScore >= 80) {
    colorClass = 'text-emerald-400';
    badgeClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    tierLabel = 'Strong Fit & Readiness';
  } else if (clampedScore >= 60) {
    colorClass = 'text-amber-400';
    badgeClass = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    tierLabel = 'Moderate Fit & Potential';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Radial Progress Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r="52"
              className="text-slate-800"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="60"
              cy="60"
              r="52"
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {clampedScore}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Fit Score
            </span>
          </div>
        </div>

        {/* Details & Rationale */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tierLabel}</span>
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Info className="w-3 h-3 text-indigo-400" />
              <span>AI Estimate</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">Overall Career Fit Assessment</h3>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              {rationale}
            </p>
          </div>

          <p className="text-xs text-slate-500 italic">
            * Note: This score is an AI estimate calculated strictly from your uploaded resume against the target job requirements.
          </p>
        </div>
      </div>
    </div>
  );
};
